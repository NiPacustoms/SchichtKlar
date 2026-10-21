/**
 * Rules-Test Abwesenheiten: Urlaub beantragen/genehmigen, Krankmeldung ohne
 * Genehmigung, keine Selbstgenehmigung, Mandantentrennung.
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'schichtklar-rules-abs',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

const vac = { companyId: 'firmaA', userId: 'nurseA', type: 'vacation', fromKey: '2026-11-02', toKey: '2026-11-06', status: 'requested', note: null };
const sick = { companyId: 'firmaA', userId: 'nurseA', type: 'sick', fromKey: '2026-10-19', toKey: '2026-10-20', status: 'reported', auProvided: false };
await env.clearFirestore();
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/adminA'), { companyId: 'firmaA', role: 'admin' });
  await setDoc(doc(db, 'users/adminB'), { companyId: 'firmaB', role: 'admin' });
  await setDoc(doc(db, 'users/nurseA'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'users/nurseA2'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'absences/req'), vac);
  await setDoc(doc(db, 'absences/req2'), vac);
  await setDoc(doc(db, 'absences/req3'), vac);
  await setDoc(doc(db, 'absences/appr'), { ...vac, status: 'approved' });
  await setDoc(doc(db, 'absences/sick'), sick);
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

console.log('--- Anlegen ---');
await check('Pflegekraft beantragt Urlaub', 'ALLOW', () => setDoc(doc(nurseA, 'absences/n1'), vac));
await check('Pflegekraft meldet sich krank', 'ALLOW', () => setDoc(doc(nurseA, 'absences/n2'), sick));
await check('Pflegekraft genehmigt eigenen Urlaub beim Anlegen', 'DENY', () => setDoc(doc(nurseA, 'absences/n3'), { ...vac, status: 'approved' }));
await check('Pflegekraft beantragt Urlaub für Kollegin', 'DENY', () => setDoc(doc(nurseA, 'absences/n4'), { ...vac, userId: 'nurseA2' }));
await check('Pflegekraft: Ende vor Beginn', 'DENY', () => setDoc(doc(nurseA, 'absences/n5'), { ...vac, fromKey: '2026-11-06', toKey: '2026-11-02' }));
await check('Pflegekraft: falsches Datumsformat', 'DENY', () => setDoc(doc(nurseA, 'absences/n6'), { ...vac, fromKey: '02.11.2026' }));
await check('Pflegekraft: unbekannter Typ', 'DENY', () => setDoc(doc(nurseA, 'absences/n7'), { ...vac, type: 'sonder' }));
await check('Pflegekraft: Notiz über 300 Zeichen', 'DENY', () => setDoc(doc(nurseA, 'absences/n8'), { ...vac, note: 'x'.repeat(301) }));
await check('Pflegekraft: andere Firma', 'DENY', () => setDoc(doc(nurseA, 'absences/n9'), { ...vac, companyId: 'firmaB' }));
await check('Pflegekraft: mit decidedBy', 'DENY', () => setDoc(doc(nurseA, 'absences/n10'), { ...vac, decidedBy: 'nurseA' }));
await check('Disposition trägt genehmigten Urlaub ein', 'ALLOW', () => setDoc(doc(adminA, 'absences/a1'), { ...vac, status: 'approved' }));
await check('Fremde Disposition trägt ein', 'DENY', () => setDoc(doc(adminB, 'absences/b1'), { ...vac, status: 'approved' }));

console.log('--- Lesen ---');
await check('Pflegekraft liest eigene', 'ALLOW', () => getDoc(doc(nurseA, 'absences/req')));
await check('Kollegin liest fremde', 'DENY', () => getDoc(doc(nurseA2, 'absences/req')));
await check('Disposition liest Firma', 'ALLOW', () => getDocs(query(collection(adminA, 'absences'), where('companyId', '==', 'firmaA'))));
await check('Fremde Disposition liest', 'DENY', () => getDoc(doc(adminB, 'absences/req')));
await check('Pflegekraft listet eigene', 'ALLOW', () => getDocs(query(collection(nurseA, 'absences'), where('userId', '==', 'nurseA'), where('companyId', '==', 'firmaA'))));

console.log('--- Ändern ---');
await check('Pflegekraft genehmigt eigenen Antrag', 'DENY', () => updateDoc(doc(nurseA, 'absences/req'), { status: 'approved' }));
await check('Pflegekraft verschiebt offenen Antrag', 'DENY', () => updateDoc(doc(nurseA, 'absences/req'), { toKey: '2026-11-20' }));
await check('Pflegekraft zieht Antrag zurück', 'ALLOW', () => updateDoc(doc(nurseA, 'absences/req'), { status: 'cancelled' }));
await check('Pflegekraft storniert genehmigten Urlaub selbst', 'DENY', () => updateDoc(doc(nurseA, 'absences/appr'), { status: 'cancelled' }));
await check('Pflegekraft verlängert Krankmeldung + AU', 'ALLOW', () => updateDoc(doc(nurseA, 'absences/sick'), { toKey: '2026-10-23', auProvided: true }));
await check('Pflegekraft verschiebt Krankheitsbeginn', 'DENY', () => updateDoc(doc(nurseA, 'absences/sick'), { fromKey: '2026-10-01' }));
await check('Pflegekraft macht Krankmeldung zu Urlaub', 'DENY', () => updateDoc(doc(nurseA, 'absences/sick'), { type: 'vacation' }));
await check('Kollegin zieht fremden Antrag zurück', 'DENY', () => updateDoc(doc(nurseA2, 'absences/req2'), { status: 'cancelled' }));
await check('Disposition genehmigt', 'ALLOW', () => updateDoc(doc(adminA, 'absences/req2'), { status: 'approved', decidedBy: 'adminA', decidedAt: new Date() }));
await check('Disposition lehnt ab mit Grund', 'ALLOW', () => updateDoc(doc(adminA, 'absences/req3'), { status: 'rejected', decidedBy: 'adminA', decisionNote: 'Personalengpass' }));
await check('Disposition schiebt Antrag auf andere Person', 'DENY', () => updateDoc(doc(adminA, 'absences/appr'), { userId: 'nurseA2' }));
await check('Fremde Disposition genehmigt', 'DENY', () => updateDoc(doc(adminB, 'absences/sick'), { status: 'cancelled' }));
await check('Löschen ist gesperrt (Nachweis)', 'DENY', () => deleteDoc(doc(adminA, 'absences/appr')));

console.log('--- Personalstamm ---');
await check('Pflegekraft erhöht eigenen Urlaubsanspruch', 'DENY', () => updateDoc(doc(nurseA, 'users/nurseA'), { vacationDaysPerYear: 60 }));
await check('Pflegekraft ändert eigenen Stundenlohn', 'DENY', () => updateDoc(doc(nurseA, 'users/nurseA'), { hourlyRate: 99 }));
await check('Pflegekraft ändert eigene Telefonnummer', 'ALLOW', () => updateDoc(doc(nurseA, 'users/nurseA'), { phone: '0151 1' }));
await check('Disposition setzt Urlaubsanspruch', 'ALLOW', () => updateDoc(doc(adminA, 'users/nurseA'), { vacationDaysPerYear: 30 }));

console.log('--- Firmen-Stammdaten ---');
await env.withSecurityRulesDisabled(async ctx => { await setDoc(doc(ctx.firestore(), 'companies/firmaA'), { name: 'A', holidayState: 'NW' }); await setDoc(doc(ctx.firestore(), 'companies/firmaB'), { name: 'B' }); });
await check('Pflegekraft liest eigene Firma', 'ALLOW', () => getDoc(doc(nurseA, 'companies/firmaA')));
await check('Pflegekraft liest fremde Firma', 'DENY', () => getDoc(doc(nurseA, 'companies/firmaB')));
await check('Disposition ändert Firma direkt', 'DENY', () => updateDoc(doc(adminA, 'companies/firmaA'), { holidayState: 'BY' }));

await env.cleanup();
console.log(failures ? `\n${failures} Fehler` : '\nAlle Abwesenheits-Regeln OK');
process.exit(failures ? 1 : 0);
