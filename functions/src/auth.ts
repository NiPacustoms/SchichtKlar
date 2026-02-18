import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const auth = getAuth();
const db = getFirestore();

export const setUserRole = onCall(async request => {
  // Check if requester is admin
  if (!request.auth || request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can set user roles.');
  }

  const { uid, role } = request.data;

  if (!uid || !['admin', 'nurse'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Invalid UID or role provided.');
  }

  try {
    // Set custom claim
    await auth.setCustomUserClaims(uid, { role });

    // Update user document
    await db.collection('users').doc(uid).update({ role });

    // Audit Log
    await db.collection('auditLogs').add({
      type: 'ROLE_UPDATE',
      targetUserId: uid,
      newRole: role,
      performedBy: request.auth.uid,
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

  const { uid } = request.data;
  const targetUid = uid || request.auth.uid;

  try {
    const user = await auth.getUser(targetUid);
    return { role: user.customClaims?.role || 'nurse' };
  } catch (error) {
    logger.error('Error getting role:', error);
    throw new HttpsError('internal', 'Failed to get role.');
  }
});

export const getUsersWithRoles = onCall(async request => {
  if (!request.auth || request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Insufficient permissions.');
  }

  try {
    const usersSnapshot = await db.collection('users').get();
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
