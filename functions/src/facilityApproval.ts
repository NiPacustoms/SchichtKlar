/**
 * Freigabe-Link für Einrichtungen
 *
 * Die Disposition erzeugt für eine Einrichtung und einen Zeitraum einen Link.
 * Die Pflegedienstleitung öffnet ihn ohne Konto, sieht die erfassten Dienste
 * ihres Hauses und bestätigt sie gesammelt oder lehnt einzelne mit Grund ab.
 *
 * Sicherheit
 * - Der Link enthält ein zufälliges 256-Bit-Token; gespeichert wird nur dessen
 *   SHA-256-Hash (Dokument-ID). Ein Datenbankleck verrät keine gültigen Links.
 * - Ablauf nach 14 Tagen, Widerruf durch die Disposition.
 * - Die Collection ist für Clients komplett gesperrt (nur Admin SDK).
 * - Öffentlich sichtbar ist nur, was zur Bestätigung nötig ist: Vorname und
 *   Initial, Datum, Zeiten, Pause, Stunden. Keine Kontaktdaten, keine Löhne.
 * - Freigegebene Zeiten bleiben unveränderlich (GoBD); bereits Freigegebenes
 *   wird nicht erneut angefasst.
 */
import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createHash, randomBytes } from 'crypto';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { requireAdmin } from './utils/tenant';

const db = admin.firestore();
const TZ = 'Europe/Berlin';
const REGION = 'europe-west1';
const TTL_DAYS = 14;
const MAX_DAYS = 31;

export const APPROVAL_COLLECTION = 'facilityApprovalLinks';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

function shortName(displayName: unknown): string {
  const parts = String(displayName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Mitarbeiter/in';
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function dayRange(fromKey: string, toKey: string): { start: Date; end: Date } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromKey) || !/^\d{4}-\d{2}-\d{2}$/.test(toKey)) {
    throw new HttpsError('invalid-argument', 'Zeitraum im Format JJJJ-MM-TT angeben.');
  }
  const start = fromZonedTime(`${fromKey}T00:00:00`, TZ);
  const end = fromZonedTime(`${toKey}T23:59:59.999`, TZ);
  if (end < start) throw new HttpsError('invalid-argument', 'Das Ende liegt vor dem Beginn.');
  if ((end.getTime() - start.getTime()) / 86_400_000 > MAX_DAYS) {
    throw new HttpsError('invalid-argument', `Höchstens ${MAX_DAYS} Tage je Link.`);
  }
  return { start, end };
}

type LinkDoc = {
  companyId: string;
  facilityId: string;
  facilityName: string;
  companyName: string;
  fromKey: string;
  toKey: string;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  revokedAt?: Timestamp | null;
  lastDecisionAt?: Timestamp | null;
};

async function loadLink(token: unknown): Promise<{ ref: admin.firestore.DocumentReference; link: LinkDoc }> {
  if (typeof token !== 'string' || token.length < 40 || token.length > 100) {
    throw new HttpsError('not-found', 'Dieser Link ist ungültig.');
  }
  const ref = db.collection(APPROVAL_COLLECTION).doc(sha256(token));
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Dieser Link ist ungültig.');
  const link = snap.data() as LinkDoc;
  if (link.revokedAt) throw new HttpsError('failed-precondition', 'Dieser Link wurde zurückgezogen.');
  if (link.expiresAt.toMillis() < Date.now()) throw new HttpsError('deadline-exceeded', 'Dieser Link ist abgelaufen.');
  return { ref, link };
}

/** Dienste, die über den Link bestätigt werden können */
async function sheetsFor(link: LinkDoc) {
  const { start, end } = dayRange(link.fromKey, link.toKey);
  const snap = await db
    .collection('timesheets')
    .where('companyId', '==', link.companyId)
    .where('facilityId', '==', link.facilityId)
    .where('date', '>=', Timestamp.fromDate(start))
    .where('date', '<=', Timestamp.fromDate(end))
    .get();
  // Laufende Dienste (Ende fehlt/gleich Beginn) sind nicht bestätigbar
  return snap.docs.filter(d => {
    const x = d.data();
    return x.endTime && x.endTime !== x.startTime && x.status !== 'rejected';
  });
}

/** Disposition: Link für Einrichtung + Zeitraum erzeugen */
export const createFacilityApprovalLink = onCall({ region: REGION }, async request => {
  const caller = await requireAdmin(request.auth as never);
  const { facilityId, from, to } = (request.data || {}) as { facilityId?: string; from?: string; to?: string };
  if (!facilityId) throw new HttpsError('invalid-argument', 'Einrichtung fehlt.');
  dayRange(String(from), String(to));

  const facSnap = await db.collection('facilities').doc(facilityId).get();
  if (!facSnap.exists || facSnap.data()?.companyId !== caller.companyId) {
    throw new HttpsError('permission-denied', 'Einrichtung gehört nicht zu Ihrer Firma.');
  }
  const companySnap = await db.collection('companies').doc(caller.companyId).get();

  const token = randomBytes(32).toString('base64url');
  const now = Timestamp.now();
  const link: LinkDoc = {
    companyId: caller.companyId,
    facilityId,
    facilityName: String(facSnap.data()?.name || 'Einrichtung'),
    companyName: String(companySnap.data()?.name || ''),
    fromKey: String(from),
    toKey: String(to),
    createdBy: caller.uid,
    createdAt: now,
    expiresAt: Timestamp.fromMillis(now.toMillis() + TTL_DAYS * 86_400_000),
    revokedAt: null,
    lastDecisionAt: null,
  };
  await db.collection(APPROVAL_COLLECTION).doc(sha256(token)).set(link);

  const pending = (await sheetsFor(link)).filter(d => d.data().status !== 'approved').length;
  return {
    token,
    expiresAt: link.expiresAt.toDate().toISOString(),
    pending,
    facilityEmail: (facSnap.data()?.email as string | undefined) ?? null,
    facilityContact: (facSnap.data()?.contactPerson as string | undefined) ?? null,
  };
});

/** Disposition: Link zurückziehen */
export const revokeFacilityApprovalLink = onCall({ region: REGION }, async request => {
  const caller = await requireAdmin(request.auth as never);
  const token = (request.data || {}).token;
  const ref = db.collection(APPROVAL_COLLECTION).doc(sha256(String(token || '')));
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.companyId !== caller.companyId) throw new HttpsError('not-found', 'Link nicht gefunden.');
  await ref.update({ revokedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

/** Öffentlich: Inhalt des Links (ohne Anmeldung) */
export const getFacilityApproval = onCall({ region: REGION }, async request => {
  const { link } = await loadLink((request.data || {}).token);
  const docs = await sheetsFor(link);
  const userIds = [...new Set(docs.map(d => String(d.data().userId)))];
  const users = await Promise.all(userIds.map(id => db.collection('users').doc(id).get()));
  const nameOf = Object.fromEntries(users.map(u => [u.id, shortName(u.data()?.displayName)]));

  const entries = docs
    .map(d => {
      const x = d.data();
      const date = (x.date as Timestamp).toDate();
      return {
        id: d.id,
        person: nameOf[String(x.userId)] ?? 'Mitarbeiter/in',
        day: formatInTimeZone(date, TZ, 'yyyy-MM-dd'),
        startTime: String(x.startTime),
        endTime: String(x.endTime),
        breakMinutes: Number(x.breakMinutes) || 0,
        totalHours: Number(x.totalHours) || 0,
        station: x.station ? String(x.station) : null,
        status: x.status === 'approved' ? 'approved' : 'open',
        signerName: x.status === 'approved' ? (x.facilitySignerName ? String(x.facilitySignerName) : null) : null,
      };
    })
    .sort((a, b) => a.day.localeCompare(b.day) || a.startTime.localeCompare(b.startTime) || a.person.localeCompare(b.person));

  return {
    facilityName: link.facilityName,
    companyName: link.companyName,
    from: link.fromKey,
    to: link.toKey,
    expiresAt: link.expiresAt.toDate().toISOString(),
    entries,
  };
});

/** Öffentlich: Einrichtung bestätigt Dienste und/oder lehnt einzelne mit Grund ab */
export const decideFacilityApproval = onCall({ region: REGION }, async request => {
  const data = (request.data || {}) as {
    token?: string;
    signerName?: string;
    signerRole?: string;
    approveIds?: string[];
    rejections?: { id: string; reason: string }[];
    confirm?: boolean;
  };
  const { ref, link } = await loadLink(data.token);
  const signerName = String(data.signerName || '').trim();
  if (signerName.length < 3 || signerName.length > 80) throw new HttpsError('invalid-argument', 'Bitte Ihren vollständigen Namen angeben.');
  if (data.confirm !== true) throw new HttpsError('invalid-argument', 'Bitte bestätigen, dass die Zeiten geleistet wurden.');
  const approveIds = Array.isArray(data.approveIds) ? data.approveIds.map(String) : [];
  const rejections = Array.isArray(data.rejections) ? data.rejections : [];
  if (!approveIds.length && !rejections.length) throw new HttpsError('invalid-argument', 'Keine Dienste ausgewählt.');
  for (const r of rejections) {
    if (!r || typeof r.reason !== 'string' || r.reason.trim().length < 5) {
      throw new HttpsError('invalid-argument', 'Für jede Ablehnung bitte einen Grund angeben (mind. 5 Zeichen).');
    }
  }

  // Nur Dienste dieses Links sind änderbar
  const allowed = new Map((await sheetsFor(link)).map(d => [d.id, d]));
  const role = String(data.signerRole || '').trim().slice(0, 60) || null;
  const meta = {
    facilityApprovedVia: 'link',
    facilityApprovalLinkId: ref.id,
    facilitySignerName: signerName,
    facilitySignerRole: role,
    facilitySignedAt: FieldValue.serverTimestamp(),
    facilityConfirmationStatus: 'performed',
    facilitySignerIpHash: request.rawRequest?.ip ? sha256(String(request.rawRequest.ip)).slice(0, 16) : null,
  };

  let approved = 0;
  let rejected = 0;
  let skipped = 0;
  const batch = db.batch();
  for (const id of approveIds) {
    const d = allowed.get(id);
    if (!d || d.data().status === 'approved') {
      skipped++;
      continue;
    }
    batch.update(d.ref, { ...meta, status: 'approved', approvedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    approved++;
  }
  for (const r of rejections) {
    const d = allowed.get(String(r.id));
    if (!d || d.data().status === 'approved') {
      skipped++;
      continue;
    }
    batch.update(d.ref, {
      status: 'rejected',
      rejectionReason: `Einrichtung (${signerName}): ${r.reason.trim().slice(0, 300)}`,
      rejectedVia: 'facility-link',
      updatedAt: FieldValue.serverTimestamp(),
    });
    rejected++;
  }
  batch.update(ref, { lastDecisionAt: FieldValue.serverTimestamp() });
  batch.set(db.collection('auditLogs').doc(), {
    action: 'facility_approval_link_decision',
    resourceType: 'facilityApprovalLink',
    resourceId: ref.id,
    companyId: link.companyId,
    facilityId: link.facilityId,
    signerName,
    approved,
    rejected,
    severity: 'info',
    timestamp: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return { approved, rejected, skipped };
});
