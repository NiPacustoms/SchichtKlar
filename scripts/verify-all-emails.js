#!/usr/bin/env node

/**
 * Setzt emailVerified = true nur für Benutzer, deren E-Mail in der Whitelist steht.
 * Alle anderen (und alle zukünftigen neuen Nutzer) bleiben unverifiziert und müssen
 * den Bestätigungs-Link in der E-Mail nutzen.
 *
 * Whitelist: scripts/verified-emails-whitelist.txt (eine E-Mail pro Zeile)
 * Optional: FIREBASE_SERVICE_ACCOUNT_PATH=/pfad/zu/serviceAccount.json
 *
 * Aufruf: node scripts/verify-all-emails.js
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const DEFAULT_SERVICE_ACCOUNT = path.resolve(
  process.env.HOME || process.cwd(),
  '.keys',
  'jobflow25-admin.json'
);

const WHITELIST_PATH = path.resolve(__dirname, 'verified-emails-whitelist.txt');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || DEFAULT_SERVICE_ACCOUNT;

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service-Account-Datei nicht gefunden.');
  console.error('   Erwartet unter:', serviceAccountPath);
  console.error('   Alternativ Umgebungsvariable FIREBASE_SERVICE_ACCOUNT_PATH setzen.');
  process.exit(1);
}

function loadWhitelist() {
  if (!fs.existsSync(WHITELIST_PATH)) {
    console.error('❌ Whitelist-Datei nicht gefunden:', WHITELIST_PATH);
    console.error('   Erstelle die Datei mit einer E-Mail-Adresse pro Zeile (z.B. admin@schichtklar.test).');
    process.exit(1);
  }
  const content = fs.readFileSync(WHITELIST_PATH, 'utf8');
  const emails = new Set(
    content
      .split('\n')
      .map((line) => line.replace(/#.*$/, '').trim().toLowerCase())
      .filter((e) => e.length > 0)
  );
  return emails;
}

const serviceAccount = require(serviceAccountPath);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const auth = admin.auth();

async function listAllUsers(pageToken) {
  const result = await auth.listUsers(1000, pageToken);
  return result;
}

(async () => {
  const whitelist = loadWhitelist();
  console.log('📋 Whitelist:', WHITELIST_PATH);
  console.log('   E-Mails:', [...whitelist].join(', '));
  console.log('\n🔍 Nur diese Konten werden als verifiziert gesetzt. Alle anderen bleiben unverifiziert.\n');

  let totalUpdated = 0;
  let totalSkippedNotInWhitelist = 0;
  let totalSkippedAlreadyVerified = 0;
  let totalErrors = 0;
  let pageToken;

  do {
    const listResult = await listAllUsers(pageToken);
    pageToken = listResult.pageToken;

    for (const userRecord of listResult.users) {
      const { uid, email, emailVerified } = userRecord;
      const display = email || uid;
      const emailLower = (email || '').toLowerCase();

      if (!whitelist.has(emailLower)) {
        totalSkippedNotInWhitelist += 1;
        console.log(`⏭️  ${display} – nicht in Whitelist, bleibt unverifiziert`);
        continue;
      }

      if (emailVerified) {
        totalSkippedAlreadyVerified += 1;
        console.log(`⏭️  ${display} – bereits verifiziert`);
        continue;
      }

      try {
        await auth.updateUser(uid, { emailVerified: true });
        totalUpdated += 1;
        console.log(`✔︎ ${display} – als verifiziert gesetzt`);
      } catch (err) {
        totalErrors += 1;
        console.error(`❌ ${display} – Fehler:`, err.message || err);
      }
    }
  } while (pageToken);

  console.log('\n✅ Fertig.');
  console.log(`   Als verifiziert gesetzt:     ${totalUpdated}`);
  console.log(`   Bereits verifiziert:         ${totalSkippedAlreadyVerified}`);
  console.log(`   Nicht in Whitelist (unverändert): ${totalSkippedNotInWhitelist}`);
  if (totalErrors > 0) {
    console.log(`   Fehler:                     ${totalErrors}`);
  }
  process.exit(totalErrors > 0 ? 1 : 0);
})().catch((error) => {
  console.error('❌ Skript fehlgeschlagen:', error);
  process.exit(1);
});
