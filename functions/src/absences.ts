/**
 * Abwesenheiten (Urlaub, Krankheit) – Serverseite.
 *
 * - isAbsentOn: Planung schlägt abwesende Personen nicht vor
 * - onAbsenceWritten: benachrichtigt die Disposition bei neuem Antrag /
 *   Krankmeldung und die Person bei Entscheidung; listet betroffene Einsätze
 *   am Abwesenheitsdokument (affectedAssignmentIds), damit die Disposition
 *   umplanen kann.
 */
import * as admin from 'firebase-admin';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { formatInTimeZone } from 'date-fns-tz';
import { DAY_RULE_ACTIVE_STATUSES } from './utils/dayRule';

const BLOCKING = ['approved', 'reported'];
const TZ = 'Europe/Berlin';

function deDay(key: string) {
  const [y, m, d] = key.split('-');
  return `${d}.${m}.${y}`;
}

/** Ist die Person am Kalendertag (YYYY-MM-DD) abwesend (genehmigter Urlaub / Krankmeldung)? */
export async function isAbsentOn(db: Firestore, userId: string, companyId: string | undefined, dayKey: string): Promise<boolean> {
  let q = db.collection('absences').where('userId', '==', userId);
  if (companyId) q = q.where('companyId', '==', companyId);
  const snap = await q.where('status', 'in', BLOCKING).get();
  return snap.docs.some(d => {
    const a = d.data();
    return typeof a.fromKey === 'string' && typeof a.toKey === 'string' && a.fromKey <= dayKey && dayKey <= a.toKey;
  });
}

/** Aktive Einsätze der Person im Zeitraum (über startDate bzw. Schichtdatum) */
async function assignmentsInRange(db: Firestore, userId: string, companyId: string, fromKey: string, toKey: string): Promise<string[]> {
  const snap = await db
    .collection('assignments')
    .where('userId', '==', userId)
    .where('companyId', '==', companyId)
    .where('status', 'in', [...DAY_RULE_ACTIVE_STATUSES])
    .get();
  const hits: string[] = [];
  for (const d of snap.docs) {
    const a = d.data();
    let date: Date | null = a.startDate?.toDate?.() ?? null;
    if (!date && a.shiftId) {
      const s = await db.collection('shifts').doc(String(a.shiftId)).get();
      date = s.exists ? s.data()?.date?.toDate?.() ?? null : null;
    }
    if (!date) continue;
    const key = formatInTimeZone(date, TZ, 'yyyy-MM-dd');
    if (fromKey <= key && key <= toKey) hits.push(d.id);
  }
  return hits;
}

export const onAbsenceWritten = onDocumentWritten({ document: 'absences/{absenceId}', region: 'europe-west1' }, async event => {
  const db = admin.firestore();
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!after) return;
  const { userId, companyId, type, fromKey, toKey, status } = after as Record<string, string>;
  if (!userId || !companyId || !fromKey || !toKey) return;

  const statusChanged = before?.status !== status;
  const rangeChanged = before?.fromKey !== fromKey || before?.toKey !== toKey;
  if (!statusChanged && !rangeChanged) return; // eigener Folgeschreibvorgang o. ä.

  const userSnap = await db.collection('users').doc(userId).get();
  const name = String(userSnap.data()?.displayName || 'Eine Person');
  const period = fromKey === toKey ? deDay(fromKey) : `${deDay(fromKey)} – ${deDay(toKey)}`;

  const affected = BLOCKING.includes(status) || status === 'requested' ? await assignmentsInRange(db, userId, companyId, fromKey, toKey) : [];
  await event.data!.after.ref.update({ affectedAssignmentIds: affected, affectedCheckedAt: FieldValue.serverTimestamp() });

  const batch = db.batch();
  // Pflegekräfte lesen employeeNotifications, die Disposition notifications
  const notify = (to: string, title: string, message: string, actionUrl: string, important = false, col = 'notifications') =>
    batch.set(db.collection(col).doc(), {
      userId: to,
      companyId,
      type: `absence-${status}`,
      title,
      message,
      actionUrl,
      read: false,
      important,
      priority: important ? 'high' : 'medium',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  const conflictText = affected.length ? affected.length === 1 ? ' 1 Einsatz ist betroffen und muss neu besetzt werden.' : ` ${affected.length} Einsätze sind betroffen und müssen neu besetzt werden.` : '';
  if (statusChanged && (status === 'requested' || status === 'reported')) {
    const admins = await db.collection('users').where('companyId', '==', companyId).where('role', '==', 'admin').get();
    for (const a of admins.docs) {
      if (status === 'requested') notify(a.id, 'Neuer Urlaubsantrag', `${name}: ${period}.${conflictText}`, '/admin/abwesenheiten', affected.length > 0);
      else notify(a.id, 'Krankmeldung', `${name} ist krank gemeldet: ${period}.${conflictText}`, '/admin/abwesenheiten', true);
    }
  }
  if (!statusChanged && rangeChanged && status === 'reported' && type === 'sick') {
    const admins = await db.collection('users').where('companyId', '==', companyId).where('role', '==', 'admin').get();
    for (const a of admins.docs) notify(a.id, 'Krankmeldung verlängert', `${name} ist voraussichtlich krank bis ${deDay(toKey)}.${conflictText}`, '/admin/abwesenheiten', true);
  }
  if (statusChanged && type === 'vacation' && (status === 'approved' || status === 'rejected')) {
    notify(
      userId,
      status === 'approved' ? 'Urlaub genehmigt' : 'Urlaub abgelehnt',
      status === 'approved' ? `Ihr Urlaub ${period} ist genehmigt.` : `Ihr Urlaubsantrag ${period} wurde abgelehnt.${after.decisionNote ? ` Grund: ${after.decisionNote}` : ''}`,
      '/employee/abwesenheiten',
      false,
      (userSnap.data()?.role || 'nurse') === 'nurse' ? 'employeeNotifications' : 'notifications'
    );
  }
  await batch.commit();
  logger.info('Abwesenheit verarbeitet', { absenceId: event.params.absenceId, status, affected: affected.length });
});
