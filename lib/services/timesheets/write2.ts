import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Break, FirestoreTimesheetData } from './types';
import { COLLECTION_NAME } from './types';
import { getByUserAndDateRange } from './read';

export async function addBreak(timesheetId: string, breakData: { reason?: string; duration?: number }): Promise<void> {
  try {
    const timesheetRef = doc(getDb(), COLLECTION_NAME, timesheetId);
    const timesheetDoc = await getDoc(timesheetRef);
    if (!timesheetDoc.exists()) throw new Error('Timesheet not found');
    const currentData = timesheetDoc.data() as FirestoreTimesheetData;
    const currentBreaks = currentData.breaks || [];
    const newBreak: Break = {
      id: `break_${Date.now()}`,
      startTime: new Date().toTimeString().slice(0, 5),
      duration: breakData.duration || 0,
      reason: breakData.reason,
      createdAt: new Date(),
    };
    const updatedBreaks = [...currentBreaks, newBreak];
    const totalBreakMinutes = updatedBreaks.reduce((sum, b) => sum + (b.duration || 0), 0);
    await updateDoc(timesheetRef, {
      breaks: updatedBreaks,
      breakMinutes: totalBreakMinutes,
      updatedAt: new Date(),
    });
  } catch (error) {
    logger.error('Error adding break', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function endBreak(timesheetId: string, breakId: string): Promise<void> {
  try {
    const timesheetRef = doc(getDb(), COLLECTION_NAME, timesheetId);
    const timesheetDoc = await getDoc(timesheetRef);
    if (!timesheetDoc.exists()) throw new Error('Timesheet not found');
    const currentData = timesheetDoc.data() as FirestoreTimesheetData;
    const currentBreaks = currentData.breaks || [];
    const updatedBreaks = currentBreaks.map(breakItem => {
      if (breakItem.id === breakId && !breakItem.endTime) {
        return { ...breakItem, endTime: new Date().toTimeString().slice(0, 5) };
      }
      return breakItem;
    });
    await updateDoc(timesheetRef, { breaks: updatedBreaks, updatedAt: new Date() });
  } catch (error) {
    logger.error('Error ending break', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/** @deprecated Wochensignatur ist obsolet. Verwende stattdessen tägliche Signaturen über approveWithFacilitySignature. */
export async function approveRangeWithFacilitySignature(params: {
  userId: string;
  start: Date;
  end: Date;
  signatureUrl: string;
  signerUserId: string;
}): Promise<number> {
  const { userId, start, end, signatureUrl, signerUserId } = params;
  const list = await getByUserAndDateRange(userId, start, end);
  let updated = 0;
  for (const t of list) {
    await updateDoc(doc(getDb(), COLLECTION_NAME, t.id), {
      facilitySignatureUrl: signatureUrl,
      facilitySignedAt: new Date(),
      facilitySignedBy: signerUserId,
      status: t.status === 'submitted' ? 'approved' : t.status,
      updatedAt: new Date(),
    });
    updated++;
  }
  return updated;
}
