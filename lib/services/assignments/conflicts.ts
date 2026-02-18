import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/errors';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { getDoc, getDocs, doc, collection, query, where } from 'firebase/firestore';
import { COLLECTION_NAME } from './types';

export function timeToMs(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours * 60 + minutes) * 60 * 1000;
}

export function checkTimeOverlap(
  shift1: { date: string; startTime: string; endTime: string },
  shift2: { date: string; startTime: string; endTime: string }
): boolean {
  const start1 = new Date(shift1.date).getTime() + timeToMs(shift1.startTime);
  const end1 = new Date(shift1.date).getTime() + timeToMs(shift1.endTime);
  const start2 = new Date(shift2.date).getTime() + timeToMs(shift2.startTime);
  const end2 = new Date(shift2.date).getTime() + timeToMs(shift2.endTime);
  return start1 < end2 && start2 < end1;
}

export async function checkConflict(
  userId: string,
  shiftId: string
): Promise<{
  hasConflict: boolean;
  conflictShift?: Record<string, unknown>;
  conflictAssignment?: Record<string, unknown>;
  conflictDetails?: string;
} | null> {
  try {
    const db = getDb();
    if (!db) return null;
    const companyId = await getCompanyIdFromAuth();
    if (!companyId) return { hasConflict: false };
    const userAssignmentsQuery = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      where('userId', '==', userId),
      where('status', 'in', ['assigned', 'accepted'])
    );
    const userAssignmentsSnapshot = await getDocs(userAssignmentsQuery);
    const shiftDoc = await getDoc(doc(db, 'shifts', shiftId));
    if (!shiftDoc.exists()) return null;
    const newShift = { id: shiftDoc.id, ...shiftDoc.data() } as Record<string, unknown>;
    const newShiftForCheck = {
      date: (newShift.date as { toDate?: () => Date })?.toDate?.()?.toISOString().split('T')[0] || String(newShift.date ?? ''),
      startTime: String(newShift.startTime ?? ''),
      endTime: String(newShift.endTime ?? ''),
    };
    for (const assignmentDoc of userAssignmentsSnapshot.docs) {
      const assignment = assignmentDoc.data();
      const existingShiftDoc = await getDoc(doc(db, 'shifts', assignment.shiftId));
      if (!existingShiftDoc.exists()) continue;
      const existingShiftData = existingShiftDoc.data() as Record<string, unknown>;
      const existingShiftForCheck = {
        date: (existingShiftData.date as { toDate?: () => Date })?.toDate?.()?.toISOString().split('T')[0] || String(existingShiftData.date ?? ''),
        startTime: String(existingShiftData.startTime ?? ''),
        endTime: String(existingShiftData.endTime ?? ''),
      };
      if (checkTimeOverlap(newShiftForCheck, existingShiftForCheck)) {
        return {
          hasConflict: true,
          conflictShift: { id: existingShiftDoc.id, ...existingShiftData },
          conflictAssignment: { id: assignmentDoc.id, ...assignment },
          conflictDetails: 'Zeitkonflikt mit bestehender Schicht',
        };
      }
    }
    return { hasConflict: false };
  } catch (error) {
    throw error;
  }
}

export async function checkConflictsForShift(
  shiftId: string,
  userIds: string[]
): Promise<Record<string, { hasConflict: boolean; conflictDetails?: string }>> {
  const result: Record<string, { hasConflict: boolean; conflictDetails?: string }> = {};
  if (userIds.length === 0) return result;
  try {
    const db = getDb();
    if (!db) {
      userIds.forEach(uid => (result[uid] = { hasConflict: false }));
      return result;
    }
    const companyId = await getCompanyIdFromAuth();
    if (!companyId) {
      userIds.forEach(uid => (result[uid] = { hasConflict: false }));
      return result;
    }
    const shiftDoc = await getDoc(doc(db, 'shifts', shiftId));
    if (!shiftDoc.exists()) {
      userIds.forEach(uid => (result[uid] = { hasConflict: false }));
      return result;
    }
    const newShiftData = shiftDoc.data() as Record<string, unknown>;
    const newShiftForCheck = {
      date: (newShiftData.date as { toDate?: () => Date })?.toDate?.()?.toISOString().split('T')[0] ?? String(newShiftData.date ?? ''),
      startTime: String(newShiftData.startTime ?? ''),
      endTime: String(newShiftData.endTime ?? ''),
    };
    const CHUNK = 10;
    const assignmentDocs: { userId: string; shiftId: string }[] = [];
    for (let i = 0; i < userIds.length; i += CHUNK) {
      const chunk = userIds.slice(i, i + CHUNK);
      const q = query(
        collection(db, COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', 'in', chunk),
        where('status', 'in', ['assigned', 'accepted'])
      );
      const snap = await getDocs(q);
      snap.docs.forEach(d => {
        const a = d.data();
        if (a.shiftId !== shiftId) assignmentDocs.push({ userId: a.userId as string, shiftId: a.shiftId as string });
      });
    }
    const uniqueShiftIds = [...new Set(assignmentDocs.map(a => a.shiftId))];
    const shiftDataById: Record<string, { date: string; startTime: string; endTime: string }> = {};
    for (const sid of uniqueShiftIds) {
      const d = await getDoc(doc(db, 'shifts', sid));
      if (d.exists()) {
        const data = d.data() as Record<string, unknown>;
        shiftDataById[sid] = {
          date: (data.date as { toDate?: () => Date })?.toDate?.()?.toISOString().split('T')[0] ?? String(data.date ?? ''),
          startTime: String(data.startTime ?? ''),
          endTime: String(data.endTime ?? ''),
        };
      }
    }
    userIds.forEach(uid => (result[uid] = { hasConflict: false }));
    for (const { userId, shiftId: existingShiftId } of assignmentDocs) {
      const existing = shiftDataById[existingShiftId];
      if (!existing) continue;
      if (checkTimeOverlap(newShiftForCheck, existing)) {
        result[userId] = { hasConflict: true, conflictDetails: 'Zeitkonflikt mit bestehender Schicht' };
      }
    }
    return result;
  } catch (error) {
    logger.error('checkConflictsForShift failed', error as Error);
    userIds.forEach(uid => (result[uid] = { hasConflict: false }));
    return result;
  }
}
