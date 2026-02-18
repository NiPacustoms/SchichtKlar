import { getDb } from '@/lib/firebase';
import { facilityService } from '../facilities';
import { getDoc, getDocs, doc, collection, query, where, orderBy } from 'firebase/firestore';
import { COLLECTION_NAME } from './types';
import { safeToDate } from './helpers';
import { getByDateRange } from './read2';

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
