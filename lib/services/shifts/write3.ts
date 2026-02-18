import { getDb } from '@/lib/firebase';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { createAppError, ErrorCode, ErrorUtils } from '@/lib/errors';
import { logger } from '@/lib/logging';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { Shift } from './types';
import { COLLECTION_NAME } from './types';

const serviceErrorHandler = ErrorUtils.createServiceHandler('shiftService');

export async function createWithCapacity(data: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string }): Promise<string> {
  try {
    let companyId = (data as Partial<Shift> & { companyId?: string }).companyId;
    if (!companyId && data.facilityId) {
      const facilityDoc = await getDoc(doc(getDb(), 'facilities', data.facilityId));
      if (facilityDoc.exists()) companyId = facilityDoc.data().companyId;
    }
    if (!companyId) companyId = await getCompanyIdFromAuth() || undefined;
    if (!companyId) {
      throw createAppError(new Error('No companyId found for shift'), ErrorCode.VALIDATION_REQUIRED_FIELD, { component: 'shiftService', action: 'createWithCapacity' });
    }
    const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), {
      ...data,
      companyId,
      capacity: data.capacity || 1,
      assignedCount: 0,
      timezone: data.timezone || 'Europe/Berlin',
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    const appError = serviceErrorHandler.handleFirebaseError(error, { action: 'createWithCapacity' });
    logger.error('Failed to create shift with capacity', appError, { shiftData: data });
    throw appError;
  }
}

export async function updateCapacity(shiftId: string, newCapacity: number): Promise<void> {
  try {
    if (newCapacity < 1) {
      throw createAppError(new Error('Capacity must be at least 1'), ErrorCode.VALIDATION_OUT_OF_RANGE, { component: 'shiftService', action: 'updateCapacity', shiftId });
    }
    const shiftRef = doc(getDb(), COLLECTION_NAME, shiftId);
    const shiftDoc = await getDoc(shiftRef);
    if (!shiftDoc.exists()) {
      throw createAppError(new Error('Shift not found'), ErrorCode.FIREBASE_NOT_FOUND, { component: 'shiftService', action: 'updateCapacity', shiftId });
    }
    const currentAssignedCount = (shiftDoc.data() as { assignedCount?: number }).assignedCount || 0;
    if (newCapacity < currentAssignedCount) {
      throw createAppError(new Error('New capacity cannot be less than current assigned count'), ErrorCode.VALIDATION_OUT_OF_RANGE, { component: 'shiftService', action: 'updateCapacity', shiftId });
    }
    await updateDoc(shiftRef, {
      capacity: newCapacity,
      status: currentAssignedCount >= newCapacity ? 'filled' : 'open',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    const appError = serviceErrorHandler.handleFirebaseError(error, { action: 'updateCapacity', shiftId });
    logger.error('Failed to update capacity', appError, { shiftId, newCapacity });
    throw appError;
  }
}

export async function updateShiftStatus(shiftId: string, newStatus: Shift['status'], reason?: string): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION_NAME, shiftId), {
    status: newStatus,
    updatedAt: serverTimestamp(),
    ...(reason && { statusChangeReason: reason }),
  });
}

export async function bulkUpdateStatus(shiftIds: string[], newStatus: Shift['status'], reason?: string): Promise<void> {
  for (const id of shiftIds) {
    await updateDoc(doc(getDb(), COLLECTION_NAME, id), {
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...(reason && { statusChangeReason: reason }),
    });
  }
}
