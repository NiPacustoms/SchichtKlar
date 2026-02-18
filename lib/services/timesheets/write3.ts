import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { FirestoreTimesheetData } from './types';
import { COLLECTION_NAME } from './types';

export async function approveWithFacilitySignature(params: {
  timesheetId: string;
  signatureUrl: string;
  signerUserId?: string;
  status?: 'performed' | 'aborted' | 'no-show';
  signerName?: string;
}): Promise<void> {
  const { timesheetId, signatureUrl, signerUserId, status, signerName } = params;
  const timesheetRef = doc(getDb(), COLLECTION_NAME, timesheetId);
  const currentDoc = await getDoc(timesheetRef);
  if (!currentDoc.exists()) throw new Error('Timesheet not found');
  const currentData = currentDoc.data() as FirestoreTimesheetData;
  if (currentData.status === 'approved') throw new Error('Timesheet already approved');
  await updateDoc(timesheetRef, {
    facilitySignatureUrl: signatureUrl,
    facilitySignedAt: new Date(),
    facilitySignedBy: signerUserId || null,
    ...(status ? { facilityConfirmationStatus: status } : {}),
    ...(signerName ? { facilitySignerName: signerName } : {}),
    status: 'approved',
    updatedAt: new Date(),
  });
}

export async function reject(id: string, rejectionReason: string): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION_NAME, id), {
    status: 'rejected',
    rejectionReason,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTimesheet(id: string): Promise<void> {
  const timesheetRef = doc(getDb(), COLLECTION_NAME, id);
  const currentDoc = await getDoc(timesheetRef);
  if (!currentDoc.exists()) throw new Error('Timesheet not found');
  const currentData = currentDoc.data() as FirestoreTimesheetData;
  if (currentData.status === 'approved' || currentData.status === 'submitted') {
    throw new Error('Cannot delete approved or submitted timesheet. GoBD-Konformität: Belege müssen 10 Jahre aufbewahrt werden.');
  }
  await deleteDoc(timesheetRef);
}
