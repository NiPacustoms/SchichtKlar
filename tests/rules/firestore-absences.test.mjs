/**
 * Rules-Test Krankmeldungen: ohne Genehmigung, ohne Diagnose, keine
 * Urlaubsverwaltung, Mandantentrennung.
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'schichtklar-rules-abs',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

const sick = { companyId: 'firmaA', userId: 'nurseA', type: 'sick', fromKey: '2026-10-19', toKey: '2026-10-20', status: 'reported', auProvided: false };
await env.clearFirestore();
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/adminA'), { companyId: 'firmaA', role: 'admin' });
  await setDoc(doc(db, 'users/adminB'), { companyId: 'firmaB', role: 'admin' });
  await setDoc(doc(db, 'users/nurseA'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'users/nurseA2'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'absences/sick'), sick);
  await setDoc(doc(db, 'absences/sick2'), sick);
  await setDoc(doc(db, 'absences/sick3'), { ...sick, status: 'cancelled' });
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

console.log('--- Krank melden ---');
await check('Pflegekraft meldet sich krank', 'ALLOW', () => setDoc(doc(nurseA, 'absences/n1'), sick));
await check('Urlaub kann nicht mehr angelegt werden', 'DENY', () => setDoc(doc(nurseA, 'absences/n2'), { ...sick, type: 'vacation', status: 'requested' }));
await check('Pflegekraft meldet Kollegin krank', 'DENY', () => setDoc(doc(nurseA, 'absences/n3'), { ...sick, userId: 'nurseA2' }));
await check('Pflegekraft: Ende vor Beginn', 'DENY', () => setDoc(doc(nurseA, 'absences/n4'), { ...sick, fromKey: '2026-10-21', toKey: '2026-10-19' }));
await check('Pflegekraft: falsches Datumsformat', 'DENY', () => setDoc(doc(nurseA, 'absences/n5'), { ...sick, fromKey: '19.10.2026' }));
await check('Kein Diagnose-/Freitextfeld', 'DENY', () => setDoc(doc(nurseA, 'absences/n6'), { ...sick, note: 'Grippe' }));
await check('Pflegekraft: andere Firma', 'DENY', () => setDoc(doc(nurseA, 'absences/n7'), { ...sick, companyId: 'firmaB' }));
await check('Pflegekraft setzt betroffene Einsätze selbst', 'DENY', () => setDoc(doc(nurseA, 'absences/n8'), { ...sick, affectedAssignmentIds: [] }));
await check('Disposition meldet Person der Firma krank', 'ALLOW', () => setDoc(doc(adminA, 'absences/a1'), { ...sick, userId: 'nurseA2' }));
await check('Fremde Disposition meldet krank', 'DENY', () => setDoc(doc(adminB, 'absences/b1'), sick));

console.log('--- Lesen ---');
await check('Pflegekraft liest eigene', 'ALLOW', () => getDoc(doc(nurseA, 'absences/sick')));
await check('Kollegin liest fremde', 'DENY', () => getDoc(doc(nurseA2, 'absences/sick')));
await check('Disposition liest Firma', 'ALLOW', () => getDocs(query(collection(adminA, 'absences'), where('companyId', '==', 'firmaA'))));
await check('Fremde Disposition liest', 'DENY', () => getDoc(doc(adminB, 'absences/sick')));

console.log('--- Ändern ---');
await check('Pflegekraft verlängert + Arzt war da', 'ALLOW', () => updateDoc(doc(nurseA, 'absences/sick'), { toKey: '2026-10-23', auProvided: true }));
await check('Pflegekraft verschiebt Beginn', 'DENY', () => updateDoc(doc(nurseA, 'absences/sick'), { fromKey: '2026-10-01' }));
await check('Pflegekraft macht daraus Urlaub', 'DENY', () => updateDoc(doc(nurseA, 'absences/sick'), { type: 'vacation' }));
await check('Pflegekraft zieht zurück', 'ALLOW', () => updateDoc(doc(nurseA, 'absences/sick2'), { status: 'cancelled' }));
await check('Zurückgezogene wieder aktivieren', 'DENY', () => updateDoc(doc(nurseA, 'absences/sick3'), { status: 'reported' }));
await check('Kollegin zieht fremde zurück', 'DENY', () => updateDoc(doc(nurseA2, 'absences/sick'), { status: 'cancelled' }));
await check('Disposition zieht zurück', 'ALLOW', () => updateDoc(doc(adminA, 'absences/sick'), { status: 'cancelled' }));
await check('Fremde Disposition ändert', 'DENY', () => updateDoc(doc(adminB, 'absences/a1'), { status: 'cancelled' }));
await check('Löschen ist gesperrt (Nachweis)', 'DENY', () => deleteDoc(doc(adminA, 'absences/a1')));

console.log('--- Personalstamm ---');
await check('Pflegekraft ändert eigenen Stundenlohn', 'DENY', () => updateDoc(doc(nurseA, 'users/nurseA'), { hourlyRate: 99 }));
await check('Pflegekraft ändert eigene Telefonnummer', 'ALLOW', () => updateDoc(doc(nurseA, 'users/nurseA'), { phone: '0151 1' }));
await check('Firmen-Dokument ist für Clients gesperrt', 'DENY', () => getDoc(doc(nurseA, 'companies/firmaA')));

await env.cleanup();
console.log(failures ? `\n${failures} Fehler` : '\nAlle Krankmeldungs-Regeln OK');
process.exit(failures ? 1 : 0);
