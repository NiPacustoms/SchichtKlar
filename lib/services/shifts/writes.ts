/**
 * Consolidated shift write operations.
 * Merged from write.ts, write2.ts, write3.ts
 */
import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import { createAppError, ErrorCode, ErrorUtils } from '@/lib/errors';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { writeAuditLog } from '@/lib/services/auditLogService';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Shift } from './types';
import { COLLECTION_NAME } from './types';



// --- Merged from write.ts ---
const serviceErrorHandler = ErrorUtils.createServiceHandler('shiftService');
export async function create(data: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    let companyId: string | undefined = (data as Partial<Shift> & { companyId?: string }).companyId;
    if (!companyId && data.facilityId) {
      const facilityDoc = await getDoc(doc(getDb(), 'facilities', data.facilityId));
      if (facilityDoc.exists()) companyId = facilityDoc.data().companyId;
    }
    if (!companyId) companyId = await getCompanyIdFromAuth() || undefined;
    if (!companyId) {
      throw createAppError(new Error('No companyId found for shift'), ErrorCode.VALIDATION_REQUIRED_FIELD, { component: 'shiftService', action: 'create' });
    }
    const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), {
      ...data,
      companyId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    try {
      const auth = await import('firebase/auth');
      await writeAuditLog({
        actorUid: auth.getAuth().currentUser?.uid || 'unknown',
        companyId: companyId || 'unknown',
        action: 'shift.create',
        target: { collection: COLLECTION_NAME, id: docRef.id },
        after: { ...data },
      } as Parameters<typeof writeAuditLog>[0]);
    } catch (_err) { void 0; }
    return docRef.id;
  } catch (error) {
    const appError = serviceErrorHandler.handleFirebaseError(error, { action: 'create' });
    logger.error('Failed to create shift', appError, { shiftData: data });
    throw appError;
  }
}
export async function update(id: string, data: Partial<Shift>): Promise<void> {
  const shiftRef = doc(getDb(), COLLECTION_NAME, id);
  await updateDoc(shiftRef, { ...data, updatedAt: serverTimestamp() });
  try {
    const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, id));
    const shiftCompanyId = shiftDoc.exists() ? (shiftDoc.data() as Partial<Shift> & { companyId?: string }).companyId ?? null : null;
    const auth = await import('firebase/auth');
    await writeAuditLog({
      actorUid: auth.getAuth().currentUser?.uid || 'unknown',
      companyId: shiftCompanyId || await getCompanyIdFromAuth() || 'unknown',
      action: 'shift.update',
      target: { collection: COLLECTION_NAME, id },
      after: { ...data },
    } as Parameters<typeof writeAuditLog>[0]);
  } catch (_err) { void 0; }
}
export async function updateStatus(id: string, status: Shift['status']): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION_NAME, id), { status, updatedAt: serverTimestamp() });
}
export async function deleteShift(id: string): Promise<void> {
  const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, id));
  const shiftCompanyId = shiftDoc.exists() ? (shiftDoc.data() as Partial<Shift> & { companyId?: string }).companyId ?? null : null;
  await deleteDoc(doc(getDb(), COLLECTION_NAME, id));
  try {
    const auth = await import('firebase/auth');
    await writeAuditLog({
      actorUid: auth.getAuth().currentUser?.uid || 'unknown',
      companyId: shiftCompanyId || await getCompanyIdFromAuth() || 'unknown',
      action: 'shift.delete',
      target: { collection: COLLECTION_NAME, id },
    } as Parameters<typeof writeAuditLog>[0]);
  } catch (_err) { void 0; }
}


// --- Merged from write2.ts ---
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


// --- Merged from write3.ts ---
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

