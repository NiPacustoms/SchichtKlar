#!/usr/bin/env node

/**
 * Prüft, ob konfigurierte Firestore-Collections leer sind.
 * Chat- und Lohnabrechnungs-Features wurden aus der App entfernt; keine Prüfung dieser Collections mehr.
 * Erwartet: FIREBASE_ADMIN_CREDENTIALS in .env.local oder GOOGLE_APPLICATION_CREDENTIALS.
 */

const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const admin = require('firebase-admin');

function getServiceAccount() {
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed?.client_email && parsed?.private_key) {
      return {
        ...parsed,
        private_key: (parsed.private_key || '').replace(/\\n/g, '\n'),
      };
    }
  } catch (_) {}
  return null;
}

async function main() {
  if (!admin.apps.length) {
    const sa = getServiceAccount();
    if (sa) {
      admin.initializeApp({
        credential: admin.credential.cert(sa),
        projectId: sa.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
      });
    }
  }

  const db = admin.firestore();
  const collections = [];

  console.log('Prüfe Firestore-Collections …\n');

  for (const name of collections) {
    const snap = await db.collection(name).limit(1).get();
    const status = snap.empty ? '✓ leer / nicht vorhanden' : '⚠ enthält noch Dokumente';
    console.log(`  ${name}: ${status}`);
  }

  console.log('\nFertig.');
}

main().catch((err) => {
  console.error('Fehler:', err.message);
  process.exit(1);
});
