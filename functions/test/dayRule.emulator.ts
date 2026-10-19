/**
 * Integrationstest gegen Firestore- + Auth-Emulator: Mandantenisolation und
 * Regel „1 Einsatz pro Tag" in den echten Cloud Functions.
 *
 * Ausführen (aus dem Repo-Root):
 *   npm run test:functions
 * Exit-Code != 0 bei Fehlern.
 */
import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';

process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'schichtklar-rules-test';
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('FIRESTORE_EMULATOR_HOST und FIREBASE_AUTH_EMULATOR_HOST müssen gesetzt sein (via emulators:exec).');
  process.exit(1);
}

admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT });
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
function expectEq(actual: unknown, expected: unknown, what: string) {
  if (actual !== expected) throw new Error(`${what}: erwartet ${String(expected)}, erhalten ${String(actual)}`);
}
async function expectError(p: Promise<unknown>, code: string, detailCode?: string) {
  try {
    await p;
  } catch (e) {
    const err = e as { code?: string; details?: { code?: string } };
    expectEq(err.code, code, 'Fehlercode');
    if (detailCode) expectEq(err.details?.code, detailCode, 'details.code');
    return;
  }
  throw new Error(`Fehler ${code} erwartet, aber Aufruf war erfolgreich`);
}

// Berliner Mitternacht – so speichert der Datepicker im Browser
const berlinMidnight = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  const offsetH = Number(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Berlin', hour: 'numeric', hourCycle: 'h23' }).format(d));
  return admin.firestore.Timestamp.fromDate(new Date(d.getTime() - offsetH * 3600_000));
};
const ctx = (uid: string, role: string, companyId: string) => ({ auth: { uid, token: { role, companyId } } });

async function main() {
  const { assignShift } = await import('../src/assignShift');
  const { requestShift } = await import('../src/requestShift');
  const { acceptPublishedAssignment, enforceDayRule } = await import('../src/assignment/dayRuleFunctions');
  const { setUserRole, getUsersWithRoles } = await import('../src/auth');

  // --- Seed ---
  const users: Array<[string, string, string]> = [
    ['adminA', 'admin', 'firmaA'],
    ['nurseA', 'nurse', 'firmaA'],
    ['nurseA2', 'nurse', 'firmaA'],
    ['adminB', 'admin', 'firmaB'],
    ['nurseB', 'nurse', 'firmaB'],
  ];
  for (const [uid, role, companyId] of users) {
    await db.doc(`users/${uid}`).set({ role, companyId, displayName: uid, qualifications: [] });
    await admin.auth().createUser({ uid }).catch(() => undefined);
    await admin.auth().setCustomUserClaims(uid, { role, companyId });
  }
  await db.doc('facilities/fA').set({ companyId: 'firmaA', name: 'Haus A' });
  const shift = (id: string, companyId: string, day: string, start: string, end: string) =>
    db.doc(`shifts/${id}`).set({
      companyId, facilityId: 'fA', date: berlinMidnight(day), startTime: start, endTime: end,
      capacity: 3, assignedCount: 0, status: 'open', requiredSkills: [],
    });
  await shift('frueh', 'firmaA', '2026-11-02', '06:00', '14:00');
  await shift('spaet', 'firmaA', '2026-11-02', '15:00', '22:00');
  await shift('folgetag', 'firmaA', '2026-11-03', '06:00', '14:00');
  await shift('fremd', 'firmaB', '2026-11-02', '06:00', '14:00');

  const assign = fft.wrap(assignShift as never) as (d: unknown, c: unknown) => Promise<{ assignmentId?: string }>;
  const request = fft.wrap(requestShift as never) as (d: unknown, c: unknown) => Promise<unknown>;
  const acceptPub = fft.wrap(acceptPublishedAssignment as never) as (d: unknown, c: unknown) => Promise<unknown>;
  const adminA = ctx('adminA', 'admin', 'firmaA');
  const adminB = ctx('adminB', 'admin', 'firmaB');

  console.log('--- Admin-Zuweisung (assignShift) ---');
  await check('Frühdienst zuweisen', async () => {
    await assign({ shiftId: 'frueh', userId: 'nurseA', adminOverride: true }, adminA);
  });
  await check('Spätdienst am selben Tag blockiert – auch mit adminOverride', () =>
    expectError(assign({ shiftId: 'spaet', userId: 'nurseA', adminOverride: true }, adminA), 'failed-precondition', 'DAY_RULE_CONFLICT'));
  await check('Zu kurze Begründung reicht nicht', () =>
    expectError(assign({ shiftId: 'spaet', userId: 'nurseA', adminOverride: true, dayRuleOverrideReason: 'weil' }, adminA), 'failed-precondition', 'DAY_RULE_CONFLICT'));
  let overriddenId = '';
  await check('Mit Begründung übersteuert und dokumentiert', async () => {
    const r = await assign({ shiftId: 'spaet', userId: 'nurseA', adminOverride: true, dayRuleOverrideReason: 'Geteilter Dienst, mit PDL abgestimmt' }, adminA);
    overriddenId = r.assignmentId ?? '';
    const doc = await db.doc(`assignments/${overriddenId}`).get();
    expectEq(doc.get('dayRuleOverride.reason'), 'Geteilter Dienst, mit PDL abgestimmt', 'gespeicherte Begründung');
    expectEq(doc.get('dayRuleOverride.by'), 'adminA', 'übersteuert von');
  });
  await check('Folgetag ist erlaubt', async () => {
    await assign({ shiftId: 'folgetag', userId: 'nurseA', adminOverride: true }, adminA);
  });
  await check('Fremde Firma kann nicht zuweisen', () =>
    expectError(assign({ shiftId: 'frueh', userId: 'nurseA2', adminOverride: true }, adminB), 'permission-denied'));
  await check('Admin kann keine Person einer fremden Firma zuweisen', () =>
    expectError(assign({ shiftId: 'folgetag', userId: 'nurseB', adminOverride: true }, adminA), 'permission-denied'));

  console.log('--- Schichtanfrage (requestShift) ---');
  await check('Anfrage für schon belegten Tag blockiert', async () => {
    await db.doc('shifts/spaet2').set({ companyId: 'firmaA', facilityId: 'fA', date: berlinMidnight('2026-11-02'), startTime: '15:00', endTime: '22:00', capacity: 1, assignedCount: 0, status: 'open', requiredSkills: [] });
    await expectError(request({ shiftId: 'spaet2' }, ctx('nurseA', 'nurse', 'firmaA')), 'failed-precondition', 'DAY_RULE_CONFLICT');
  });
  await check('Anfrage für Schicht fremder Firma blockiert', () =>
    expectError(request({ shiftId: 'fremd' }, ctx('nurseA2', 'nurse', 'firmaA')), 'permission-denied'));

  console.log('--- Ausgeschriebener Einsatz (acceptPublishedAssignment) ---');
  await db.doc('assignments/pub').set({
    companyId: 'firmaA', status: 'published', userId: null, facilityId: 'fA',
    startDate: berlinMidnight('2026-11-02'), startTime: '08:00', endTime: '12:00',
    candidateUserIds: ['nurseA', 'nurseA2', 'nurseB'],
  });
  await check('Kandidatin mit Einsatz am selben Tag wird abgewiesen', () =>
    expectError(acceptPub({ assignmentId: 'pub' }, ctx('nurseA', 'nurse', 'firmaA')), 'failed-precondition', 'DAY_RULE_CONFLICT'));
  await check('Person aus fremder Firma wird abgewiesen', () =>
    expectError(acceptPub({ assignmentId: 'pub' }, ctx('nurseB', 'nurse', 'firmaB')), 'permission-denied'));
  await check('Freie Kandidatin nimmt an', async () => {
    await acceptPub({ assignmentId: 'pub' }, ctx('nurseA2', 'nurse', 'firmaA'));
    const d = await db.doc('assignments/pub').get();
    expectEq(d.get('userId'), 'nurseA2', 'userId');
    expectEq(d.get('status'), 'accepted', 'status');
  });
  await check('Zweite Annahme desselben Einsatzes scheitert', () =>
    expectError(acceptPub({ assignmentId: 'pub' }, ctx('nurseA2', 'nurse', 'firmaA')), 'failed-precondition'));

  console.log('--- Sicherheitsnetz-Trigger (enforceDayRule) ---');
  const runTrigger = fft.wrap(enforceDayRule as never) as (e: unknown) => Promise<void>;
  const triggerFor = async (id: string, beforeData: Record<string, unknown> | null) => {
    const after = await db.doc(`assignments/${id}`).get();
    const before = beforeData
      ? fft.firestore.makeDocumentSnapshot(beforeData, `assignments/${id}`)
      : fft.firestore.makeDocumentSnapshot({}, `assignments/${id}`);
    const afterSnap = fft.firestore.makeDocumentSnapshot(after.data()!, `assignments/${id}`);
    await runTrigger({ data: fft.makeChange(before, afterSnap), params: { assignmentId: id } });
  };
  await check('Direkt geschriebener Doppel-Einsatz wird markiert + Admins benachrichtigt', async () => {
    await db.doc('assignments/direkt').set({ companyId: 'firmaA', userId: 'nurseA2', status: 'assigned', shiftId: 'frueh' });
    await triggerFor('direkt', null);
    const d = await db.doc('assignments/direkt').get();
    expectEq(d.get('dayRuleViolation.dayKey'), '2026-11-02', 'markierter Tag');
    const notes = await db.collection('notifications').where('type', '==', 'day-rule-violation').where('userId', '==', 'adminA').get();
    expectEq(notes.empty, false, 'Admin-Benachrichtigung vorhanden');
    const foreign = await db.collection('notifications').where('type', '==', 'day-rule-violation').where('userId', '==', 'adminB').get();
    expectEq(foreign.empty, true, 'keine Benachrichtigung an fremde Firma');
  });
  await check('Übersteuerter Einsatz wird nicht markiert', async () => {
    await triggerFor(overriddenId, null);
    const d = await db.doc(`assignments/${overriddenId}`).get();
    expectEq(d.get('dayRuleViolation'), undefined, 'keine Markierung');
  });
  await check('Markierung verschwindet nach Absage', async () => {
    const before = (await db.doc('assignments/direkt').get()).data()!;
    await db.doc('assignments/direkt').update({ status: 'declined' });
    await triggerFor('direkt', before);
    const d = await db.doc('assignments/direkt').get();
    expectEq(d.get('dayRuleViolation'), undefined, 'Markierung entfernt');
  });

  console.log('--- Rollen über Firmengrenzen (auth.ts) ---');
  const setRole = fft.wrap(setUserRole as never) as (r: unknown) => Promise<unknown>;
  const listUsers = fft.wrap(getUsersWithRoles as never) as (r: unknown) => Promise<{ users: Array<{ uid: string }> }>;
  await check('Admin B kann Rolle in Firma A nicht setzen', () =>
    expectError(setRole({ data: { uid: 'nurseA', role: 'admin' }, auth: adminB.auth }), 'permission-denied'));
  await check('Rollenwechsel behält companyId-Claim', async () => {
    await setRole({ data: { uid: 'nurseA2', role: 'admin' }, auth: adminA.auth });
    const u = await admin.auth().getUser('nurseA2');
    expectEq(u.customClaims?.companyId, 'firmaA', 'companyId-Claim');
    expectEq(u.customClaims?.role, 'admin', 'Rolle');
  });
  await check('Admin kann sich nicht selbst die Admin-Rolle entziehen', () =>
    expectError(setRole({ data: { uid: 'adminA', role: 'nurse' }, auth: adminA.auth }), 'failed-precondition'));
  await check('Nutzerliste enthält nur eigene Firma', async () => {
    const r = await listUsers({ data: {}, auth: adminA.auth });
    const uids = r.users.map(u => u.uid).sort().join(',');
    expectEq(uids, 'adminA,nurseA,nurseA2', 'Nutzer');
  });

  fft.cleanup();
  console.log(`--- Ende: ${failures} Fehler ---`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
