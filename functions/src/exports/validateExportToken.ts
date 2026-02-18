import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Callable Function: Validiert ein Einmal-Export-Token und markiert es als verwendet.
 */
export const validateExportToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { token } = data || {};
  if (!token || typeof token !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing token');
  }

  // Admin-Prüfung
  const role = (context.auth.token as { role?: string }).role;
  let isPrivileged = role === 'admin';
  if (!isPrivileged) {
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const r = userDoc.exists ? userDoc.get('role') : undefined;
    isPrivileged = r === 'admin';
  }
  if (!isPrivileged) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  // Token suchen
  const snap = await db
    .collection('exportTokens')
    .where('userId', '==', context.auth.uid)
    .where('token', '==', token)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new functions.https.HttpsError('not-found', 'Token not found');
  }

  const docRef = snap.docs[0].ref;
  const tokenData = snap.docs[0].data() as { used?: boolean; expiresAt?: admin.firestore.Timestamp };
  if (tokenData.used) {
    throw new functions.https.HttpsError('failed-precondition', 'Token already used');
  }
  if (tokenData.expiresAt && tokenData.expiresAt.toDate().getTime() < Date.now()) {
    throw new functions.https.HttpsError('deadline-exceeded', 'Token expired');
  }

  await docRef.update({ used: true, usedAt: admin.firestore.FieldValue.serverTimestamp() });

  return { ok: true };
});


