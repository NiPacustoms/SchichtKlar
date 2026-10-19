/**
 * Integrationstest gegen den Firestore-Emulator: serverseitige Aufteilung der
 * Stunden (Nacht/Wochenende/Feiertag/Überstunden) und Zusammenspiel mit dem
 * GoBD-Schutz freigegebener Zeiten. Läuft in UTC wie Cloud Functions.
 *
 * Ausführen (aus dem Repo-Root): npm run test:functions
 */
import * as admin from 'firebase-admin';
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
  if (actual !== expected) throw new Error(`${what}: erwartet ${String(expected)}, erhalten ${String(actual)}`);
}

(async () => {
  const { computeTimesheetBreakdown } = await import('../src/timesheetBreakdownTrigger');
  const { protectApprovedTimesheets } = await import('../src/protectTimesheet');
  const wrapped = fft.wrap(computeTimesheetBreakdown);
  const wrappedProtect = fft.wrap(protectApprovedTimesheets);

  await db.doc('companies/bd-firma').set({ name: 'Test', holidayState: 'NW' });
  await db.doc('users/bd-nurse').set({ companyId: 'bd-firma', hourlyRate: 20 });

  // Berliner Mitternacht wie vom Client gespeichert
  const berlin = (iso: string, offsetH: number) => admin.firestore.Timestamp.fromDate(new Date(Date.parse(`${iso}T00:00:00Z`) - offsetH * 3600_000));

  async function run(id: string, data: Record<string, unknown>) {
    const ref = db.doc(`timesheets/${id}`);
    await ref.set({ companyId: 'bd-firma', userId: 'bd-nurse', status: 'draft', ...data });
    const after = await ref.get();
    const change = fft.makeChange(fft.firestore.makeDocumentSnapshot({}, `timesheets/${id}`), after);
    await wrapped({ data: change, params: { timesheetId: id } } as never);
    return (await ref.get()).data()!;
  }

  await check('Sonntags-Frühdienst: 8 h Sonntag, 0 h Nacht, 50 % Zuschlag', async () => {
    const d = await run('bd-sun', { date: berlin('2026-10-18', 2), startTime: '06:00', endTime: '14:00', breakMinutes: 0 });
    eq(d.nightHours, 0, 'Nachtstunden');
    eq(d.weekendHours, 8, 'Wochenendstunden');
    eq(d.surchargeAmount, 80, 'Zuschlag');
    eq(d.overtimeHours, 0, 'Überstunden');
    eq(d.regularHours, 8, 'reguläre Stunden');
    eq(JSON.stringify(d.arbzgFlags), '["BREAK_TOO_SHORT"]', 'ArbZG-Hinweise (8 h ohne Pause)');
  });

  await check('Nachtdienst Di→Mi: 7 h Nacht (vor Pause), Pause proportional', async () => {
    const d = await run('bd-night', { date: berlin('2026-10-20', 2), startTime: '21:00', endTime: '06:30', breakMinutes: 45 });
    eq(d.nightHours, 6.45, 'Nachtstunden');
    eq(d.overtimeHours, 0.75, 'Überstunden');
    eq(JSON.stringify(d.arbzgFlags), '["OVER_8H"]', 'ArbZG-Hinweise');
  });

  await check('Allerheiligen in NRW zählt als Feiertag', async () => {
    const d = await run('bd-hol', { date: berlin('2027-11-01', 1), startTime: '06:00', endTime: '14:00', breakMinutes: 30 });
    eq(d.holidayHours, 7.5, 'Feiertagsstunden');
  });

  await check('Laufender Dienst wird nicht berechnet', async () => {
    const d = await run('bd-run', { date: berlin('2026-10-19', 2), startTime: '06:00', endTime: '06:00', breakMinutes: 0 });
    eq(d.breakdownKey, undefined, 'breakdownKey');
  });

  await check('Gleiche Eingaben → kein zweiter Schreibvorgang (keine Trigger-Schleife)', async () => {
    const ref = db.doc('timesheets/bd-sun');
    const before = (await ref.get()).updateTime!.toMillis();
    const snap = await ref.get();
    await wrapped({ data: fft.makeChange(snap, snap), params: { timesheetId: 'bd-sun' } } as never);
    eq((await ref.get()).updateTime!.toMillis(), before, 'updateTime');
  });

  await check('GoBD-Schutz lässt Server-Aufteilung auf Freigegebenem stehen', async () => {
    const ref = db.doc('timesheets/bd-appr');
    await ref.set({ companyId: 'bd-firma', userId: 'bd-nurse', status: 'approved', date: berlin('2026-10-18', 2), startTime: '06:00', endTime: '14:00', breakMinutes: 0, totalHours: 8 });
    const beforeSnap = await ref.get();
    await wrapped({ data: fft.makeChange(fft.firestore.makeDocumentSnapshot({}, 'timesheets/bd-appr'), beforeSnap), params: { timesheetId: 'bd-appr' } } as never);
    const afterSnap = await ref.get();
    await wrappedProtect({ data: fft.makeChange(beforeSnap, afterSnap), params: { timesheetId: 'bd-appr' } } as never);
    eq((await ref.get()).data()!.weekendHours, 8, 'Wochenendstunden nach Schutz-Trigger');
  });

  await check('GoBD-Schutz setzt geänderte Stunden auf Freigegebenem zurück', async () => {
    const ref = db.doc('timesheets/bd-appr');
    const beforeSnap = await ref.get();
    await ref.update({ totalHours: 3 });
    const afterSnap = await ref.get();
    await wrappedProtect({ data: fft.makeChange(beforeSnap, afterSnap), params: { timesheetId: 'bd-appr' } } as never);
    eq((await ref.get()).data()!.totalHours, 8, 'totalHours');
  });

  await check('Harmlose Änderung an Freigegebenem löst keinen Alarm aus (Datum als Wert verglichen)', async () => {
    const ref = db.doc('timesheets/bd-appr');
    const audits = async () => (await db.collection('auditLogs').where('resourceId', '==', 'bd-appr').get()).size;
    const n0 = await audits();
    const beforeSnap = await ref.get();
    await ref.update({ exportedAt: admin.firestore.Timestamp.now() });
    const afterSnap = await ref.get();
    await wrappedProtect({ data: fft.makeChange(beforeSnap, afterSnap), params: { timesheetId: 'bd-appr' } } as never);
    eq(await audits(), n0, 'Anzahl Audit-Einträge');
  });

  fft.cleanup();
  console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
  process.exit(failures ? 1 : 0);
})();
