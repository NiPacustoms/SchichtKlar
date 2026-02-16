import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Geplanter Task: löscht abgelaufene oder benutzte Export-Tokens regelmäßig
export const cleanupExportTokens = functions.pubsub.schedule('every 6 hours').onRun(async () => {
  const now = admin.firestore.Timestamp.now();

  // Abgelaufene Tokens
  const expiredSnap = await db
    .collection('exportTokens')
    .where('expiresAt', '<', now)
    .limit(500)
    .get();

  const usedOldSnap = await db
    .collection('exportTokens')
    .where('used', '==', true)
    .where('expiresAt', '<', now)
    .limit(500)
    .get();

  const batch = db.batch();
  expiredSnap.docs.forEach(d => batch.delete(d.ref));
  usedOldSnap.docs.forEach(d => batch.delete(d.ref));

  if (!expiredSnap.empty || !usedOldSnap.empty) {
    await batch.commit();
  }

  return null;
});


