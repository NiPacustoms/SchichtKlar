/**
 * Rules-Test Zeiterfassung: Ablauf Entwurf → eingereicht → freigegeben/abgelehnt
 * und Schutz der Stunden vor Selbstfreigabe und Fremdmandanten.
 * assertSucceeds/assertFails → Exit-Code != 0 bei Fehlern.
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'schichtklar-rules-ts',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

const base = { companyId: 'firmaA', userId: 'nurseA', startTime: '06:00', endTime: '14:00', breakMinutes: 30, totalHours: 7.5 };
await env.clearFirestore();
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/adminA'), { companyId: 'firmaA', role: 'admin' });
  await setDoc(doc(db, 'users/adminB'), { companyId: 'firmaB', role: 'admin' });
  await setDoc(doc(db, 'users/nurseA'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'users/nurseA2'), { companyId: 'firmaA', role: 'nurse' });
  for (const [id, status] of [['draft', 'draft'], ['draft2', 'draft'], ['draft3', 'draft'], ['sub', 'submitted'], ['sub2', 'submitted'], ['sub3', 'submitted'], ['appr', 'approved'], ['rej', 'rejected']]) {
    await setDoc(doc(db, `timesheets/${id}`), { ...base, status });
  }
  await setDoc(doc(db, 'timesheets/legacy'), { userId: 'nurseA', startTime: '06:00', endTime: '14:00', totalHours: 8, status: 'approved' });
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
const sig = { facilitySignatureUrl: 'https://x/sig.png', facilitySignedAt: new Date(), facilitySignerName: 'Herr Lehmann (PDL)' };

console.log('--- Anlegen ---');
await check('Pflegekraft legt eigenen Entwurf an', 'ALLOW', () => setDoc(doc(nurseA, 'timesheets/n1'), { ...base, status: 'draft' }));
await check('Pflegekraft legt Zeiten für Kollegin an', 'DENY', () => setDoc(doc(nurseA, 'timesheets/n2'), { ...base, userId: 'nurseA2', status: 'draft' }));
await check('Pflegekraft legt direkt freigegebene Zeiten an', 'DENY', () => setDoc(doc(nurseA, 'timesheets/n3'), { ...base, status: 'approved' }));
await check('Pflegekraft legt Zeiten ohne Firma an', 'DENY', () => setDoc(doc(nurseA, 'timesheets/n4'), { ...base, companyId: null, status: 'draft' }));
await check('Pflegekraft legt Zeiten mit approvedBy an', 'DENY', () => setDoc(doc(nurseA, 'timesheets/n5'), { ...base, status: 'draft', approvedBy: 'adminA' }));
await check('Admin legt Zeiten für Pflegekraft an', 'ALLOW', () => setDoc(doc(adminA, 'timesheets/a1'), { ...base, status: 'draft' }));
await check('Admin legt Zeiten in fremder Firma an', 'DENY', () => setDoc(doc(adminB, 'timesheets/b1'), { ...base, status: 'draft' }));

console.log('--- Bearbeiten & Einreichen ---');
await check('Pflegekraft korrigiert eigenen Entwurf', 'ALLOW', () => updateDoc(doc(nurseA, 'timesheets/draft'), { endTime: '14:30', totalHours: 8 }));
await check('Pflegekraft reicht Entwurf ein', 'ALLOW', () => updateDoc(doc(nurseA, 'timesheets/draft2'), { status: 'submitted', submittedAt: new Date() }));
await check('Pflegekraft gibt eigenen Entwurf frei (ohne Unterschrift)', 'DENY', () => updateDoc(doc(nurseA, 'timesheets/draft3'), { status: 'approved' }));
await check('Pflegekraft schiebt Zeiten auf Kollegin', 'DENY', () => updateDoc(doc(nurseA, 'timesheets/draft3'), { userId: 'nurseA2' }));
await check('Pflegekraft ändert eingereichte Stunden', 'DENY', () => updateDoc(doc(nurseA, 'timesheets/sub'), { totalHours: 12 }));
await check('Pflegekraft ändert abgelehnte Zeiten', 'ALLOW', () => updateDoc(doc(nurseA, 'timesheets/rej'), { endTime: '13:30', totalHours: 7, status: 'draft' }));
await check('Kollegin ändert fremde Zeiten', 'DENY', () => updateDoc(doc(nurseA2, 'timesheets/draft3'), { endTime: '15:00' }));

console.log('--- Unterschrift der Einrichtung vor Ort ---');
await check('Unterschrift auf eingereichten Zeiten gibt frei', 'ALLOW', () => updateDoc(doc(nurseA, 'timesheets/sub2'), { ...sig, status: 'approved' }));
await check('Unterschrift ohne Bild gibt nicht frei', 'DENY', () => updateDoc(doc(nurseA, 'timesheets/draft3'), { facilitySignerName: 'X', status: 'approved' }));
await check('Unterschrift mit gleichzeitig geänderten Stunden', 'DENY', () => updateDoc(doc(nurseA, 'timesheets/sub3'), { ...sig, status: 'approved', totalHours: 12 }));

console.log('--- Freigabe durch Disposition ---');
await check('Admin gibt eingereichte Zeiten frei', 'ALLOW', () => updateDoc(doc(adminA, 'timesheets/sub3'), { status: 'approved', approvedBy: 'adminA', approvedAt: new Date() }));
await check('Admin lehnt eingereichte Zeiten ab', 'ALLOW', () => updateDoc(doc(adminA, 'timesheets/sub'), { status: 'rejected', rejectionReason: 'Pause fehlt' }));
await check('Admin fremder Firma gibt frei', 'DENY', () => updateDoc(doc(adminB, 'timesheets/draft'), { status: 'approved' }));

console.log('--- Freigegeben = unveränderlich (GoBD) ---');
await check('Admin ändert freigegebene Stunden', 'DENY', () => updateDoc(doc(adminA, 'timesheets/appr'), { totalHours: 4 }));
await check('Admin setzt Freigabe zurück auf eingereicht', 'DENY', () => updateDoc(doc(adminA, 'timesheets/appr'), { status: 'submitted' }));
await check('Pflegekraft reicht Freigegebenes erneut ein', 'DENY', () => updateDoc(doc(nurseA, 'timesheets/appr'), { status: 'submitted' }));
await check('Admin löscht Freigegebenes', 'DENY', () => deleteDoc(doc(adminA, 'timesheets/appr')));
await check('Pflegekraft löscht eigenen Entwurf', 'ALLOW', () => deleteDoc(doc(nurseA, 'timesheets/draft')));

console.log('--- Lesen ---');
await check('Admin liest Zeiten der eigenen Firma', 'ALLOW', () => getDoc(doc(adminA, 'timesheets/appr')));
await check('Admin fremder Firma liest Altdaten ohne Firma', 'DENY', () => getDoc(doc(adminB, 'timesheets/legacy')));
await check('Pflegekraft liest eigene Altdaten', 'ALLOW', () => getDoc(doc(nurseA, 'timesheets/legacy')));
await check('Admin listet Zeiten der Firma', 'ALLOW', () => getDocs(query(collection(adminA, 'timesheets'), where('companyId', '==', 'firmaA'))));

console.log('--- Gesperrte Sammlungen ---');
await check('Frühere Lohnexport-Einstellungen sind gesperrt', 'DENY', () => getDoc(doc(adminA, 'payrollSettings/firmaA')));
await check('Freigabe-Links sind für Clients gesperrt', 'DENY', () => getDoc(doc(adminA, 'facilityApprovalLinks/x')));

await env.cleanup();
console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures ? 1 : 0);
