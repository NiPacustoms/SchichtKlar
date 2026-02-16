#!/usr/bin/env node

/**
 * Synchronisiert Custom Claims für alle User aus Firestore
 * 
 * Dieses Script stellt sicher, dass alle User in Firebase Auth
 * die korrekten Custom Claims haben, basierend auf ihren Firestore-Dokumenten.
 * 
 * Verwendung:
 *   node scripts/sync-custom-claims.js
 * 
 * Optionen:
 *   --dry-run    Zeigt an, was geändert würde, ohne Änderungen vorzunehmen
 *   --force      Aktualisiert auch User, die bereits Custom Claims haben
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

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

const allowedRoles = ['admin', 'dispatcher', 'nurse'];

async function syncCustomClaims() {
  console.log('🔄 Synchronisiere Custom Claims für alle User...\n');
  
  if (dryRun) {
    console.log('⚠️  DRY-RUN Modus: Es werden keine Änderungen vorgenommen\n');
  }
  
  try {
    // Hole alle User aus Firestore
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️  Keine User in Firestore gefunden');
      return;
    }
    
    console.log(`📊 Gefunden: ${usersSnapshot.size} User in Firestore\n`);
    
    let synced = 0;
    let skipped = 0;
    let errors = 0;
    let notFound = 0;
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const uid = doc.id;
      const firestoreRole = userData.role;
      const email = userData.email || userData.displayName || uid;
      
      // Prüfe, ob die Rolle gültig ist
      if (!firestoreRole || !allowedRoles.includes(firestoreRole)) {
        console.log(`⚠️  ${email}: Ungültige oder fehlende Rolle (${firestoreRole || 'none'})`);
        skipped++;
        continue;
      }
      
      try {
        // Prüfe ob User in Auth existiert
        let firebaseUser;
        try {
          firebaseUser = await auth.getUser(uid);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            console.log(`⚠️  ${email}: User existiert nicht in Firebase Auth`);
            notFound++;
            continue;
          }
          throw error;
        }
        
        // Prüfe aktuelle Custom Claims
        const currentClaims = firebaseUser.customClaims || {};
        const currentRole = currentClaims.role;
        
        // Entscheide, ob aktualisiert werden soll
        const needsUpdate = currentRole !== firestoreRole;
        const shouldUpdate = needsUpdate && (force || !currentRole);
        
        if (!shouldUpdate) {
          if (currentRole === firestoreRole) {
            console.log(`✓ ${email}: Bereits synchronisiert (${currentRole})`);
          } else if (currentRole && !force) {
            console.log(`⊘ ${email}: Übersprungen (${currentRole} → ${firestoreRole}, verwende --force zum Überschreiben)`);
          }
          skipped++;
          continue;
        }
        
        if (dryRun) {
          console.log(`[DRY-RUN] ${email}: Würde aktualisieren (${currentRole || 'none'} → ${firestoreRole})`);
          synced++;
        } else {
          // Setze Custom Claims
          await auth.setCustomUserClaims(uid, {
            ...currentClaims,
            role: firestoreRole,
          });
          
          console.log(`✅ ${email}: Aktualisiert (${currentRole || 'none'} → ${firestoreRole})`);
          synced++;
        }
        
      } catch (error) {
        console.error(`❌ ${email}: Fehler - ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Zusammenfassung:`);
    console.log(`   ✅ Synchronisiert: ${synced}`);
    console.log(`   ⊘ Übersprungen: ${skipped}`);
    console.log(`   ⚠️  Nicht gefunden: ${notFound}`);
    console.log(`   ❌ Fehler: ${errors}`);
    
    if (dryRun && synced > 0) {
      console.log(`\n💡 Führe das Script ohne --dry-run aus, um die Änderungen anzuwenden.`);
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Synchronisieren:', error);
    process.exit(1);
  }
}

// Hauptfunktion
(async () => {
  try {
    await syncCustomClaims();
    process.exit(0);
  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
    process.exit(1);
  }
})();














