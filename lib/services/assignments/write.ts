import { getDb } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import type { Assignment } from './types';
import { COLLECTION_NAME } from './types';

export async function create(userId: string, shiftId: string, notes?: string): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  const shiftDoc = await getDoc(doc(db, 'shifts', shiftId));
  if (!shiftDoc.exists()) throw new Error('Shift not found');
  const shiftData = shiftDoc.data();
  const companyId = shiftData.companyId || await getCompanyIdFromAuth();
  if (!companyId) throw new Error('No companyId found for assignment');
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    userId,
    shiftId,
    companyId,
    status: 'pending',
    assignedAt: serverTimestamp(),
    notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function accept(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function decline(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    status: 'declined',
    declinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function complete(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    status: 'completed',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function update(id: string, data: Partial<Assignment>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  await updateDoc(doc(db, COLLECTION_NAME, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAssignment(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}

export async function notifyAdminsAboutFormStatus(_assignmentId: string, _reason: string): Promise<void> {
  // Stub: Backend/Cloud Function kann später angebunden werden.
}

export async function bulkUpdate(ids: string[], updates: Partial<Assignment>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  await Promise.all(
    ids.map(id => updateDoc(doc(db, COLLECTION_NAME, id), { ...updates, updatedAt: serverTimestamp() }))
  );
}

export async function createRequest(userId: string, shiftId: string, notes?: string): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  const shiftDoc = await getDoc(doc(db, 'shifts', shiftId));
  if (!shiftDoc.exists()) throw new Error('Shift not found');
  const companyId = shiftDoc.data().companyId || await getCompanyIdFromAuth();
  if (!companyId) throw new Error('No companyId found for assignment');
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    userId,
    shiftId,
    companyId,
    status: 'requested',
    assignedAt: serverTimestamp(),
    notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function bulkAssign(shiftId: string, userIds: string[]): Promise<string[]> {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  const shiftDoc = await getDoc(doc(db, 'shifts', shiftId));
  if (!shiftDoc.exists()) throw new Error('Shift not found');
  const companyId = shiftDoc.data().companyId || await getCompanyIdFromAuth();
  if (!companyId) throw new Error('No companyId found for assignment');
  const ids: string[] = [];
  for (const userId of userIds) {
    const ref = await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      shiftId,
      companyId,
      status: 'assigned',
      assignedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    ids.push(ref.id);
  }
  return ids;
}
