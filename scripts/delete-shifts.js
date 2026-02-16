const admin = require('firebase-admin');

async function main() {
  // Initialisiere Firebase Admin mit Application Default Credentials
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Fehler bei der Initialisierung:', error.message);
    console.log('\nBitte stelle sicher, dass du mit Firebase CLI eingeloggt bist:');
    console.log('  firebase login');
    console.log('\nOder setze GOOGLE_APPLICATION_CREDENTIALS:');
    console.log('  export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json');
    process.exit(1);
  }

  const db = admin.firestore();
  
  console.log('⚠️  WARNUNG: Diese Aktion löscht ALLE Schichten aus der Datenbank!');
  console.log('Lade alle Schichten...\n');
  
  const snapshot = await db.collection('shifts').get();

  if (snapshot.empty) {
    console.log('Keine Schichten gefunden.');
    return;
  }

  console.log(`Gefunden: ${snapshot.size} Schichten`);
  console.log('Lösche alle Schichten...\n');

  const batchSize = 500; // Firestore Batch-Limit
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    const slice = docs.slice(i, i + batchSize);

    slice.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Batch ${Math.floor(i / batchSize) + 1} gelöscht (${slice.length} Dokumente).`);
  }

  console.log(`\n✅ Erfolg! ${snapshot.size} Schichten wurden gelöscht.`);
}

main().catch((error) => {
  console.error('❌ Fehler beim Löschen der Schichten:', error.message);
  process.exit(1);
});
