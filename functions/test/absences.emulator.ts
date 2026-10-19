/**
 * Integrationstest Abwesenheiten gegen den Firestore-Emulator:
 * Planung sperrt abwesende Personen, Trigger meldet betroffene Einsätze und
 * benachrichtigt Disposition bzw. Person.
 *
 * Ausführen (aus dem Repo-Root): npm run test:functions
 */
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import functionsTest from 'firebase-functions-test';

process.env.TZ = 'UTC';
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'schichtklar-rules-test';
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('FIRESTORE_EMULATOR_HOST muss gesetzt sein (via emulators:exec).');
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

(async () => {
  const { onAbsenceWritten, isAbsentOn } = await import('../src/absences');
  const { isUserAvailableForSlot } = await import('../src/assignment/availability');
  const wrapped = fft.wrap(onAbsenceWritten);
  const C = 'abs-firma';

  // Aufräumen für wiederholbare Läufe
  for (const col of ['absences', 'assignments', 'notifications', 'employeeNotifications']) {
    const s = await db.collection(col).where('companyId', '==', C).get();
    await Promise.all(s.docs.map(d => d.ref.delete()));
  }
  await db.doc('users/abs-admin').set({ companyId: C, role: 'admin', displayName: 'Dispo' });
  await db.doc('users/abs-nurse').set({ companyId: C, role: 'nurse', displayName: 'Lea Test' });
  // Einsatz am Di 03.11.2026, 06:00 Berlin (= 05:00 UTC)
  await db.doc('assignments/abs-a1').set({ companyId: C, userId: 'abs-nurse', status: 'accepted', startDate: Timestamp.fromDate(new Date('2026-11-03T05:00:00Z')) });
  await db.doc('assignments/abs-a2').set({ companyId: C, userId: 'abs-nurse', status: 'accepted', startDate: Timestamp.fromDate(new Date('2026-11-20T05:00:00Z')) });

  async function write(id: string, before: Record<string, unknown> | null, after: Record<string, unknown>) {
    const path = `absences/${id}`;
    await db.doc(path).set(after);
    const b = before ? fft.firestore.makeDocumentSnapshot(before, path) : fft.firestore.makeDocumentSnapshot({}, path);
    const a = fft.firestore.makeDocumentSnapshot(after, path);
    await wrapped({ data: fft.makeChange(b, a), params: { absenceId: id } } as never);
  }
  const notes = async (userId: string, col = 'notifications') =>
    (await db.collection(col).where('companyId', '==', C).where('userId', '==', userId).get()).docs.map(d => d.data());

  const vac = { companyId: C, userId: 'abs-nurse', type: 'vacation', fromKey: '2026-11-02', toKey: '2026-11-06', status: 'requested' };

  await check('Beantragter Urlaub sperrt Planung noch nicht', async () => {
    await write('v1', null, vac);
    eq(await isAbsentOn(db, 'abs-nurse', C, '2026-11-03'), false, 'abwesend');
  });
  await check('Antrag: betroffener Einsatz wird erkannt, Disposition benachrichtigt', async () => {
    const d = (await db.doc('absences/v1').get()).data()!;
    eq(d.affectedAssignmentIds, ['abs-a1'], 'betroffen');
    const n = await notes('abs-admin');
    eq(n.length, 1, 'Anzahl');
    eq(n[0].title, 'Neuer Urlaubsantrag', 'Titel');
    if (!String(n[0].message).includes('1 Einsatz ist betroffen')) throw new Error(`Nachricht: ${n[0].message}`);
  });
  await check('Genehmigt: Person benachrichtigt, Planung gesperrt', async () => {
    await write('v1', vac, { ...vac, status: 'approved', decidedBy: 'abs-admin' });
    const n = await notes('abs-nurse', 'employeeNotifications');
    eq(n.map(x => x.title), ['Urlaub genehmigt'], 'Titel');
    eq(await isAbsentOn(db, 'abs-nurse', C, '2026-11-06'), true, 'abwesend Fr');
    eq(await isAbsentOn(db, 'abs-nurse', C, '2026-11-07'), false, 'abwesend Sa danach');
    // Schicht Mi 04.11.2026 – kein anderer Einsatz an dem Tag, aber Urlaub
    eq(await isUserAvailableForSlot(db, 'abs-nurse', new Date('2026-11-04T05:00:00Z'), new Date('2026-11-04T13:00:00Z'), C), false, 'verfügbar');
    eq(await isUserAvailableForSlot(db, 'abs-nurse', new Date('2026-11-10T05:00:00Z'), new Date('2026-11-10T13:00:00Z'), C), true, 'verfügbar danach');
  });
  await check('Krankmeldung: Disposition wichtig benachrichtigt, sofort gesperrt', async () => {
    const sick = { companyId: C, userId: 'abs-nurse', type: 'sick', fromKey: '2026-11-19', toKey: '2026-11-20', status: 'reported' };
    await write('s1', null, sick);
    const n = (await notes('abs-admin')).filter(x => x.title === 'Krankmeldung');
    eq(n.length, 1, 'Anzahl');
    eq(n[0].important, true, 'wichtig');
    eq((await db.doc('absences/s1').get()).data()!.affectedAssignmentIds, ['abs-a2'], 'betroffen');
    eq(await isAbsentOn(db, 'abs-nurse', C, '2026-11-20'), true, 'abwesend');
  });
  await check('Folgeschreibvorgang ohne Änderung erzeugt keine Benachrichtigung', async () => {
    const before = (await db.doc('absences/s1').get()).data()!;
    await write('s1', before, { ...before, auProvided: true });
    eq((await notes('abs-admin')).filter(x => x.title === 'Krankmeldung').length, 1, 'Anzahl');
  });
  await check('Zurückgezogen: sperrt nicht mehr', async () => {
    const before = (await db.doc('absences/s1').get()).data()!;
    await write('s1', before, { ...before, status: 'cancelled' });
    eq(await isAbsentOn(db, 'abs-nurse', C, '2026-11-20'), false, 'abwesend');
  });
  await check('Andere Firma blockiert nicht', async () => {
    eq(await isAbsentOn(db, 'abs-nurse', 'andere-firma', '2026-11-04'), false, 'abwesend');
  });

  fft.cleanup();
  console.log(failures ? `\n${failures} Fehler` : '\nAbwesenheiten OK');
  process.exit(failures ? 1 : 0);
})();
