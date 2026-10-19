/**
 * Rules-Test für Einsätze: Kandidaten-Lesezugriff auf ausgeschriebene Einsätze
 * und Schutz der Felder, die Admin/Server vorbehalten sind (Person, Firma,
 * Tagesregel). assertSucceeds/assertFails → Exit-Code != 0 bei Fehlern.
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'schichtklar-rules-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/adminA'), { companyId: 'firmaA', role: 'admin' });
  await setDoc(doc(db, 'users/nurseA'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'users/nurseA2'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'users/nurseB'), { companyId: 'firmaB', role: 'nurse' });
  await setDoc(doc(db, 'assignments/pub'), {
    companyId: 'firmaA', status: 'published', userId: null, candidateUserIds: ['nurseA'],
  });
  await setDoc(doc(db, 'assignments/own'), { companyId: 'firmaA', status: 'assigned', userId: 'nurseA' });
});

const adminA = env.authenticatedContext('adminA', { role: 'admin', companyId: 'firmaA' }).firestore();
const nurseA = env.authenticatedContext('nurseA', { role: 'nurse', companyId: 'firmaA' }).firestore();
const nurseA2 = env.authenticatedContext('nurseA2', { role: 'nurse', companyId: 'firmaA' }).firestore();
const nurseB = env.authenticatedContext('nurseB', { role: 'nurse', companyId: 'firmaB' }).firestore();

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

console.log('--- Ausgeschriebene Einsätze ---');
await check('Kandidat liest ausgeschriebenen Einsatz', 'ALLOW', () => getDoc(doc(nurseA, 'assignments/pub')));
await check('Nicht angefragte Kollegin liest ihn nicht', 'DENY', () => getDoc(doc(nurseA2, 'assignments/pub')));
await check('Fremde Firma liest ihn nicht', 'DENY', () => getDoc(doc(nurseB, 'assignments/pub')));
await check('Kandidat nimmt per Direktschreiben an (nur via Server)', 'DENY',
  () => updateDoc(doc(nurseA, 'assignments/pub'), { userId: 'nurseA', status: 'accepted' }));

console.log('--- Eigene Einsätze ---');
await check('Nurse nimmt eigenen Einsatz an', 'ALLOW',
  () => updateDoc(doc(nurseA, 'assignments/own'), { status: 'accepted' }));
await check('Nurse schiebt Einsatz auf andere Person', 'DENY',
  () => updateDoc(doc(nurseA, 'assignments/own'), { userId: 'nurseA2' }));
await check('Nurse setzt sich selbst eine Tagesregel-Übersteuerung', 'DENY',
  () => updateDoc(doc(nurseA, 'assignments/own'), { dayRuleOverride: { reason: 'selbst genehmigt!!', by: 'nurseA' } }));
await check('Nurse entfernt Verstoß-Markierung', 'DENY',
  () => updateDoc(doc(nurseA, 'assignments/own'), { dayRuleViolation: null }));
await check('Admin setzt Übersteuerung mit Begründung', 'ALLOW',
  () => updateDoc(doc(adminA, 'assignments/own'), { dayRuleOverride: { reason: 'Geteilter Dienst, abgestimmt', by: 'adminA' } }));

await env.cleanup();
console.log('--- Ende ---');
if (failures > 0) process.exit(1);
