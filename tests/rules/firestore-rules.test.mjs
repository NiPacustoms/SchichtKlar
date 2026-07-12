import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { collection, query, where, getDocs, getDoc, doc, setDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'schichtklar-rules-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

// Seed: zwei Firmen, je ein Timesheet
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'timesheets/tsA'), { userId: 'nurseA', companyId: 'firmaA', totalHours: 8 });
  await setDoc(doc(db, 'timesheets/tsB'), { userId: 'nurseB', companyId: 'firmaB', totalHours: 8 });
  await setDoc(doc(db, 'shifts/shA'), { companyId: 'firmaA', title: 'Frueh' });
  await setDoc(doc(db, 'shifts/shB'), { companyId: 'firmaB', title: 'Spaet' });
  await setDoc(doc(db, 'users/nurseA'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'users/nurseB'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'documents/dB'), { userId: 'nurseB', companyId: 'firmaA', name: 'Zeugnis' });
  await setDoc(doc(db, 'reports/rB'), { userId: 'nurseB', companyId: 'firmaA' });
});

const nurseA = env.authenticatedContext('nurseA', { role: 'nurse', companyId: 'firmaA' }).firestore();

const fall = async (name, fn, erwartet) => {
  try {
    const r = await fn();
    const n = r?.docs ? ` (${r.docs.length} Docs)` : '';
    console.log(`${erwartet === 'ERLAUBT' ? 'OK ' : 'LECK'} | ${name}: ERLAUBT${n} – erwartet: ${erwartet}`);
  } catch {
    console.log(`${erwartet === 'VERWEIGERT' ? 'OK ' : '??? '} | ${name}: VERWEIGERT – erwartet: ${erwartet}`);
  }
};

console.log('--- Rollen-Isolation (Single-Tenant-Modell) ---');
await fall('Eigene Timesheets (where userId==nurseA)',
  () => getDocs(query(collection(nurseA, 'timesheets'), where('userId', '==', 'nurseA'))), 'ERLAUBT');
await fall('FREMDE Timesheets (where userId==nurseB)',
  () => getDocs(query(collection(nurseA, 'timesheets'), where('userId', '==', 'nurseB'))), 'VERWEIGERT');
await fall('ALLE Timesheets (ohne Filter!)',
  () => getDocs(collection(nurseA, 'timesheets')), 'VERWEIGERT');
await fall('Alle Shifts lesbar (gewollt: offene Schichten)',
  () => getDocs(collection(nurseA, 'shifts')), 'ERLAUBT');
await fall('FREMDE Dokumente (where userId==nurseB)',
  () => getDocs(query(collection(nurseA, 'documents'), where('userId', '==', 'nurseB'))), 'VERWEIGERT');
await fall('FREMDE Reports (where userId==nurseB)',
  () => getDocs(query(collection(nurseA, 'reports'), where('userId', '==', 'nurseB'))), 'VERWEIGERT');
await fall('Fremdes User-Profil direkt lesen',
  () => getDoc(doc(nurseA, 'users/nurseB')), 'VERWEIGERT');

const admin = env.authenticatedContext('admin1', { role: 'admin' }).firestore();
console.log('--- Admin-Zugriff ---');
await fall('Admin liest alle Timesheets',
  () => getDocs(collection(admin, 'timesheets')), 'ERLAUBT');
await fall('Admin liest alle Dokumente',
  () => getDocs(collection(admin, 'documents')), 'ERLAUBT');

await env.cleanup();
console.log('--- Test beendet ---');
