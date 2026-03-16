/**
 * Consolidated shift read operations.
 * Merged from read.ts, read2.ts, read3.ts, read4.ts, read5.ts, read6.ts, read7.ts
 */
import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { facilityService } from '../facilities';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryConstraint,
  where,
} from 'firebase/firestore';
import type { Shift, ShiftFilters } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToShift } from './mapDoc';
import { checkTimeOverlap, timeToMs, safeToDate, safeDateToISOString } from './helpers';


// --- Merged from read.ts ---
export async function getById(id: string): Promise<Shift | null> {
  const db = getDb();
  if (!db) {
    logger.warn('Firebase not initialized, returning null');
    return null;
  }
  try {
    const shiftDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!shiftDoc.exists()) return null;
    const data = shiftDoc.data() as Record<string, unknown>;
    return mapDocToShift(shiftDoc.id, data);
  } catch (error) {
    throw error;
  }
}


// --- Merged from read2.ts ---
export async function getByFacility(facilityId: string): Promise<Shift[]> {
  const db = getDb();
  if (!db) {
    logger.warn('Firebase not initialized, returning empty array');
    return [];
  }
  try {
    const companyId = await getCompanyIdFromAuth();
    if (!companyId) {
      logger.warn('No companyId found, returning empty array');
      return [];
    }
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      where('facilityId', '==', facilityId),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapDocToShift(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    throw error;
  }
}
export async function getOpenShifts(): Promise<Shift[]> {
  const db = getDb();
  if (!db) {
    logger.warn('Firebase not initialized, returning empty array');
    return [];
  }
  try {
    const companyId = await getCompanyIdFromAuth();
    if (!companyId) {
      logger.warn('No companyId found, returning empty array');
      return [];
    }
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      where('status', '==', 'open'),
      where('date', '>=', new Date()),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapDocToShift(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    throw error;
  }
}
export async function getByDateRange(startDate: Date, endDate: Date, companyId?: string): Promise<Shift[]> {
  try {
    let resolvedCompanyId: string | undefined = companyId;
    if (!resolvedCompanyId) {
      const authCompanyId = await getCompanyIdFromAuth();
      resolvedCompanyId = authCompanyId || undefined;
    }
    if (!resolvedCompanyId) {
      logger.warn('No companyId found in getByDateRange, returning empty array');
      return [];
    }
    const db = getDb();
    if (!db) return [];
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', resolvedCompanyId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapDocToShift(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    throw error;
  }
}


// --- Merged from read3.ts ---
export async function getAll(filters?: ShiftFilters): Promise<Shift[]> {
  const db = getDb();
  if (!db || typeof window === 'undefined') return [];
  try {
    let companyId = filters?.companyId;
    if (!companyId && typeof window !== 'undefined') companyId = await getCompanyIdFromAuth() || undefined;
    if (!companyId) {
      logger.debug('No companyId found in filters or auth. Cannot fetch shifts without companyId due to security rules.');
      return [];
    }
    let facilityIds: string[] | undefined;
    try {
      const facilities = await facilityService.getAll(companyId);
      facilityIds = facilities.map(f => f.id);
      if (facilityIds.length === 0) return [];
      if (filters?.facilityId && !facilityIds.includes(filters.facilityId)) return [];
    } catch (facilityError) {
      logger.error('Error fetching facilities for companyId filter', facilityError instanceof Error ? facilityError : new Error(String(facilityError)));
      return [];
    }
    if (!facilityIds || facilityIds.length === 0) {
      logger.warn('No facilities found for companyId. Cannot fetch shifts without facility filter.');
      return [];
    }
    const constraints: QueryConstraint[] = [];
    if (filters?.facilityId) {
      if (!facilityIds.includes(filters.facilityId)) return [];
      constraints.push(where('facilityId', '==', filters.facilityId));
    } else if (facilityIds.length <= 10) {
      constraints.push(where('facilityId', 'in', facilityIds));
    }
    if (filters?.status) constraints.push(where('status', '==', filters.status));
    if (filters?.type) constraints.push(where('type', '==', filters.type));
    if (filters?.dateFrom) constraints.push(where('date', '>=', filters.dateFrom));
    if (filters?.dateTo) constraints.push(where('date', '<=', filters.dateTo));
    let snapshot;
    try {
      snapshot = await getDocs(query(collection(db, COLLECTION_NAME), ...constraints, orderBy('date', 'desc')));
    } catch (orderByError: unknown) {
      const err = orderByError as { code?: string; message?: string };
      if (err?.code === 'failed-precondition' || (err?.message?.includes && err.message.includes('requires an index'))) {
        logger.warn('Firestore index missing for shifts query. Fetching without orderBy and sorting manually.');
        snapshot = await getDocs(query(collection(db, COLLECTION_NAME), ...constraints));
      } else {
        throw orderByError;
      }
    }
    const shifts = snapshot.docs
      .filter(d => !(facilityIds && facilityIds.length > 10) || facilityIds.includes(d.data().facilityId))
      .map(d => mapDocToShift(d.id, d.data() as Record<string, unknown>));
    shifts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return shifts;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err?.code === 'permission-denied' || err?.code === 'unauthenticated') return [];
    if (err?.code === 'failed-precondition' || err?.message?.includes?.('requires an index')) {
      logger.warn('Firestore index missing for shifts query. Create the index at: ' + (err?.message?.match(/https:\/\/[^\s]+/)?.[0] || 'Firebase Console'));
      return [];
    }
    logger.error('Error fetching shifts', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}


// --- Merged from read4.ts ---
export async function getWithFilters(filters: ShiftFilters): Promise<Shift[]> {
  try {
    const companyId = await getCompanyIdFromAuth();
    if (!companyId) {
      logger.warn('No companyId found, returning empty array');
      return [];
    }
    const db = getDb();
    if (!db) return [];
    let q = query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId));
    if (filters.facilityId) q = query(q, where('facilityId', '==', filters.facilityId));
    if (filters.stationId) q = query(q, where('stationId', '==', filters.stationId));
    if (filters.type) q = query(q, where('type', '==', filters.type));
    if (filters.status) q = query(q, where('status', '==', filters.status));
    if (filters.dateFrom) q = query(q, where('date', '>=', filters.dateFrom));
    if (filters.dateTo) q = query(q, where('date', '<=', filters.dateTo));
    q = query(q, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapDocToShift(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    throw error;
  }
}
export async function getAllWithFilters(filters: Partial<ShiftFilters> & { search?: string } = {}): Promise<Shift[]> {
  try {
    const db = getDb();
    if (!db) return [];
    let q = query(collection(db, COLLECTION_NAME));
    if (filters.facilityId) q = query(q, where('facilityId', '==', filters.facilityId));
    if (filters.status) q = query(q, where('status', '==', filters.status));
    if (filters.type) q = query(q, where('type', '==', filters.type));
    if (filters.search) q = query(q, where('type', '>=', filters.search));
    q = query(q, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapDocToShift(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    throw error;
  }
}


// --- Merged from read5.ts ---
export async function getAvailableSlots(shiftId: string): Promise<number> {
  const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, shiftId));
  if (!shiftDoc.exists()) return 0;
  const data = shiftDoc.data() as { capacity?: number; assignedCount?: number };
  const capacity = data.capacity || 1;
  const assignedCount = data.assignedCount || 0;
  return Math.max(0, capacity - assignedCount);
}
export async function getAssignedUsers(shiftId: string): Promise<string[]> {
  const q = query(
    collection(getDb(), 'assignments'),
    where('shiftId', '==', shiftId),
    where('status', 'in', ['assigned', 'accepted'])
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => (d.data() as { userId: string }).userId);
}


// --- Merged from read6.ts ---
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


// --- Merged from read7.ts ---
export async function getShiftsWithAssignments(filters: {
  dateFrom?: Date;
  dateTo?: Date;
  facilityId?: string;
  status?: string;
  type?: string;
} = {}): Promise<Array<{
  id: string;
  assignments: Array<{ id: string; userId: string; shiftId: string; status: string; assignedAt?: { toDate: () => Date }; createdAt?: { toDate: () => Date } }>;
  assignedUsers: Array<{ id: string; displayName?: string; email?: string }>;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}>> {
  const db = getDb();
  if (!db) return [];
  let q = query(collection(db, COLLECTION_NAME));
  if (filters.dateFrom) q = query(q, where('date', '>=', filters.dateFrom));
  if (filters.dateTo) q = query(q, where('date', '<=', filters.dateTo));
  if (filters.facilityId) q = query(q, where('facilityId', '==', filters.facilityId));
  if (filters.status) q = query(q, where('status', '==', filters.status));
  if (filters.type) q = query(q, where('type', '==', filters.type));
  q = query(q, orderBy('date', 'asc'), orderBy('startTime', 'asc'));
  const shiftsSnapshot = await getDocs(q);
  const result: Array<{
    id: string;
    assignments: Array<{ id: string; userId: string; shiftId: string; status: string; assignedAt?: { toDate: () => Date }; createdAt?: { toDate: () => Date } }>;
    assignedUsers: Array<{ id: string; displayName?: string; email?: string }>;
    date: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }> = [];
  for (const shiftDoc of shiftsSnapshot.docs) {
    const shiftData = shiftDoc.data() as { date: { toDate: () => Date }; createdAt?: { toDate: () => Date }; updatedAt?: { toDate: () => Date } };
    const assignmentsSnap = await getDocs(query(collection(db, 'assignments'), where('shiftId', '==', shiftDoc.id)));
    const assignments = assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{ id: string; userId: string; shiftId: string; status: string; assignedAt?: { toDate: () => Date }; createdAt?: { toDate: () => Date } }>;
    const assignedUserIds = assignments.filter(a => a.status === 'accepted' || a.status === 'assigned').map(a => a.userId);
    const assignedUsers: Array<{ id: string; displayName?: string; email?: string }> = [];
    for (const uid of assignedUserIds) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const u = userDoc.data() as { displayName?: string; email?: string };
        assignedUsers.push({ id: userDoc.id, displayName: u.displayName, email: u.email });
      }
    }
    result.push({
      id: shiftDoc.id,
      assignments,
      assignedUsers,
      date: safeToDate(shiftData.date),
      createdAt: shiftData.createdAt ? safeToDate(shiftData.createdAt) : undefined,
      updatedAt: shiftData.updatedAt ? safeToDate(shiftData.updatedAt) : undefined,
    });
  }
  return result;
}
export async function getCapacityIndicators(dateFrom: Date, dateTo: Date): Promise<Array<{
  shiftId: string;
  assigned: number;
  capacity: number;
  percentage: number;
  color: 'success' | 'warning' | 'error';
  facilityName: string;
  stationName: string;
  type?: string;
  date: string;
  status: 'open' | 'filled' | 'cancelled';
}>> {
  const shifts = await getByDateRange(dateFrom, dateTo);
  const facilityMap = new Map<string, { name: string; stations: Array<{ id: string; name: string }> }>();
  const facilityIds = [...new Set(shifts.map(s => s.facilityId).filter(Boolean))] as string[];
  await Promise.all(
    facilityIds.map(async (facilityId) => {
      const facility = await facilityService.getById(facilityId);
      if (facility) facilityMap.set(facilityId, { name: facility.name, stations: facility.stations || [] });
    })
  );
  return shifts.map(shift => {
    const assigned = shift.assignedCount || 0;
    const capacity = shift.capacity || 1;
    const percentage = Math.round((assigned / capacity) * 100);
    const color: 'success' | 'warning' | 'error' = percentage >= 100 ? 'success' : percentage >= 80 ? 'warning' : 'error';
    let facilityName = 'Unbekannte Einrichtung';
    let stationName = 'Unbekannte Station';
    if (shift.facilityId) {
      const fac = facilityMap.get(shift.facilityId);
      if (fac) {
        facilityName = fac.name;
        if (shift.stationId && fac.stations) {
          const st = fac.stations.find(s => s.id === shift.stationId);
          stationName = st?.name || shift.stationId || 'Unbekannte Station';
        }
      }
    }
    return {
      shiftId: shift.id,
      assigned,
      capacity,
      percentage,
      color,
      facilityName,
      stationName,
      type: shift.type,
      date: shift.date,
      status: shift.status,
    };
  });
}

