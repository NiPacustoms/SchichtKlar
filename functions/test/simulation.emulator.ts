/**
 * Szenario-Simulation gegen Firestore- + Auth-Emulator: Abläufe und
 * Grenzfälle über mehrere Functions hinweg.
 *
 *  S1  Krankmeldung sperrt Planung (Zuweisen, Anfragen, Angebot annehmen)
 *  S2  Nachtdienst über Monatsende in einen Feiertag (NRW)
 *  S3  Prüfprotokoll: Freigabe, Unterschrift, Stammdaten – und was NICHT protokolliert wird
 *  S4  DSGVO: Auskunft und Löschung – Rechte, Aufbewahrungspflicht, Auth-Konto
 *
 * Ausführen (aus dem Repo-Root): npm run test:functions
 */
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import functionsTest from 'firebase-functions-test';

process.env.TZ = 'UTC';
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'schichtklar-rules-test';
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('FIRESTORE_EMULATOR_HOST und FIREBASE_AUTH_EMULATOR_HOST müssen gesetzt sein (via emulators:exec).');
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
function eq(actual: unknown, expected: unknown, what: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${what}: erwartet ${JSON.stringify(expected)}, erhalten ${JSON.stringify(actual)}`);
}
async function expectError(p: Promise<unknown>, code: string, reason?: string) {
  try {
    await p;
  } catch (e) {
    const err = e as { code?: string; details?: { reason?: string } };
    eq(err.code, code, 'Fehlercode');
    if (reason) eq(err.details?.reason, reason, 'details.reason');
    return;
  }
  throw new Error(`Fehler ${code} erwartet, aber Aufruf war erfolgreich`);
}
const berlinMidnight = (day: string) => {
  const d = new Date(`${day}T12:00:00Z`);
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(d));
  return Timestamp.fromDate(new Date(d.getTime() - h * 3600_000));
};
const ctx = (uid: string, role: string, companyId: string) => ({ auth: { uid, token: { role, companyId } } });
type Callable = (d: unknown, c: unknown) => Promise<Record<string, unknown>>;

(async () => {
  const { assignShift } = await import('../src/assignShift');
  const { requestShift } = await import('../src/requestShift');
  const { acceptPublishedAssignment } = await import('../src/assignment/dayRuleFunctions');
  const { computeTimesheetBreakdown } = await import('../src/timesheetBreakdownTrigger');
  const { auditTimesheets, auditStatements, auditUsers } = await import('../src/auditTrail');
  const { exportUserData } = await import('../src/dsr/exportUserData');
  const { deleteUserData } = await import('../src/dsr/deleteUserData');
  const assign = fft.wrap(assignShift as never) as Callable;
  const request = fft.wrap(requestShift as never) as Callable;
  const acceptPub = fft.wrap(acceptPublishedAssignment as never) as Callable;
  const doExport = fft.wrap(exportUserData as never) as Callable;
  const doDelete = fft.wrap(deleteUserData as never) as Callable;
  const C = 'sim-firma';

  // ——— Aufräumen + Seed ———
  for (const col of ['absences', 'assignments', 'shifts', 'timesheets', 'auditLogs', 'notifications', 'employeeNotifications', 'timesheetStatements']) {
    const s = await db.collection(col).where('companyId', 'in', [C, 'sim-fremd']).get();
    await Promise.all(s.docs.map(d => d.ref.delete()));
  }
  await db.doc(`companies/${C}`).set({ name: 'Sim GmbH', holidayState: 'NW' });
  for (const [uid, role, companyId] of [['sim-admin', 'admin', C], ['sim-lea', 'nurse', C], ['sim-tom', 'nurse', C], ['sim-fremd', 'nurse', 'sim-fremd']] as const) {
    await db.doc(`users/${uid}`).set({ role, companyId, displayName: uid, email: `${uid}@example.org`, phone: '0151 1', qualifications: [], hourlyRate: 20 });
    await admin.auth().deleteUser(uid).catch(() => undefined);
    await admin.auth().createUser({ uid, email: `${uid}@example.org` });
    await admin.auth().setCustomUserClaims(uid, { role, companyId });
  }
  await db.doc('facilities/sim-f').set({ companyId: C, name: 'Haus Sim' });
  const shift = (id: string, day: string) =>
    db.doc(`shifts/${id}`).set({ companyId: C, facilityId: 'sim-f', date: berlinMidnight(day), startTime: '06:00', endTime: '14:00', capacity: 2, assignedCount: 0, status: 'open', requiredSkills: [] });
  await shift('sim-s1', '2026-12-14');
  await shift('sim-s2', '2026-12-15');
  const admin_ = ctx('sim-admin', 'admin', C);
  const lea = ctx('sim-lea', 'nurse', C);

  console.log('--- S1 Keine Krankmeldung: Altbestand sperrt nicht ---');
  await db.doc('absences/sim-alt').set({ companyId: C, userId: 'sim-lea', type: 'sick', fromKey: '2026-12-14', toKey: '2026-12-18', status: 'reported' });
  await check('Alte Krankmeldung blockiert die Einplanung nicht mehr', async () => {
    const r = await assign({ shiftId: 'sim-s1', userId: 'sim-lea' }, admin_);
    if (!r.assignmentId) throw new Error('keine Zuweisung');
  });
  await check('Ausgeschriebener Einsatz trotz Altbestand annehmbar', async () => {
    await db.doc('assignments/sim-pub').set({ companyId: C, status: 'published', userId: null, candidateUserIds: ['sim-lea'], startDate: berlinMidnight('2026-12-16'), facilityId: 'sim-f' });
    await acceptPub({ assignmentId: 'sim-pub' }, lea);
  });
  await check('Pflegekraft kann trotz Altbestand anfragen', async () => {
    await request({ shiftId: 'sim-s2' }, lea);
  });
  await check('Disposition plant Kollegin am Folgetag ein', async () => {
    await assign({ shiftId: 'sim-s2', userId: 'sim-tom' }, admin_);
  });

  console.log('--- S2 Nachtdienst über Monatsende in Allerheiligen ---');
  await check('31.10. 21:00 – 01.11. 06:00: Nacht- und Feiertagsstunden, Tag bleibt 31.10.', async () => {
    const wrapped = fft.wrap(computeTimesheetBreakdown as never) as (e: unknown) => Promise<unknown>;
    const ref = db.doc('timesheets/sim-nacht');
    await ref.set({ companyId: C, userId: 'sim-lea', status: 'draft', date: berlinMidnight('2026-10-31'), startTime: '21:00', endTime: '06:00', breakMinutes: 45, totalHours: 8.25 });
    const change = fft.makeChange(fft.firestore.makeDocumentSnapshot({}, 'timesheets/sim-nacht'), await ref.get());
    await wrapped({ data: change, params: { timesheetId: 'sim-nacht' } });
    const d = (await ref.get()).data()!;
    if (!(d.nightHours > 0)) throw new Error(`Nachtstunden ${d.nightHours}`);
    if (!(d.holidayHours > 0)) throw new Error(`Feiertagsstunden ${d.holidayHours} (Allerheiligen NRW fehlt)`);
    eq(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(d.date.toDate()), '2026-10-31', 'Kalendertag');
  });

  console.log('--- S3 Prüfprotokoll ---');
  const logs = async (action?: string) =>
    (await db.collection('auditLogs').where('companyId', '==', C).get()).docs.map(d => d.data()).filter(d => !action || d.action === action);
  const fire = async (fn: unknown, path: string, before: Record<string, unknown> | null, after: Record<string, unknown> | null) => {
    const w = fft.wrap(fn as never) as (e: unknown) => Promise<unknown>;
    const b = fft.firestore.makeDocumentSnapshot(before ?? {}, path);
    const a = fft.firestore.makeDocumentSnapshot(after ?? {}, path);
    // Für gelöschte/neue Dokumente: exists=false simulieren
    if (!before) Object.defineProperty(b, 'exists', { value: false });
    if (!after) Object.defineProperty(a, 'exists', { value: false });
    await w({ data: fft.makeChange(b, a), params: { id: path.split('/')[1] } });
  };
  const ts = { companyId: C, userId: 'sim-lea', date: berlinMidnight('2026-10-20'), startTime: '06:00', endTime: '14:00', breakMinutes: 30, totalHours: 7.5 };
  await check('Freigabe wird mit Freigebendem protokolliert', async () => {
    await fire(auditTimesheets, 'timesheets/sim-a', { ...ts, status: 'submitted' }, { ...ts, status: 'approved', approvedBy: 'sim-admin' });
    const l = await logs('timesheet.approved');
    eq(l.length, 1, 'Einträge');
    eq(l[0].actorUid, 'sim-admin', 'ausgeführt von');
    eq(l[0].subjectUid, 'sim-lea', 'betroffen');
    if (!String(l[0].summary).includes('20.10.2026')) throw new Error(`Zusammenfassung: ${l[0].summary}`);
  });
  await check('Server-Neuberechnung (Zuschläge) erzeugt keinen Eintrag', async () => {
    const before = (await logs()).length;
    await fire(auditTimesheets, 'timesheets/sim-a', { ...ts, status: 'approved' }, { ...ts, status: 'approved', nightHours: 0, breakdownKey: 'v3|x' });
    eq((await logs()).length, before, 'Anzahl');
  });
  await check('Unterschrift und Anerkennung des Stundennachweises', async () => {
    const st = { companyId: C, userId: 'sim-lea', month: '2026-09' };
    await fire(auditStatements, 'timesheetStatements/x', null, { ...st, employeeSignedAt: Timestamp.now(), signedTotalHours: 22.25 });
    await fire(auditStatements, 'timesheetStatements/x', { ...st, employeeSignedAt: 1 }, { ...st, employeeSignedAt: 1, employerSignedAt: Timestamp.now(), employerSignedBy: 'sim-admin', employerSignedName: 'Pepe' });
    eq((await logs('statement.employee-signed')).length, 1, 'unterschrieben');
    eq((await logs('statement.acknowledged')).length, 1, 'anerkannt');
  });
  await check('Stundenlohn-Änderung protokolliert, Telefonnummer nicht', async () => {
    const u = { companyId: C, displayName: 'Lea', role: 'nurse', hourlyRate: 20, phone: '1' };
    await fire(auditUsers, 'users/sim-lea', u, { ...u, phone: '2' });
    await fire(auditUsers, 'users/sim-lea', u, { ...u, hourlyRate: 22 });
    const l = await logs('user.master-data-changed');
    eq(l.length, 1, 'Einträge');
    eq(l[0].after, { hourlyRate: 22 }, 'neuer Wert');
  });

  console.log('--- S4 DSGVO-Auskunft und -Löschung ---');
  await db.doc('timesheets/sim-frei').set({ ...ts, status: 'approved' });
  await db.doc('timesheets/sim-entwurf').set({ ...ts, status: 'draft' });
  await db.doc('employeeNotifications/sim-n1').set({ companyId: C, userId: 'sim-tom', title: 'x' });
  await db.doc('timesheets/sim-tom-frei').set({ ...ts, userId: 'sim-tom', status: 'approved' });
  await check('Pflegekraft erhält eigene Daten', async () => {
    const r = (await doExport({}, lea)) as { data: Record<string, unknown[]> };
    if (!r.data.timesheets?.length) throw new Error('Zeiten fehlen');
  });
  await check('Pflegekraft kann Daten der Kollegin NICHT abrufen', () => expectError(doExport({ uid: 'sim-tom' }, lea), 'permission-denied'));
  await check('Pflegekraft kann Kollegin NICHT löschen', () => expectError(doDelete({ uid: 'sim-tom', hardDelete: true }, lea), 'permission-denied'));
  await check('Pflegekraft kann sich nicht endgültig löschen', () => expectError(doDelete({ hardDelete: true }, lea), 'permission-denied'));
  await check('Fremde Firma: Disposition kann Person nicht abrufen', () => expectError(doExport({ uid: 'sim-fremd' }, admin_), 'not-found'));
  await check('Disposition löscht endgültig: Lohnnachweise bleiben gesperrt, Rest weg, Konto gelöscht', async () => {
    const r = await doDelete({ uid: 'sim-tom', hardDelete: true }, admin_);
    eq((r.retained as string[]).includes('timesheets'), true, 'Zeiten aufbewahrt');
    const t = (await db.doc('timesheets/sim-tom-frei').get()).data();
    eq(t?.legalHold, true, 'Sperrvermerk');
    eq((await db.doc('employeeNotifications/sim-n1').get()).exists, false, 'Benachrichtigung gelöscht');
    const u = (await db.doc('users/sim-tom').get()).data();
    eq(u?.email, undefined, 'E-Mail entfernt');
    eq(u?.phone, undefined, 'Telefon entfernt');
    await admin.auth().getUser('sim-tom').then(
      () => {
        throw new Error('Auth-Konto existiert noch');
      },
      () => undefined
    );
  });
  await check('Selbstlöschung sperrt Anmeldung, Zeiten bleiben', async () => {
    await doDelete({}, lea);
    eq((await admin.auth().getUser('sim-lea')).disabled, true, 'Konto gesperrt');
    eq((await db.doc('timesheets/sim-frei').get()).exists, true, 'freigegebene Zeiten');
  });

  fft.cleanup();
  console.log(failures ? `\n${failures} Fehler` : '\nAlle Szenarien OK');
  process.exit(failures ? 1 : 0);
})();
