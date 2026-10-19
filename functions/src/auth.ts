import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { assertSameCompany, getCaller, requireAdmin } from './utils/tenant';

const auth = getAuth();
const db = getFirestore();

export const setUserRole = onCall(async request => {
  const caller = await requireAdmin(request.auth);

  const { uid, role } = request.data || {};

  if (!uid || !['admin', 'nurse'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Invalid UID or role provided.');
  }

  // Mandantenisolation: nur Nutzer der eigenen Firma
  const targetSnap = await db.collection('users').doc(uid).get();
  if (!targetSnap.exists) {
    throw new HttpsError('not-found', 'User not found.');
  }
  assertSameCompany(caller, targetSnap.get('companyId'));

  // Sich selbst die Admin-Rolle zu entziehen, sperrt die Firma ggf. aus
  if (uid === caller.uid && role !== 'admin') {
    throw new HttpsError('failed-precondition', 'Eigene Admin-Rolle kann nicht entzogen werden.');
  }

  try {
    // Bestehende Claims erhalten (insb. companyId) – nur die Rolle ändern
    const existing = (await auth.getUser(uid)).customClaims || {};
    await auth.setCustomUserClaims(uid, { ...existing, role, companyId: caller.companyId });

    // Update user document
    await db.collection('users').doc(uid).update({ role });

    // Audit Log
    await db.collection('auditLogs').add({
      type: 'ROLE_UPDATE',
      targetUserId: uid,
      newRole: role,
      performedBy: caller.uid,
      companyId: caller.companyId,
      performedAt: new Date(),
      context: 'setUserRole',
    });

    logger.info(`Role updated: ${uid} -> ${role}`);

    return { success: true, message: `Role updated to ${role}` };
  } catch (error) {
    logger.error('Error setting role:', error);
    throw new HttpsError('internal', 'Failed to set role.');
  }
});

export const getUserRole = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { uid } = request.data || {};
  const targetUid = uid || request.auth.uid;

  // Fremde Rollen nur für Admins der gleichen Firma (eigene Rolle immer abfragbar)
  if (targetUid !== request.auth.uid) {
    const caller = await getCaller(request.auth);
    if (!caller.isAdmin) {
      throw new HttpsError('permission-denied', 'Insufficient permissions.');
    }
    const targetSnap = await db.collection('users').doc(targetUid).get();
    assertSameCompany(caller, targetSnap.exists ? targetSnap.get('companyId') : undefined);
  }

  try {
    const user = await auth.getUser(targetUid);
    return { role: user.customClaims?.role || 'nurse' };
  } catch (error) {
    logger.error('Error getting role:', error);
    throw new HttpsError('internal', 'Failed to get role.');
  }
});

export const getUsersWithRoles = onCall(async request => {
  const caller = await requireAdmin(request.auth);

  try {
    const usersSnapshot = await db.collection('users').where('companyId', '==', caller.companyId).get();
    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));

    return { users };
  } catch (error) {
    logger.error('Error getting users:', error);
    throw new HttpsError('internal', 'Failed to get users.');
  }
});
