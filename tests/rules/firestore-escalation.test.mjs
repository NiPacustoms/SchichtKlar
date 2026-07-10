import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'schichtklar-rules-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/nurseA'), { companyId: 'firmaA', role: 'nurse', name: 'A' });
});

const nurseA = env.authenticatedContext('nurseA', { role: 'nurse', companyId: 'firmaA' }).firestore();

const fall = async (name, fn, erwartet) => {
  try {
    await fn();
    console.log(`${erwartet === 'ERLAUBT' ? 'OK  ' : 'LECK'} | ${name}: ERLAUBT – erwartet: ${erwartet}`);
  } catch {
    console.log(`${erwartet === 'VERWEIGERT' ? 'OK  ' : 'FEHL'} | ${name}: VERWEIGERT – erwartet: ${erwartet}`);
  }
};

console.log('--- Rollen-Eskalation (users self-update) ---');
await fall('Nurse ändert eigenen Namen (harmlos)',
  () => updateDoc(doc(nurseA, 'users/nurseA'), { name: 'Neu' }), 'ERLAUBT');
await fall('Nurse eskaliert eigene Rolle auf admin',
  () => updateDoc(doc(nurseA, 'users/nurseA'), { role: 'admin' }), 'VERWEIGERT');
await fall('Nurse setzt eigene customRoleId',
  () => updateDoc(doc(nurseA, 'users/nurseA'), { customRoleId: 'superadmin' }), 'VERWEIGERT');
await fall('Nurse ändert eigene companyId',
  () => updateDoc(doc(nurseA, 'users/nurseA'), { companyId: 'firmaX' }), 'VERWEIGERT');

await env.cleanup();
console.log('--- Ende ---');
