#!/usr/bin/env node

/**
 * Normalisiert bestehende Benutzerrollen in Firestore.
 * - role "dispatcher" (entfernte Rolle) → "admin"
 * - Alle anderen ungültigen Rollen (z.B. "user") → "nurse"
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const DEFAULT_SERVICE_ACCOUNT = path.resolve(
  process.env.HOME || process.cwd(),
  '.keys',
  'jobflow25-admin.json'
);

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || DEFAULT_SERVICE_ACCOUNT;

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service-Account-Datei nicht gefunden.');
  console.error('   Erwartet unter:', serviceAccountPath);
  console.error('   Alternativ Umgebungsvariable FIREBASE_SERVICE_ACCOUNT_PATH setzen.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();
const allowedRoles = new Set(['admin', 'nurse']);

(async () => {
  console.log('🔍 Scanne Firestore-Collection "users" nach ungültigen Rollen...');

  const snapshot = await db.collection('users').get();
  if (snapshot.empty) {
    console.log('ℹ️ Keine Benutzer gefunden.');
    process.exit(0);
  }

  let migrated = 0;
  let alreadyCompliant = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const role = data.role;

    if (!allowedRoles.has(role)) {
      // Dispatcher-Rolle wurde entfernt → Admin-Rechte
      const newRole = role === 'dispatcher' ? 'admin' : 'nurse';
      await doc.ref.update({
        role: newRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        migrationMeta: {
          previousRole: role || null,
          normalizedAt: admin.firestore.FieldValue.serverTimestamp(),
          normalizedBy: 'scripts/fix-user-roles',
        },
      });
      migrated += 1;
      console.log(`✔︎ Rolle korrigiert für ${doc.id}: ${role} → ${newRole}`);
    } else {
      alreadyCompliant += 1;
    }
  }

  console.log('\n✅ Migration abgeschlossen.');
  console.log(`   Angepasste Benutzer: ${migrated}`);
  console.log(`   Bereits konforme Benutzer: ${alreadyCompliant}`);
  if (migrated > 0) {
    console.log('\n💡 Custom Claims aktualisieren: node scripts/sync-custom-claims.js --force');
  }
  process.exit(0);
})().catch(error => {
  console.error('❌ Migration fehlgeschlagen:', error);
  process.exit(1);
});

