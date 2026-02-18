import { getDb } from '@/lib/firebase';
import { facilityService } from '../facilities';
import { getDoc, getDocs, doc, collection, query, where } from 'firebase/firestore';
import { COLLECTION_NAME } from './types';
import { checkTimeOverlap, timeToMs, safeToDate, safeDateToISOString } from './helpers';

type AssignmentDoc = {
  id: string;
  userId: string;
  shiftId: string;
  status: string;
  assignedAt?: { toDate: () => Date };
};

export async function getConflicts(dateFrom: Date, dateTo: Date): Promise<unknown[]> {
  const q = query(
    collection(getDb(), 'assignments'),
    where('assignedAt', '>=', dateFrom),
    where('assignedAt', '<=', dateTo),
    where('status', 'in', ['assigned', 'accepted'])
  );
  const assignmentsSnapshot = await getDocs(q);
  const assignments = assignmentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AssignmentDoc[];
  const userAssignments = assignments.reduce((acc, a) => {
    if (!acc[a.userId]) acc[a.userId] = [];
    acc[a.userId].push(a);
    return acc;
  }, {} as Record<string, AssignmentDoc[]>);
  const conflicts: unknown[] = [];
  for (const [userId, list] of Object.entries(userAssignments)) {
    if (list.length < 2) continue;
    const shiftPromises = list.map(async (assignment) => {
      const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, assignment.shiftId));
      if (!shiftDoc.exists()) return null;
      const d = shiftDoc.data() as Record<string, unknown>;
      return {
        assignment,
        shift: {
          id: shiftDoc.id,
          facilityId: d.facilityId as string | undefined,
          stationId: d.stationId as string | undefined,
          date: d.date,
          startTime: String(d.startTime ?? ''),
          endTime: String(d.endTime ?? ''),
        },
      };
    });
    const shiftData = (await Promise.all(shiftPromises)).filter(Boolean) as Array<{
      assignment: AssignmentDoc;
      shift: { id: string; facilityId?: string; stationId?: string; date?: unknown; startTime: string; endTime: string };
    }>;
    for (let i = 0; i < shiftData.length; i++) {
      for (let j = i + 1; j < shiftData.length; j++) {
        const s1 = shiftData[i].shift;
        const s2 = shiftData[j].shift;
        const o1 = { startTime: s1.startTime, endTime: s1.endTime, date: safeDateToISOString(s1.date) };
        const o2 = { startTime: s2.startTime, endTime: s2.endTime, date: safeDateToISOString(s2.date) };
        if (!checkTimeOverlap(o1, o2)) continue;
        let facilityName = 'Unbekannte Einrichtung';
        let stationName = 'Unbekannte Station';
        if (s1.facilityId) {
          const facility = await facilityService.getById(s1.facilityId);
          if (facility) {
            facilityName = facility.name;
            if (s1.stationId && facility.stations) {
              const station = facility.stations.find(st => st.id === s1.stationId);
              stationName = station?.name || s1.stationId || 'Unbekannte Station';
            }
          }
        }
        conflicts.push({
          userId,
          assignmentId1: shiftData[i].assignment.id,
          assignmentId2: shiftData[j].assignment.id,
          shiftId1: s1.id,
          shiftId2: s2.id,
          conflictStart: new Date(Math.max(safeToDate(s1.date).getTime() + timeToMs(s1.startTime), safeToDate(s2.date).getTime() + timeToMs(s2.startTime))),
          conflictEnd: new Date(Math.min(safeToDate(s1.date).getTime() + timeToMs(s1.endTime), safeToDate(s2.date).getTime() + timeToMs(s2.endTime))),
          facilityName,
          stationName,
        });
      }
    }
  }
  return conflicts;
}

export async function detectConflictForUser(userId: string, shiftId: string): Promise<boolean> {
  const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, shiftId));
  if (!shiftDoc.exists()) return false;
  const newShiftData = shiftDoc.data() as Record<string, unknown>;
  const newShift = { startTime: newShiftData.startTime as string, endTime: newShiftData.endTime as string, date: newShiftData.date };
  const userAssignmentsQuery = query(
    collection(getDb(), 'assignments'),
    where('userId', '==', userId),
    where('status', 'in', ['assigned', 'accepted'])
  );
  const userAssignmentsSnapshot = await getDocs(userAssignmentsQuery);
  for (const assignmentDoc of userAssignmentsSnapshot.docs) {
    const assignment = assignmentDoc.data() as { shiftId: string };
    const existingShiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, assignment.shiftId));
    if (!existingShiftDoc.exists()) continue;
    const existingShiftData = existingShiftDoc.data() as Record<string, unknown>;
    const existingShift = { startTime: existingShiftData.startTime as string, endTime: existingShiftData.endTime as string, date: existingShiftData.date };
    const newForOverlap = { startTime: newShift.startTime, endTime: newShift.endTime, date: safeDateToISOString(newShift.date) };
    const existingForOverlap = { startTime: existingShift.startTime, endTime: existingShift.endTime, date: safeDateToISOString(existingShift.date) };
    if (checkTimeOverlap(newForOverlap, existingForOverlap)) return true;
  }
  return false;
}
