#!/usr/bin/env node

/**
 * Synchronisiert Custom Claims für einen spezifischen User
 * 
 * Verwendung:
 *   node scripts/sync-user-claims.js <userId> [companyId]
 *   node scripts/sync-user-claims.js --all          # Synchronisiert alle User
 *   node scripts/sync-user-claims.js --missing      # Findet User ohne companyId in Claims
 * 
 * Beispiel:
 *   node scripts/sync-user-claims.js pA5xlqXXCxfOrK4f6kydqUiiGNH3
 *   node scripts/sync-user-claims.js pA5xlqXXCxfOrK4f6kydqUiiGNH3 GNN0gkSDEkpZKTdFafYA
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const userId = process.argv[2];
const companyId = process.argv[3];
const syncAll = userId === '--all';
const findMissing = userId === '--missing';

if (!userId && !syncAll && !findMissing) {
  console.error('❌ Bitte User-ID angeben oder --all/--missing verwenden');
  console.error('\nVerwendung:');
  console.error('   node scripts/sync-user-claims.js <userId> [companyId]');
  console.error('   node scripts/sync-user-claims.js --all          # Synchronisiert alle User');
  console.error('   node scripts/sync-user-claims.js --missing      # Findet User ohne companyId');
  process.exit(1);
}

// Lade Service Account Credentials
const possiblePaths = [
  path.join(__dirname, '../.keys/jobflow25-admin.json'),
  path.join(process.env.HOME || process.env.USERPROFILE || '', '.keys/jobflow25-admin.json'),
  '/Users/patrickschmidt/.keys/jobflow25-admin.json',
];

let serviceAccountPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    serviceAccountPath = p;
    break;
  }
}

if (!serviceAccountPath) {
  console.error('❌ Service Account Datei nicht gefunden');
  console.error('   Bitte lege die Datei in einem der folgenden Pfade ab:');
  possiblePaths.forEach(p => console.error(`   - ${p}`));
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialisiere Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function syncUserClaims() {
  try {
    console.log(`🔄 Synchronisiere Custom Claims für User: ${userId}\n`);

    // Hole User-Dokument aus Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error(`❌ User-Dokument nicht gefunden: ${userId}`);
      process.exit(1);
    }

    const userData = userDoc.data();
    const firestoreRole = userData.role || 'nurse';
    const firestoreCompanyId = companyId || userData.companyId;

    console.log('📋 User-Daten aus Firestore:');
    console.log(`   Email: ${userData.email || 'N/A'}`);
    console.log(`   Role: ${firestoreRole}`);
    console.log(`   Company ID: ${firestoreCompanyId || '❌ NICHT GESETZT'}`);

    // Prüfe ob User in Auth existiert
    let firebaseUser;
    try {
      firebaseUser = await auth.getUser(userId);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.error(`❌ User existiert nicht in Firebase Auth: ${userId}`);
        process.exit(1);
      }
      throw error;
    }

    // Prüfe aktuelle Custom Claims
    const currentClaims = firebaseUser.customClaims || {};
    const currentRole = currentClaims.role;
    const currentCompanyId = currentClaims.companyId;

    console.log('\n📋 Aktuelle Custom Claims:');
    console.log(`   Role: ${currentRole || '❌ NICHT GESETZT'}`);
    console.log(`   Company ID: ${currentCompanyId || '❌ NICHT GESETZT'}`);

    // Erstelle neue Claims
    const newClaims = {
      ...currentClaims,
      role: firestoreRole,
    };

    if (firestoreCompanyId) {
      newClaims.companyId = firestoreCompanyId;
    }

    // Prüfe, ob Update notwendig ist
    const roleChanged = currentRole !== firestoreRole;
    const companyIdChanged = firestoreCompanyId && currentCompanyId !== firestoreCompanyId;

    if (!roleChanged && !companyIdChanged) {
      console.log('\n✅ Custom Claims sind bereits synchronisiert!');
      process.exit(0);
    }

    console.log('\n🔄 Aktualisiere Custom Claims...');
    
    // Setze Custom Claims
    await auth.setCustomUserClaims(userId, newClaims);

    console.log('\n✅ Custom Claims erfolgreich aktualisiert!');
    console.log(`   Role: ${currentRole || 'none'} → ${firestoreRole}`);
    if (companyIdChanged) {
      console.log(`   Company ID: ${currentCompanyId || 'none'} → ${firestoreCompanyId}`);
    }

    console.log('\n⚠️  WICHTIG: Der Benutzer muss sich aus- und wieder einloggen,');
    console.log('   damit die Änderungen (Custom Claims) im Token wirksam werden.');

  } catch (error) {
    console.error('\n❌ Fehler:', error.message);
    console.error(error);
    process.exit(1);
  }
}

syncUserClaims();

