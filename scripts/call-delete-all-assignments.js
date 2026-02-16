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
  
  console.log('⚠️  WARNUNG: Diese Aktion löscht ALLE Assignments aus der Datenbank!');
  console.log('Lösche alle Assignments...\n');

  try {
    let totalDeleted = 0;
    let hasMore = true;

    // Loop für mehr als 500 Dokumente (Firestore Batch-Limit)
    while (hasMore) {
      const snapshot = await db.collection('assignments').limit(500).get();

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        totalDeleted++;
      });

      await batch.commit();
      console.log(`Batch gelöscht: ${snapshot.size} Assignments (Gesamt: ${totalDeleted})`);

      // Wenn weniger als 500 Dokumente, sind wir fertig
      if (snapshot.size < 500) {
        hasMore = false;
      }
    }

    console.log(`\n✅ Erfolg! ${totalDeleted} Assignments wurden gelöscht.`);
  } catch (error) {
    console.error('❌ Fehler beim Löschen:', error.message);
    process.exit(1);
  }
}

main();

