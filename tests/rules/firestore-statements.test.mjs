/**
 * Rules-Test Monatlicher Stundennachweis: Mitarbeiter/in unterschreibt
 * („erfasst“), Disposition erkennt an („anerkannt“); keine Fremdzugriffe,
 * keine Selbst-Anerkennung, nach Anerkennung gesperrt.
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField, Timestamp } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'schichtklar-rules-stmt',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const emp = { employeeSignature: PNG, employeeSignedName: 'Lea Becker', employeeSignedAt: Timestamp.now(), signedFingerprint: 'abc12345', signedTotalHours: 16.75 };
const base = { companyId: 'firmaA', userId: 'nurseA', month: '2026-09' };
const ID = 'firmaA_nurseA_2026-09';
await env.clearFirestore();
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/adminA'), { companyId: 'firmaA', role: 'admin' });
  await setDoc(doc(db, 'users/adminB'), { companyId: 'firmaB', role: 'admin' });
  await setDoc(doc(db, 'users/nurseA'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'users/nurseA2'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'timesheetStatements/firmaA_nurseA_2026-08'), { ...base, month: '2026-08', ...emp });
  await setDoc(doc(db, 'timesheetStatements/firmaA_nurseA_2026-07'), { ...base, month: '2026-07', ...emp, employerSignedAt: Timestamp.now(), employerSignedBy: 'adminA', employerSignedName: 'Pepe' });
});

const adminA = env.authenticatedContext('adminA', { role: 'admin', companyId: 'firmaA' }).firestore();
const adminB = env.authenticatedContext('adminB', { role: 'admin', companyId: 'firmaB' }).firestore();
const nurseA = env.authenticatedContext('nurseA', { role: 'nurse', companyId: 'firmaA' }).firestore();
const nurseA2 = env.authenticatedContext('nurseA2', { role: 'nurse', companyId: 'firmaA' }).firestore();

let failures = 0;
const check = async (name, expect, fn) => {
  try {
    await (expect === 'ALLOW' ? assertSucceeds(fn()) : assertFails(fn()));
    console.log(`OK   | ${name} (${expect})`);
  } catch (e) {
    failures++;
    console.log(`FAIL | ${name} (erwartet ${expect}) → ${e.message?.split('\n')[0]}`);
  }
};
const ack = { employerSignedAt: Timestamp.now(), employerSignedBy: 'adminA', employerSignedName: 'Pepe Disposition', employerSignature: PNG };

console.log('--- Unterschrift Mitarbeiter/in ---');
await check('Pflegekraft unterschreibt eigenen Monat', 'ALLOW', () => setDoc(doc(nurseA, `timesheetStatements/${ID}`), { ...base, ...emp }));
await check('Pflegekraft unterschreibt für Kollegin', 'DENY', () => setDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA2_2026-09'), { ...base, userId: 'nurseA2', ...emp }));
await check('Doc-ID passt nicht zum Monat', 'DENY', () => setDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA_2026-10'), { ...base, ...emp }));
await check('Pflegekraft erkennt selbst an', 'DENY', () => setDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA_2026-06'), { ...base, month: '2026-06', ...emp, ...ack }));
await check('Unterschrift ist kein PNG', 'DENY', () => setDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA_2026-05'), { ...base, month: '2026-05', ...emp, employeeSignature: 'javascript:alert(1)' }));
await check('Ungültiger Monat', 'DENY', () => setDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA_2026-13'), { ...base, month: '2026-13', ...emp }));
await check('Pflegekraft unterschreibt neu (vor Anerkennung)', 'ALLOW', () => updateDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA_2026-08'), { signedFingerprint: 'def67890', signedTotalHours: 18, employeeSignedAt: Timestamp.now() }));
await check('Pflegekraft ändert anerkannten Monat', 'DENY', () => updateDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA_2026-07'), { signedTotalHours: 99 }));
await check('Pflegekraft setzt Anerkennung per Update', 'DENY', () => updateDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA_2026-08'), ack));

console.log('--- Lesen ---');
await check('Pflegekraft liest eigenen', 'ALLOW', () => getDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA_2026-08')));
await check('Kollegin liest fremden', 'DENY', () => getDoc(doc(nurseA2, 'timesheetStatements/firmaA_nurseA_2026-08')));
await check('Disposition liest', 'ALLOW', () => getDoc(doc(adminA, 'timesheetStatements/firmaA_nurseA_2026-08')));
await check('Fremde Disposition liest', 'DENY', () => getDoc(doc(adminB, 'timesheetStatements/firmaA_nurseA_2026-08')));

await check('Pflegekraft fragt eigenen, noch leeren Monat ab', 'ALLOW', () => getDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA_2026-01')));
await check('Pflegekraft fragt leeren Monat der Kollegin ab', 'DENY', () => getDoc(doc(nurseA, 'timesheetStatements/firmaA_nurseA2_2026-01')));
await check('Disposition fragt leeren Monat ab', 'ALLOW', () => getDoc(doc(adminA, 'timesheetStatements/firmaA_nurseA2_2026-01')));
await check('Fremde Disposition fragt leeren Monat ab', 'DENY', () => getDoc(doc(adminB, 'timesheetStatements/firmaA_nurseA2_2026-01')));

console.log('--- Anerkennung Arbeitgeber ---');
await check('Disposition erkennt an', 'ALLOW', () => updateDoc(doc(adminA, 'timesheetStatements/firmaA_nurseA_2026-08'), ack));
await check('Disposition ändert Stunden der Unterschrift', 'DENY', () => updateDoc(doc(adminA, 'timesheetStatements/firmaA_nurseA_2026-08'), { signedTotalHours: 1 }));
await check('Fremde Disposition erkennt an', 'DENY', () => updateDoc(doc(adminB, `timesheetStatements/${ID}`), ack));
await check('Disposition nimmt Anerkennung zurück', 'ALLOW', () => updateDoc(doc(adminA, 'timesheetStatements/firmaA_nurseA_2026-07'), { employerSignedAt: deleteField(), employerSignedBy: deleteField(), employerSignedName: deleteField() }));
await check('Disposition legt Nachweis ohne Unterschrift an', 'DENY', () => setDoc(doc(adminA, 'timesheetStatements/firmaA_nurseA2_2026-09'), { ...base, userId: 'nurseA2', ...ack }));
await check('Löschen gesperrt', 'DENY', () => deleteDoc(doc(adminA, 'timesheetStatements/firmaA_nurseA_2026-08')));

await env.cleanup();
console.log(failures ? `\n${failures} Fehler` : '\nAlle Stundennachweis-Regeln OK');
process.exit(failures ? 1 : 0);
