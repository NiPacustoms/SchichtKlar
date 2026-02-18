import { getDb } from '@/lib/firebase';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { createAppError, ErrorCode, ErrorUtils } from '@/lib/errors';
import { logger } from '@/lib/logging';
import { writeAuditLog } from '@/lib/services/auditLogService';
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { Shift } from './types';
import { COLLECTION_NAME } from './types';

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
