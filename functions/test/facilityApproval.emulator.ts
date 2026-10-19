/**
 * Integrationstest Freigabe-Link für Einrichtungen (Firestore-Emulator).
 * Ausführen: npm run test:functions (aus dem Repo-Root)
 */
import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';

process.env.TZ = 'UTC';
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'schichtklar-rules-test';
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('FIRESTORE_EMULATOR_HOST muss gesetzt sein.');
  process.exit(1);
}
if (!admin.apps.length) admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const db = admin.firestore();
const fft = functionsTest({ projectId: process.env.GCLOUD_PROJECT });

let failures = 0;
async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`OK   | ${name}`);
  } catch (e) {
    failures++;
    console.log(`FAIL | ${name} → ${(e as Error).message}`);
  }
}
function eq(a: unknown, b: unknown, what: string) {
  if (a !== b) throw new Error(`${what}: erwartet ${String(b)}, erhalten ${String(a)}`);
}
async function fails(p: Promise<unknown>, code: string) {
  try {
    await p;
  } catch (e) {
    eq((e as { code?: string }).code, code, 'Fehlercode');
    return;
  }
  throw new Error(`erwartet Fehler ${code}`);
}

(async () => {
  const fa = await import('../src/facilityApproval');
  const create = fft.wrap(fa.createFacilityApprovalLink);
  const get = fft.wrap(fa.getFacilityApproval);
  const decide = fft.wrap(fa.decideFacilityApproval);
  const revoke = fft.wrap(fa.revokeFacilityApprovalLink);

  const admA = { uid: 'fa-adminA', token: { role: 'admin', companyId: 'fa-A' } };
  const admB = { uid: 'fa-adminB', token: { role: 'admin', companyId: 'fa-B' } };
  const nurse = { uid: 'fa-nurse', token: { role: 'nurse', companyId: 'fa-A' } };
  const ts = (iso: string) => admin.firestore.Timestamp.fromDate(new Date(`${iso}T00:00:00+02:00`));

  await db.doc('companies/fa-A').set({ name: 'AufAbruf Test' });
  await db.doc('facilities/fa-haus').set({ companyId: 'fa-A', name: 'Haus Test', email: 'pdl@haus.example' });
  await db.doc('facilities/fa-other').set({ companyId: 'fa-A', name: 'Anderes Haus' });
  await db.doc('users/fa-lea').set({ companyId: 'fa-A', displayName: 'Lea Becker', phone: '0151 123' });
  const base = { companyId: 'fa-A', userId: 'fa-lea', facilityId: 'fa-haus', startTime: '06:00', endTime: '14:00', breakMinutes: 30, totalHours: 7.5 };
  await db.doc('timesheets/fa-1').set({ ...base, date: ts('2026-10-12'), status: 'submitted' });
  await db.doc('timesheets/fa-2').set({ ...base, date: ts('2026-10-13'), status: 'draft' });
  await db.doc('timesheets/fa-3').set({ ...base, date: ts('2026-10-14'), status: 'submitted' });
  await db.doc('timesheets/fa-run').set({ ...base, date: ts('2026-10-15'), endTime: '06:00', status: 'draft' });
  await db.doc('timesheets/fa-done').set({ ...base, date: ts('2026-10-16'), status: 'approved', facilitySignerName: 'Vorher' });
  await db.doc('timesheets/fa-foreign').set({ ...base, facilityId: 'fa-other', date: ts('2026-10-13'), status: 'submitted' });

  let token = '';
  await check('Pflegekraft kann keinen Link erzeugen', () => fails(create({ data: { facilityId: 'fa-haus', from: '2026-10-12', to: '2026-10-18' }, auth: nurse } as never), 'permission-denied'));
  await check('Admin fremder Firma kann keinen Link erzeugen', () => fails(create({ data: { facilityId: 'fa-haus', from: '2026-10-12', to: '2026-10-18' }, auth: admB } as never), 'permission-denied'));
  await check('Zeitraum über 31 Tage wird abgelehnt', () => fails(create({ data: { facilityId: 'fa-haus', from: '2026-09-01', to: '2026-10-18' }, auth: admA } as never), 'invalid-argument'));
  await check('Admin erzeugt Link, Token wird nicht im Klartext gespeichert', async () => {
    const r = (await create({ data: { facilityId: 'fa-haus', from: '2026-10-12', to: '2026-10-18' }, auth: admA } as never)) as { token: string; pending: number };
    token = r.token;
    eq(r.pending, 3, 'offene Dienste');
    const plain = await db.collection(fa.APPROVAL_COLLECTION).doc(token).get();
    eq(plain.exists, false, 'Klartext-Token als ID');
  });

  await check('Ungültiger Token → not-found', () => fails(get({ data: { token: 'x'.repeat(43) } } as never), 'not-found'));
  await check('Link zeigt nur Dienste dieser Einrichtung, ohne Kontaktdaten', async () => {
    const r = (await get({ data: { token } } as never)) as { entries: Record<string, unknown>[]; facilityName: string };
    eq(r.facilityName, 'Haus Test', 'Einrichtung');
    eq(r.entries.length, 4, 'Anzahl (3 offen + 1 bereits freigegeben, ohne laufenden und fremden)');
    eq(r.entries[0].person, 'Lea B.', 'Name gekürzt');
    eq(JSON.stringify(r.entries).includes('0151'), false, 'Telefonnummer sichtbar');
    eq(r.entries.find(e => e.id === 'fa-done')!.status, 'approved', 'bereits freigegeben');
  });

  await check('Ohne Bestätigung keine Freigabe', () => fails(decide({ data: { token, signerName: 'Herr Lehmann', approveIds: ['fa-1'] } } as never), 'invalid-argument'));
  await check('Ablehnung ohne Grund wird abgewiesen', () => fails(decide({ data: { token, signerName: 'Herr Lehmann', confirm: true, rejections: [{ id: 'fa-3', reason: '' }] } } as never), 'invalid-argument'));
  await check('Freigabe + Ablehnung; fremde/fertige IDs werden übersprungen', async () => {
    const r = (await decide({
      data: { token, signerName: 'Herr Lehmann', signerRole: 'PDL', confirm: true, approveIds: ['fa-1', 'fa-2', 'fa-foreign', 'fa-done'], rejections: [{ id: 'fa-3', reason: 'Pause war 60 Minuten' }] },
    } as never)) as { approved: number; rejected: number; skipped: number };
    eq(r.approved, 2, 'freigegeben');
    eq(r.rejected, 1, 'abgelehnt');
    eq(r.skipped, 2, 'übersprungen');
    const t1 = (await db.doc('timesheets/fa-1').get()).data()!;
    eq(t1.status, 'approved', 'fa-1 Status');
    eq(t1.facilitySignerName, 'Herr Lehmann', 'Unterschrift');
    eq(t1.facilityApprovedVia, 'link', 'Weg');
    eq((await db.doc('timesheets/fa-foreign').get()).data()!.status, 'submitted', 'fremde Einrichtung unverändert');
    eq((await db.doc('timesheets/fa-done').get()).data()!.facilitySignerName, 'Vorher', 'Freigegebenes unverändert');
    const t3 = (await db.doc('timesheets/fa-3').get()).data()!;
    eq(t3.status, 'rejected', 'fa-3 Status');
    eq(String(t3.rejectionReason).includes('Pause war 60 Minuten'), true, 'Grund');
  });

  await check('Fremde Firma kann Link nicht zurückziehen', () => fails(revoke({ data: { token }, auth: admB } as never), 'not-found'));
  await check('Zurückgezogener Link funktioniert nicht mehr', async () => {
    await revoke({ data: { token }, auth: admA } as never);
    await fails(get({ data: { token } } as never), 'failed-precondition');
  });
  await check('Abgelaufener Link funktioniert nicht', async () => {
    const r = (await create({ data: { facilityId: 'fa-haus', from: '2026-10-12', to: '2026-10-18' }, auth: admA } as never)) as { token: string };
    const { createHash } = await import('crypto');
    await db.collection(fa.APPROVAL_COLLECTION).doc(createHash('sha256').update(r.token).digest('hex')).update({ expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() - 1000) });
    await fails(get({ data: { token: r.token } } as never), 'deadline-exceeded');
  });

  fft.cleanup();
  console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
  process.exit(failures ? 1 : 0);
})();
