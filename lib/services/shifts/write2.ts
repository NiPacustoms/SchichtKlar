import { getDb } from '@/lib/firebase';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { createAppError, ErrorCode, ErrorUtils } from '@/lib/errors';
import { logger } from '@/lib/logging';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import type { Shift } from './types';
import { COLLECTION_NAME } from './types';

const serviceErrorHandler = ErrorUtils.createServiceHandler('shiftService');

export async function assignUser(shiftId: string, userId: string): Promise<string> {
  try {
    const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, shiftId));
    if (!shiftDoc.exists()) {
      throw createAppError(new Error('Shift not found'), ErrorCode.FIREBASE_NOT_FOUND, { component: 'shiftService', action: 'assignUser', route: 'shifts' });
    }
    const shiftData = shiftDoc.data() as { assignedCount?: number; capacity?: number; companyId?: string };
    const currentAssigned = shiftData.assignedCount || 0;
    const capacity = shiftData.capacity || 1;
    if (currentAssigned >= capacity) {
      throw createAppError(new Error('Shift is already at full capacity'), ErrorCode.SHIFT_FULL, { component: 'shiftService', action: 'assignUser' });
    }
    let resolvedCompanyId: string | undefined = shiftData.companyId;
    if (!resolvedCompanyId) resolvedCompanyId = await getCompanyIdFromAuth() || undefined;
    if (!resolvedCompanyId) {
      throw createAppError(new Error('No companyId found for assignment'), ErrorCode.VALIDATION_REQUIRED_FIELD, { component: 'shiftService', action: 'assignUser' });
    }
    const assignmentRef = await addDoc(collection(getDb(), 'assignments'), {
      shiftId,
      userId,
      companyId: resolvedCompanyId,
      status: 'assigned',
      assignedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(getDb(), COLLECTION_NAME, shiftId), {
      assignedCount: currentAssigned + 1,
      status: currentAssigned + 1 >= capacity ? 'filled' : 'open',
      updatedAt: serverTimestamp(),
    });
    return assignmentRef.id;
  } catch (error) {
    const appError = serviceErrorHandler.handleFirebaseError(error, { action: 'assignUser', shiftId, userId });
    logger.error('Failed to assign user to shift', appError, { shiftId, userId });
    throw appError;
  }
}

export async function unassignUser(shiftId: string, userId: string): Promise<void> {
  const assignmentsQuery = query(
    collection(getDb(), 'assignments'),
    where('shiftId', '==', shiftId),
    where('userId', '==', userId)
  );
  const assignmentsSnapshot = await getDocs(assignmentsQuery);
  const deleteCount = assignmentsSnapshot.docs.length;
  for (const assignmentDoc of assignmentsSnapshot.docs) {
    await deleteDoc(assignmentDoc.ref);
  }
  if (deleteCount === 0) return;
  const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, shiftId));
  if (shiftDoc.exists()) {
    const shiftData = shiftDoc.data();
    const currentAssigned = Math.max(0, (shiftData.assignedCount || 0) - deleteCount);
    await updateDoc(doc(getDb(), COLLECTION_NAME, shiftId), {
      assignedCount: currentAssigned,
      status: currentAssigned === 0 ? 'open' : 'filled',
      updatedAt: serverTimestamp(),
    });
  }
}
