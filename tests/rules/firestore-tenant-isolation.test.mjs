/**
 * Multi-Tenant-Isolationstest gegen die echten firestore.rules (Emulator).
 * Nutzt assertSucceeds/assertFails → wirft bei falschem Ergebnis, sodass der
 * Prozess mit Exit-Code != 0 endet (echtes Pass/Fail-Signal für CI).
 *
 * Szenario: Firma A und Firma B, je ein Admin + eine Pflegekraft, je eigene
 * Daten. Erwartung: Zugriff strikt nur innerhalb der eigenen companyId.
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { collection, query, where, getDocs, getDoc, doc, setDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'schichtklar-rules-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

// Seed (Rules aus): saubere Zwei-Firmen-Welt
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  // User-Dokumente (companyId korrekt je Firma)
  await setDoc(doc(db, 'users/adminA'), { companyId: 'firmaA', role: 'admin' });
  await setDoc(doc(db, 'users/nurseA'), { companyId: 'firmaA', role: 'nurse' });
  await setDoc(doc(db, 'users/adminB'), { companyId: 'firmaB', role: 'admin' });
  await setDoc(doc(db, 'users/nurseB'), { companyId: 'firmaB', role: 'nurse' });
  // Fachdaten je Firma
  await setDoc(doc(db, 'shifts/shA'), { companyId: 'firmaA', title: 'Frueh' });
  await setDoc(doc(db, 'shifts/shB'), { companyId: 'firmaB', title: 'Spaet' });
  await setDoc(doc(db, 'facilities/fA'), { companyId: 'firmaA', name: 'Haus A' });
  await setDoc(doc(db, 'facilities/fB'), { companyId: 'firmaB', name: 'Haus B' });
  await setDoc(doc(db, 'timesheets/tsA'), { userId: 'nurseA', companyId: 'firmaA', totalHours: 8 });
  await setDoc(doc(db, 'timesheets/tsB'), { userId: 'nurseB', companyId: 'firmaB', totalHours: 8 });
  await setDoc(doc(db, 'documents/docB'), { userId: 'nurseB', companyId: 'firmaB', name: 'Zeugnis' });
  await setDoc(doc(db, 'documents/docA'), { userId: 'nurseA', companyId: 'firmaA', name: 'Zeugnis A' });
  await setDoc(doc(db, 'adminAnnouncements/annB'), { companyId: 'firmaB', text: 'Hallo B' });
  await setDoc(doc(db, 'assignments/asgA'), { userId: 'nurseA', companyId: 'firmaA', status: 'assigned' });
  await setDoc(doc(db, 'assignments/asgB'), { userId: 'nurseB', companyId: 'firmaB', status: 'assigned' });
  await setDoc(doc(db, 'reports/repA'), { userId: 'nurseA', companyId: 'firmaA' });
  await setDoc(doc(db, 'notifications/ntA'), { userId: 'nurseA', companyId: 'firmaA', read: false });
  await setDoc(doc(db, 'notifications/ntB'), { userId: 'nurseB', companyId: 'firmaB', read: false });
  await setDoc(doc(db, 'alerts/alA'), { userId: 'nurseA', companyId: 'firmaA' });
  await setDoc(doc(db, 'activities/actA'), { companyId: 'firmaA', type: 'login' });
  await setDoc(doc(db, 'limitIncreaseRequests/lrA'), { mitarbeiterId: 'nurseA', companyId: 'firmaA', status: 'pending' });
});

// Kontexte mit echten Claims (role + companyId), wie sie register-admin/accept-invite setzen
const adminA = env.authenticatedContext('adminA', { role: 'admin', companyId: 'firmaA' }).firestore();
const nurseA = env.authenticatedContext('nurseA', { role: 'nurse', companyId: 'firmaA' }).firestore();
const adminB = env.authenticatedContext('adminB', { role: 'admin', companyId: 'firmaB' }).firestore();

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

console.log('--- Mandantenisolation: Firma A darf NICHT auf Firma B ---');
await check('AdminA liest eigene Shifts (companyId==firmaA)', 'ALLOW',
  () => getDocs(query(collection(adminA, 'shifts'), where('companyId', '==', 'firmaA'))));
await check('AdminA liest FREMDE Shifts (companyId==firmaB)', 'DENY',
  () => getDocs(query(collection(adminA, 'shifts'), where('companyId', '==', 'firmaB'))));
await check('AdminA liest ALLE Shifts ohne Filter', 'DENY',
  () => getDocs(collection(adminA, 'shifts')));
await check('NurseA liest FREMDE Shifts direkt', 'DENY',
  () => getDoc(doc(nurseA, 'shifts/shB')));

await check('AdminA liest eigene Facilities', 'ALLOW',
  () => getDocs(query(collection(adminA, 'facilities'), where('companyId', '==', 'firmaA'))));
await check('AdminA liest FREMDE Facilities', 'DENY',
  () => getDocs(query(collection(adminA, 'facilities'), where('companyId', '==', 'firmaB'))));
await check('AdminA liest fremde Facility direkt', 'DENY',
  () => getDoc(doc(adminA, 'facilities/fB')));

await check('AdminA liest eigene Timesheets', 'ALLOW',
  () => getDocs(query(collection(adminA, 'timesheets'), where('companyId', '==', 'firmaA'))));
await check('AdminA liest FREMDE Timesheets', 'DENY',
  () => getDocs(query(collection(adminA, 'timesheets'), where('companyId', '==', 'firmaB'))));

await check('AdminA liest fremdes Dokument direkt', 'DENY',
  () => getDoc(doc(adminA, 'documents/docB')));
await check('AdminA liest fremdes User-Profil direkt', 'DENY',
  () => getDoc(doc(adminA, 'users/nurseB')));
await check('AdminA liest fremde adminAnnouncement direkt', 'DENY',
  () => getDoc(doc(adminA, 'adminAnnouncements/annB')));

console.log('--- Eigene Firma funktioniert weiterhin ---');
await check('NurseA liest eigene Shift direkt', 'ALLOW',
  () => getDoc(doc(nurseA, 'shifts/shA')));
await check('NurseA liest eigene Timesheets (userId==nurseA)', 'ALLOW',
  () => getDocs(query(collection(nurseA, 'timesheets'), where('userId', '==', 'nurseA'))));
await check('AdminA liest eigenes User-Profil (nurseA)', 'ALLOW',
  () => getDoc(doc(adminA, 'users/nurseA')));

console.log('--- Gegenrichtung: AdminB darf NICHT auf Firma A ---');
await check('AdminB liest FREMDE (A) Shifts', 'DENY',
  () => getDocs(query(collection(adminB, 'shifts'), where('companyId', '==', 'firmaA'))));
await check('AdminB liest eigene (B) Shifts', 'ALLOW',
  () => getDocs(query(collection(adminB, 'shifts'), where('companyId', '==', 'firmaB'))));

console.log('--- Reale App-Query-Formen der Kern-Collections (owner + companyId) ---');
// Diese Formen MÜSSEN erlaubt sein, sonst bricht der Live-Flow unter den strikten Rules.
await check('NurseA: eigene Assignments (companyId+userId)', 'ALLOW',
  () => getDocs(query(collection(nurseA, 'assignments'),
    where('companyId', '==', 'firmaA'), where('userId', '==', 'nurseA'))));
await check('NurseA: FREMDE Assignments (companyId==firmaB)', 'DENY',
  () => getDocs(query(collection(nurseA, 'assignments'), where('companyId', '==', 'firmaB'))));
await check('AdminA: alle Assignments der Firma (companyId)', 'ALLOW',
  () => getDocs(query(collection(adminA, 'assignments'), where('companyId', '==', 'firmaA'))));
await check('NurseA: eigene Dokumente (companyId+userId)', 'ALLOW',
  () => getDocs(query(collection(nurseA, 'documents'),
    where('companyId', '==', 'firmaA'), where('userId', '==', 'nurseA'))));
await check('NurseA: eigene Reports (companyId+userId)', 'ALLOW',
  () => getDocs(query(collection(nurseA, 'reports'),
    where('companyId', '==', 'firmaA'), where('userId', '==', 'nurseA'))));
await check('NurseA: eigene Notifications (companyId+userId)', 'ALLOW',
  () => getDocs(query(collection(nurseA, 'notifications'),
    where('companyId', '==', 'firmaA'), where('userId', '==', 'nurseA'))));
await check('NurseA: Notifications OHNE companyId (bricht unter Rules)', 'DENY',
  () => getDocs(query(collection(nurseA, 'notifications'), where('userId', '==', 'nurseA'))));
await check('NurseA: eigene Alerts (companyId+userId)', 'ALLOW',
  () => getDocs(query(collection(nurseA, 'alerts'),
    where('companyId', '==', 'firmaA'), where('userId', '==', 'nurseA'))));
await check('AdminA: Activities der Firma (companyId)', 'ALLOW',
  () => getDocs(query(collection(adminA, 'activities'), where('companyId', '==', 'firmaA'))));
await check('NurseA: eigene limitIncreaseRequests (companyId+mitarbeiterId)', 'ALLOW',
  () => getDocs(query(collection(nurseA, 'limitIncreaseRequests'),
    where('companyId', '==', 'firmaA'), where('mitarbeiterId', '==', 'nurseA'))));

console.log('--- Migrationssicherheit: User OHNE companyId-Claim (nur User-Doc) ---');
// Simuliert eine bestehende Session vor dem Claim-Refresh: kein companyId im
// Token, Rules müssen die companyId aus dem User-Dokument auflösen (Fallback).
const nurseANoClaim = env.authenticatedContext('nurseA', { role: 'nurse' }).firestore();
const adminANoClaim = env.authenticatedContext('adminA', { role: 'admin' }).firestore();
await check('NurseA(ohne Claim) liest eigene Shift (Doc-Fallback)', 'ALLOW',
  () => getDoc(doc(nurseANoClaim, 'shifts/shA')));
await check('AdminA(ohne Claim) liest eigene Shifts gefiltert (Doc-Fallback)', 'ALLOW',
  () => getDocs(query(collection(adminANoClaim, 'shifts'), where('companyId', '==', 'firmaA'))));
await check('AdminA(ohne Claim) liest FREMDE Shifts (weiterhin verweigert)', 'DENY',
  () => getDocs(query(collection(adminANoClaim, 'shifts'), where('companyId', '==', 'firmaB'))));

await env.cleanup();
console.log(`--- Test beendet: ${failures} Fehler ---`);
if (failures > 0) process.exit(1);
