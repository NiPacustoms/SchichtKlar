import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Callable Function: Gibt ein Einmal-Export-Token (TTL ~5 Minuten) für Admins aus.
 */
export const requestExportToken = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  // Admin-Prüfung via Custom Claim oder users-Collection
  const role = (context.auth.token as { role?: string }).role;
  let isPrivileged = role === 'admin';
  if (!isPrivileged) {
    // Fallback: Prüfe users-Collection
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const r = userDoc.exists ? userDoc.get('role') : undefined;
    isPrivileged = r === 'admin';
  }
  if (!isPrivileged) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  // Rate Limiting: max 5 Token pro Minute und User
  const oneMinuteAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 1000));
  const recentSnap = await db
    .collection('exportTokens')
    .where('userId', '==', context.auth.uid)
    .where('createdAt', '>', oneMinuteAgo)
    .get();
  if (recentSnap.size >= 5) {
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
  }

  // Token erzeugen
  const token = admin.firestore.FieldValue.serverTimestamp().toString() + '-' + Math.random().toString(36).slice(2);
  const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000));

  await db.collection('exportTokens').add({
    userId: context.auth.uid,
    token,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
    used: false,
    ipAddress: (context as unknown as { rawRequest?: { ip?: string } }).rawRequest?.ip,
    userAgent: (context as unknown as { rawRequest?: { headers?: Record<string,string> } }).rawRequest?.headers?.['user-agent'],
  });

  return { token, expiresAt: expiresAt.toDate().toISOString() };
});


