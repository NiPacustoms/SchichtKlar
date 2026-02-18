import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/errors';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTION_NAME } from './types';
import { checkAndGeneratePDFIfComplete } from './pdf';

export async function addRelievingSignature(
  assignmentId: string,
  signatureData: {
    date: string;
    signerName: string;
    signerRole?: string;
    signatureUrl: string;
    signedAt: Date;
    timesheetId?: string;
    verifiedTimes?: { startTime: string; endTime: string; breakMinutes: number; totalHours: number };
  }
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');
  try {
    const assignmentRef = doc(db, COLLECTION_NAME, assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    if (!assignmentDoc.exists()) throw new Error('Assignment not found');
    const currentData = assignmentDoc.data();
    const existingSignatures = (currentData.relievingSignatures as Array<{
      date: string;
      signerName: string;
      signerRole?: string;
      signatureUrl: string;
      signedAt: Date | { toDate: () => Date };
      timesheetId?: string;
      verifiedTimes?: { startTime: string; endTime: string; breakMinutes: number; totalHours: number };
    }>) || [];
    const existingIndex = existingSignatures.findIndex(sig => sig.date === signatureData.date);
    const newSignature = {
      date: signatureData.date,
      signerName: signatureData.signerName,
      signerRole: signatureData.signerRole,
      signatureUrl: signatureData.signatureUrl,
      signedAt: signatureData.signedAt,
      timesheetId: signatureData.timesheetId,
      verifiedTimes: signatureData.verifiedTimes,
    };
    let updatedSignatures: typeof existingSignatures;
    if (existingIndex >= 0) {
      updatedSignatures = [...existingSignatures];
      updatedSignatures[existingIndex] = newSignature;
    } else {
      updatedSignatures = [...existingSignatures, newSignature];
    }
    const collectedDates = (currentData.signatureSchedule?.collectedDates as string[]) || [];
    if (!collectedDates.includes(signatureData.date)) collectedDates.push(signatureData.date);
    const updatedSchedule = { ...(currentData.signatureSchedule || {}), collectedDates };
    await updateDoc(assignmentRef, {
      relievingSignatures: updatedSignatures,
      signatureSchedule: updatedSchedule,
      updatedAt: serverTimestamp(),
    });
    await checkAndGeneratePDFIfComplete(assignmentId);
  } catch (error) {
    logger.error('Error adding relieving signature', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
