const admin = require('firebase-admin');

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Bitte zuerst GOOGLE_APPLICATION_CREDENTIALS auf deine Service-Account-JSON setzen.');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });

  const db = admin.firestore();
  
  console.log('Lade alle Assignments...');
  const snapshot = await db.collection('assignments').get();

  if (snapshot.empty) {
    console.log('Keine Assignments gefunden.');
    return;
  }

  console.log(`Gefunden: ${snapshot.size} Assignments`);
  console.log('Lösche alle Assignments...');

  const batchSize = 500; // Firestore Batch-Limit
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    const slice = docs.slice(i, i + batchSize);

    slice.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Batch ${Math.floor(i / batchSize) + 1} gelöscht (${slice.length} Dokumente).`);
  }

  console.log(`✅ Alle ${snapshot.size} Assignments erfolgreich gelöscht.`);
}

main().catch((error) => {
  console.error('Fehler beim Löschen der Assignments:', error);
  process.exit(1);
});

