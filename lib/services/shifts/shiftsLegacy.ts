import { getDb } from '@/lib/firebase';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { logger } from '@/lib/logging';
import { createAppError, ErrorCode, ErrorUtils } from '@/lib/errors';

export interface Shift {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  facilityId: string;
  stationId?: string;
  companyId?: string; // Mandantenzugehörigkeit
  type?: string;
  requiredQualifications: string[];
  capacity: number;
  maxStaff: number;
  assignedCount?: number;
  status: 'open' | 'filled' | 'cancelled';
  assignedTo?: string[];
  notes?: string;
  timezone?: string;
  color?: string;
  shiftGroupId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftFilters {
  facilityId?: string;
  stationId?: string;
  status?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  dateFrom?: Date;
  dateTo?: Date;
  qualifications?: string[];
  companyId?: string; // Filter nach Firma (über Facility)
}
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  updateDoc,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { writeAuditLog } from '@/lib/services/auditLogService';
import { facilityService } from '../facilities';
import * as read from './read';
import * as read2 from './read2';
import * as subscribe from './subscribe';
import * as write from './write';

const COLLECTION_NAME = 'shifts';

// Hilfsfunktion für sichere Konvertierung von Firestore Timestamps
const safeToDate = (value: unknown): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
};

// Hilfsfunktion für sichere Konvertierung von Firestore Timestamp zu ISO-Datum-String
const safeDateToISOString = (value: unknown): string => {
  const date = safeToDate(value);
  return date.toISOString().split('T')[0];
};

const serviceErrorHandler = ErrorUtils.createServiceHandler('shiftService');

export const shiftService = {
  getById: read.getById,
  getByFacility: read2.getByFacility,
  getOpenShifts: read2.getOpenShifts,
  getByDateRange: read2.getByDateRange,
  subscribeAll: subscribe.subscribeAll,
  create: write.create,
  update: write.update,
  updateStatus: write.updateStatus,
  delete: write.deleteShift,

  // Get all shifts with filters
  async getAll(filters?: ShiftFilters): Promise<Shift[]> {
    const db = getDb();
    if (!db || typeof window === 'undefined') {
      return [];
    }
    try {
      // Wenn kein companyId-Filter übergeben wurde, hole es aus Auth
      let companyId = filters?.companyId;
      if (!companyId && typeof window !== 'undefined') {
        companyId = await getCompanyIdFromAuth() || undefined;
      }

      // WICHTIG: Wenn keine companyId gefunden wird, können wir nicht sicher filtern
      // Die Firestore Rules erlauben nur Zugriff auf Shifts der eigenen Company
      // Daher müssen wir früh zurückkehren, um Permission-Denied-Fehler zu vermeiden
      if (!companyId) {
        // Diese Warnung wird normalerweise nicht mehr erreicht, da die Query deaktiviert wird,
        // wenn keine companyId vorhanden ist. Behalten wir sie für den Fall, dass die Funktion
        // direkt aufgerufen wird.
        logger.debug('No companyId found in filters or auth. Cannot fetch shifts without companyId due to security rules.');
        return [];
      }

      // If companyId filter is provided, we need to filter by facilities first
      let facilityIds: string[] | undefined;
      try {
        const facilities = await facilityService.getAll(companyId);
        facilityIds = facilities.map(f => f.id);
        // If no facilities found for this company, return empty array
        if (facilityIds.length === 0) {
          return [];
        }
        // If facilityId is also specified, check if it belongs to the company
        if (filters && filters.facilityId && !facilityIds.includes(filters.facilityId)) {
          return [];
        }
      } catch (facilityError) {
        logger.error('Error fetching facilities for companyId filter', facilityError instanceof Error ? facilityError : new Error(String(facilityError)));
        // If we can't fetch facilities, we can't filter by companyId
        // Return empty array to be safe
        return [];
      }

      // Start with base collection and collect all constraints
      const constraints: QueryConstraint[] = [];

      // WICHTIG: Wir müssen immer nach facilityIds filtern, um sicherzustellen,
      // dass nur Shifts der eigenen Company geladen werden
      // Die Firestore Rules erlauben nur Zugriff auf Shifts mit passender companyId
      if (!facilityIds || facilityIds.length === 0) {
        logger.warn('No facilities found for companyId. Cannot fetch shifts without facility filter.');
        return [];
      }

      // Apply filters first
      if (filters && filters.facilityId) {
        // Prüfe, ob die angegebene facilityId zur Company gehört
        if (!facilityIds.includes(filters.facilityId)) {
          logger.warn(`Facility ${filters.facilityId} does not belong to company ${companyId}`);
          return [];
        }
        constraints.push(where('facilityId', '==', filters.facilityId));
      } else {
        // Filter by companyId via facilityIds
        // Firestore 'in' query supports max 10 values
        if (facilityIds.length <= 10) {
          constraints.push(where('facilityId', 'in', facilityIds));
        } else {
          // For more than 10 facilities, we need to fetch all and filter client-side
          // This is less efficient but necessary due to Firestore limitations
          // Note: This will still be filtered by Firestore Rules on document level
        }
      }
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
      }
      if (filters?.dateFrom) {
        constraints.push(where('date', '>=', filters.dateFrom));
      }
      if (filters?.dateTo) {
        constraints.push(where('date', '<=', filters.dateTo));
      }

      let q = query(collection(getDb(), COLLECTION_NAME), ...constraints);

      // Try to add orderBy, but if it fails, we'll sort manually
      let snapshot;
      try {
        q = query(q, orderBy('date', 'desc'));
        snapshot = await getDocs(q);
      } catch (orderByError: unknown) {
        // If orderBy fails (e.g., missing index), try without it
        const err = orderByError as { code?: string; message?: string } | Error;
        if ((err as { code?: string; message?: string })?.code === 'failed-precondition' || (err instanceof Error ? err.message : (err as { message?: string })?.message)?.includes('requires an index')) {
          logger.warn('Firestore index missing for shifts query. Fetching without orderBy and sorting manually.');
          // Use the same constraints but without orderBy
          snapshot = await getDocs(query(collection(getDb(), COLLECTION_NAME), ...constraints));
        } else {
          throw orderByError;
        }
      }

      const shifts: Shift[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const shiftFacilityId = data.facilityId;
        
        // If we have facilityIds filter and more than 10 facilities, filter client-side
        if (facilityIds && facilityIds.length > 10 && !facilityIds.includes(shiftFacilityId)) {
          return; // Skip this shift
        }
        
        shifts.push({
          id: doc.id,
          title: data.title || `${data.type} - ${data.startTime}`,
          facilityId: shiftFacilityId,
          stationId: data.stationId,
          companyId: (data as Partial<Shift> & { companyId?: string }).companyId,
          date: safeDateToISOString(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          type: data.type,
          requiredQualifications: data.requiredQualifications || [],
          capacity: data.capacity || 1,
          maxStaff: data.maxStaff || 1,
          assignedCount: data.assignedCount || 0,
          status: data.status || 'open',
          assignedTo: data.assignedTo || [],
          notes: data.notes,
          timezone: data.timezone || 'Europe/Berlin',
          createdBy: data.createdBy,
          color: data.color as string | undefined,
          shiftGroupId: data.shiftGroupId as string | undefined,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        });
      });

      // Sort manually to ensure correct order
      shifts.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order
      });

      return shifts;
    } catch (error: unknown) {
      // Handle permission denied or unauthenticated errors gracefully
      const err = error as { code?: string; message?: string };
      if (err?.code === 'permission-denied' || err?.code === 'unauthenticated') {
        // This is expected behavior when:
        // 1. User doesn't have access to shifts from other companies (normal behavior)
        // 2. Query tries to access shifts without proper companyId filter
        // 3. User is not yet authenticated
        // It's safe to return empty array as the security rules are working correctly
        // Silently return empty array - no logging needed as this is expected behavior
        return [];
      }
      // Handle missing index errors - these are expected until Firestore indexes are created
      if (err?.code === 'failed-precondition' || err?.message?.includes('requires an index')) {
        const indexUrl = err?.message?.match(/https:\/\/[^\s]+/)?.[0] || 'Firebase Console';
        logger.warn('Firestore index missing for shifts query. Create the index at: ' + indexUrl);
        return [];
      }
      // For other errors, log but still return empty array to prevent app crashes
      logger.error('Error fetching shifts', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  },

  // Get shifts with filters
  async getWithFilters(filters: ShiftFilters): Promise<Shift[]> {
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        logger.warn('No companyId found, returning empty array');
        return [];
      }

      let q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId)
      );

      if (filters.facilityId) {
        q = query(q, where('facilityId', '==', filters.facilityId));
      }

      if (filters.stationId) {
        q = query(q, where('stationId', '==', filters.stationId));
      }

      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.dateFrom) {
        q = query(q, where('date', '>=', filters.dateFrom));
      }

      if (filters.dateTo) {
        q = query(q, where('date', '<=', filters.dateTo));
      }

      q = query(q, orderBy('date', 'asc'));

      const snapshot = await getDocs(q);
      const shifts: Shift[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        shifts.push({
          id: doc.id,
          title: data.title || `${data.type} - ${data.startTime}`,
          facilityId: data.facilityId,
          companyId: (data as Partial<Shift> & { companyId?: string }).companyId,
          stationId: data.stationId,
          date: safeDateToISOString(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          type: data.type,
          requiredQualifications: data.requiredQualifications || [],
          capacity: data.capacity || 1,
          maxStaff: data.maxStaff || 1,
          status: data.status || 'open',
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
          // Neue Felder
          assignedCount: data.assignedCount || 0,
          timezone: data.timezone || 'Europe/Berlin',
          notes: data.notes,
          createdBy: data.createdBy,
          color: data.color as string | undefined,
          shiftGroupId: data.shiftGroupId as string | undefined,
        });
      });

      return shifts;
    } catch (error) {
      throw error;
    }
  },

  // Get all shifts with advanced filters
  async getAllWithFilters(filters: Partial<ShiftFilters> & { search?: string } = {}): Promise<Shift[]> {
    try {
      let q = query(collection(getDb(), COLLECTION_NAME));

      if (filters.facilityId) {
        q = query(q, where('facilityId', '==', filters.facilityId));
      }

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters.search) {
        // Note: Firestore doesn't support full-text search, this is a simplified version
        // In production, you'd use Algolia or similar for proper search
        q = query(q, where('type', '>=', filters.search));
      }

      q = query(q, orderBy('date', 'desc'));

      const snapshot = await getDocs(q);
      const shifts: Shift[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        shifts.push({
          id: doc.id,
          title: data.title || `${data.type} - ${data.startTime}`,
          facilityId: data.facilityId,
          companyId: (data as Partial<Shift> & { companyId?: string }).companyId,
          stationId: data.stationId,
          date: safeDateToISOString(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          type: data.type,
          requiredQualifications: data.requiredQualifications || [],
          capacity: data.capacity || 1,
          maxStaff: data.maxStaff || 1,
          assignedCount: data.assignedCount || 0,
          status: data.status || 'open',
          notes: data.notes,
          createdBy: data.createdBy,
          timezone: data.timezone || 'Europe/Berlin',
          color: data.color as string | undefined,
          shiftGroupId: data.shiftGroupId as string | undefined,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        });
      });

      return shifts;
    } catch (error) {
      throw error;
    }
  },

  // Assign user to shift
  async assignUser(shiftId: string, userId: string): Promise<string> {
    try {
      // Check if shift has available capacity
      const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, shiftId));
      if (!shiftDoc.exists()) {
        throw createAppError(
          new Error('Shift not found'),
          ErrorCode.FIREBASE_NOT_FOUND,
          { component: 'shiftService', action: 'assignUser', route: 'shifts' }
        );
      }

      const shiftData = shiftDoc.data() as {
        assignedCount?: number;
        capacity?: number;
        date?: Date | { toDate?: () => Date };
      };
      const currentAssigned = shiftData.assignedCount || 0;
      const capacity = shiftData.capacity || 1;

      if (currentAssigned >= capacity) {
        throw createAppError(
          new Error('Shift is already at full capacity'),
          ErrorCode.SHIFT_FULL,
          { component: 'shiftService', action: 'assignUser' }
        );
      }

      // WICHTIG: companyId aus Shift holen, damit Frontend-Queries funktionieren
      const shiftCompanyId = (shiftData as Partial<Shift> & { companyId?: string }).companyId;
      let resolvedCompanyId: string | undefined = shiftCompanyId;
      if (!resolvedCompanyId) {
        // Fallback: Versuche companyId aus Auth zu holen
        const authCompanyId = await getCompanyIdFromAuth();
        resolvedCompanyId = authCompanyId || undefined;
      }
      if (!resolvedCompanyId) {
        throw createAppError(
          new Error('No companyId found for assignment'),
          ErrorCode.VALIDATION_REQUIRED_FIELD,
          { component: 'shiftService', action: 'assignUser' }
        );
      }

      // Create assignment
      const assignmentRef = await addDoc(collection(getDb(), 'assignments'), {
        shiftId,
        userId,
        companyId: resolvedCompanyId, // WICHTIG: companyId für Mandantenisolation
        status: 'assigned',
        assignedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update shift assigned count
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
  },

  // Unassign user from shift
  async unassignUser(shiftId: string, userId: string): Promise<void> {
    try {
      // Find and delete assignment
      const assignmentsQuery = query(
        collection(getDb(), 'assignments'),
        where('shiftId', '==', shiftId),
        where('userId', '==', userId)
      );

      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      
      for (const assignmentDoc of assignmentsSnapshot.docs) {
        await deleteDoc(assignmentDoc.ref);
      }

      // Update shift assigned count
      const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, shiftId));
      if (shiftDoc.exists()) {
        const shiftData = shiftDoc.data();
        const currentAssigned = Math.max(0, (shiftData.assignedCount || 0) - 1);
        
        await updateDoc(doc(getDb(), COLLECTION_NAME, shiftId), {
          assignedCount: currentAssigned,
          status: currentAssigned === 0 ? 'open' : 'filled',
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      throw error;
    }
  },

  // Neue Methoden für erweiterte Schichtverwaltung
  async createWithCapacity(
    data: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string }
  ): Promise<string> {
    try {
      // Hole companyId aus der Facility
      let companyId = (data as Partial<Shift> & { companyId?: string }).companyId;
      if (!companyId && data.facilityId) {
        const facilityDoc = await getDoc(doc(getDb(), 'facilities', data.facilityId));
        if (facilityDoc.exists()) {
          companyId = facilityDoc.data().companyId;
        }
      }
      if (!companyId) {
        const authCompanyId = await getCompanyIdFromAuth();
        companyId = authCompanyId || undefined;
      }
      if (!companyId) {
        throw createAppError(
          new Error('No companyId found for shift'),
          ErrorCode.VALIDATION_REQUIRED_FIELD,
          { component: 'shiftService', action: 'createWithCapacity' }
        );
      }

      const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), {
        ...data,
        companyId: companyId,
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
  },

  async getAvailableSlots(shiftId: string): Promise<number> {
    const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, shiftId));
      if (!shiftDoc.exists()) return 0;

      const data = shiftDoc.data() as {
        capacity?: number;
        assignedCount?: number;
      };
      const capacity = data.capacity || 1;
      const assignedCount = data.assignedCount || 0;

      return Math.max(0, capacity - assignedCount);
  },

  async getAssignedUsers(shiftId: string): Promise<string[]> {
    const assignmentsQuery = query(
        collection(getDb(), 'assignments'),
        where('shiftId', '==', shiftId),
        where('status', 'in', ['assigned', 'accepted'])
      );

      const snapshot = await getDocs(assignmentsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data() as { userId: string };
        return data.userId;
      });
  },

  async updateCapacity(shiftId: string, newCapacity: number): Promise<void> {
    try {
      if (newCapacity < 1) {
        throw createAppError(
          new Error('Capacity must be at least 1'),
          ErrorCode.VALIDATION_OUT_OF_RANGE,
          { component: 'shiftService', action: 'updateCapacity', shiftId }
        );
      }

      const shiftRef = doc(getDb(), COLLECTION_NAME, shiftId);
      const shiftDoc = await getDoc(shiftRef);

      if (!shiftDoc.exists()) {
        throw createAppError(
          new Error('Shift not found'),
          ErrorCode.FIREBASE_NOT_FOUND,
          { component: 'shiftService', action: 'updateCapacity', shiftId }
        );
      }

      const currentData = shiftDoc.data() as {
        assignedCount?: number;
      };
      const currentAssignedCount = currentData.assignedCount || 0;

      if (newCapacity < currentAssignedCount) {
        throw createAppError(
          new Error('New capacity cannot be less than current assigned count'),
          ErrorCode.VALIDATION_OUT_OF_RANGE,
          { component: 'shiftService', action: 'updateCapacity', shiftId }
        );
      }

      await updateDoc(shiftRef, {
        capacity: newCapacity,
        status: currentAssignedCount >= newCapacity ? 'assigned' : 'open',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      const appError = serviceErrorHandler.handleFirebaseError(error, { action: 'updateCapacity', shiftId });
      logger.error('Failed to update capacity', appError, { shiftId, newCapacity });
      throw appError;
    }
  },

  // Konflikt-Management Methoden
  async getConflicts(dateFrom: Date, dateTo: Date): Promise<unknown[]> {
    try {
      // Get all assignments in date range
      const assignmentsQuery = query(
        collection(getDb(), 'assignments'),
        where('assignedAt', '>=', dateFrom),
        where('assignedAt', '<=', dateTo),
        where('status', 'in', ['assigned', 'accepted'])
      );

      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignments = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{
        id: string;
        userId: string;
        shiftId: string;
        status: string;
        assignedAt?: { toDate: () => Date };
        createdAt?: { toDate: () => Date };
      }>;

      // Group assignments by user
      const userAssignments = assignments.reduce(
        (acc, assignment) => {
          if (!acc[assignment.userId]) {
            acc[assignment.userId] = [];
          }
          acc[assignment.userId].push(assignment);
          return acc;
        },
        {} as Record<string, Array<{
          id: string;
          userId: string;
          shiftId: string;
          status: string;
          assignedAt?: { toDate: () => Date };
          createdAt?: { toDate: () => Date };
        }>>
      );

      const conflicts: unknown[] = [];

      // Check for conflicts for each user
      for (const [userId, userAssignmentList] of Object.entries(userAssignments)) {
        if (userAssignmentList.length < 2) continue;

        // Get shift data for each assignment
        const shiftPromises = userAssignmentList.map(async assignment => {
          const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, assignment.shiftId));
          if (shiftDoc.exists()) {
            return {
              assignment,
              shift: { id: shiftDoc.id, ...shiftDoc.data() },
            };
          }
          return null;
        });

        const shiftData = (await Promise.all(shiftPromises)).filter(Boolean) as Array<{
          assignment: { id: string; shiftId: string; userId: string; status: string };
          shift: { id: string; facilityId?: string; stationId?: string; date?: { toDate: () => Date }; startTime: string; endTime: string };
        }>;

        // Check for time overlaps
        for (let i = 0; i < shiftData.length; i++) {
          for (let j = i + 1; j < shiftData.length; j++) {
            const shift1 = shiftData[i];
            const shift2 = shiftData[j];

            const shift1Data = shift1.shift as { date?: { toDate: () => Date }; startTime: string; endTime: string };
            const shift2Data = shift2.shift as { date?: { toDate: () => Date }; startTime: string; endTime: string };

            const shift1ForOverlap = {
              startTime: shift1Data.startTime,
              endTime: shift1Data.endTime,
              date: safeDateToISOString(shift1Data.date),
            };
            const shift2ForOverlap = {
              startTime: shift2Data.startTime,
              endTime: shift2Data.endTime,
              date: safeDateToISOString(shift2Data.date),
            };

            if (this.checkTimeOverlap(shift1ForOverlap, shift2ForOverlap)) {
              // Lade Facility- und Station-Namen aus der Datenbank
              let facilityName = 'Unbekannte Einrichtung';
              let stationName = 'Unbekannte Station';
              
              if (shift1.shift.facilityId) {
                const facility = await facilityService.getById(shift1.shift.facilityId);
                if (facility) {
                  facilityName = facility.name;
                  
                  // Lade Station-Name aus Facility
                  if (shift1.shift.stationId && facility.stations) {
                    const station = facility.stations.find(s => s.id === shift1.shift.stationId);
                    if (station) {
                      stationName = station.name || shift1.shift.stationId || 'Unbekannte Station';
                    }
                  }
                }
              }
              
              conflicts.push({
                userId,
                assignmentId1: shift1.assignment.id,
                assignmentId2: shift2.assignment.id,
                shiftId1: shift1.shift.id,
                shiftId2: shift2.shift.id,
                conflictStart: new Date(
                  Math.max(
                    safeToDate(shift1Data.date).getTime() + this.timeToMs(shift1Data.startTime),
                    safeToDate(shift2Data.date).getTime() + this.timeToMs(shift2Data.startTime)
                  )
                ),
                conflictEnd: new Date(
                  Math.min(
                    safeToDate(shift1Data.date).getTime() + this.timeToMs(shift1Data.endTime),
                    safeToDate(shift2Data.date).getTime() + this.timeToMs(shift2Data.endTime)
                  )
                ),
                facilityName,
                stationName,
              });
            }
          }
        }
      }

      return conflicts;
    } catch (error) {
      throw error;
    }
  },

  async detectConflictForUser(userId: string, shiftId: string): Promise<boolean> {
    try {
      // Get the new shift
      const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, shiftId));
      if (!shiftDoc.exists()) return false;

      const newShift = { id: shiftDoc.id, ...shiftDoc.data() } as {
        id: string;
        startTime: string;
        endTime: string;
        date?: { toDate: () => Date };
      };

      // Get user's existing assignments
      const userAssignmentsQuery = query(
        collection(getDb(), 'assignments'),
        where('userId', '==', userId),
        where('status', 'in', ['assigned', 'accepted'])
      );

      const userAssignmentsSnapshot = await getDocs(userAssignmentsQuery);

      // Check for conflicts with existing assignments
      for (const assignmentDoc of userAssignmentsSnapshot.docs) {
        const assignment = assignmentDoc.data() as { shiftId: string };
        const existingShiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, assignment.shiftId));

        if (existingShiftDoc.exists()) {
          const existingShift = { id: existingShiftDoc.id, ...existingShiftDoc.data() } as {
            id: string;
            startTime: string;
            endTime: string;
            date?: { toDate: () => Date };
          };

          const newShiftForOverlap = {
            startTime: newShift.startTime,
            endTime: newShift.endTime,
            date: safeDateToISOString(newShift.date),
          };
          const existingShiftForOverlap = {
            startTime: existingShift.startTime,
            endTime: existingShift.endTime,
            date: safeDateToISOString(existingShift.date),
          };

          if (this.checkTimeOverlap(newShiftForOverlap, existingShiftForOverlap)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      throw error;
    }
  },

  // Helper methods for conflict detection
  checkTimeOverlap(shift1: { startTime: string; endTime: string; date?: string }, shift2: { startTime: string; endTime: string; date?: string }): boolean {
    const start1 = new Date(shift1.date || new Date()).getTime() + this.timeToMs(shift1.startTime);
    const end1 = new Date(shift1.date || new Date()).getTime() + this.timeToMs(shift1.endTime);
    const start2 = new Date(shift2.date || new Date()).getTime() + this.timeToMs(shift2.startTime);
    const end2 = new Date(shift2.date || new Date()).getTime() + this.timeToMs(shift2.endTime);

    return start1 < end2 && start2 < end1;
  },

  timeToMs(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 60 + minutes) * 60 * 1000;
  },

  // Neue Methoden für erweiterte Schichtverwaltung
  async getShiftsWithAssignments(
    filters: {
      dateFrom?: Date;
      dateTo?: Date;
      facilityId?: string;
      status?: string;
      type?: string;
    } = {}
  ): Promise<Array<{
    id: string;
    assignments: Array<{
      id: string;
      userId: string;
      shiftId: string;
      status: string;
      assignedAt?: { toDate: () => Date };
      createdAt?: { toDate: () => Date };
    }>;
    assignedUsers: Array<{
      id: string;
      displayName?: string;
      email?: string;
    }>;
    date: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }>> {
    try {
      let q = query(collection(getDb(), COLLECTION_NAME));

      if (filters.dateFrom) {
        q = query(q, where('date', '>=', filters.dateFrom));
      }
      if (filters.dateTo) {
        q = query(q, where('date', '<=', filters.dateTo));
      }
      if (filters.facilityId) {
        q = query(q, where('facilityId', '==', filters.facilityId));
      }
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }

      q = query(q, orderBy('date', 'asc'), orderBy('startTime', 'asc'));

      const shiftsSnapshot = await getDocs(q);
      const shiftsWithAssignments: Array<{
        id: string;
        assignments: Array<{
          id: string;
          userId: string;
          shiftId: string;
          status: string;
          assignedAt?: { toDate: () => Date };
          createdAt?: { toDate: () => Date };
        }>;
        assignedUsers: Array<{
          id: string;
          displayName?: string;
          email?: string;
        }>;
        date: Date;
        createdAt?: Date;
        updatedAt?: Date;
      }> = [];

      for (const shiftDoc of shiftsSnapshot.docs) {
        const shiftData = shiftDoc.data() as {
          date: { toDate: () => Date };
          createdAt?: { toDate: () => Date };
          updatedAt?: { toDate: () => Date };
        };

        // Get assignments for this shift
        const assignmentsQuery = query(
          collection(getDb(), 'assignments'),
          where('shiftId', '==', shiftDoc.id)
        );
        const assignmentsSnapshot = await getDocs(assignmentsQuery);

        const assignments = assignmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Array<{
          id: string;
          userId: string;
          shiftId: string;
          status: string;
          assignedAt?: { toDate: () => Date };
          createdAt?: { toDate: () => Date };
        }>;

        // Get user data for assigned users
        const assignedUserIds = assignments
          .filter(a => a.status === 'accepted' || a.status === 'assigned')
          .map(a => a.userId);

        const assignedUsers: Array<{
          id: string;
          displayName?: string;
          email?: string;
        }> = [];
        for (const userId of assignedUserIds) {
          const userDoc = await getDoc(doc(getDb(), 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as {
              displayName?: string;
              email?: string;
            };
            assignedUsers.push({ 
              id: userDoc.id, 
              displayName: userData.displayName,
              email: userData.email
            });
          }
        }

        shiftsWithAssignments.push({
          id: shiftDoc.id,
          assignments,
          assignedUsers,
          date: safeToDate(shiftData.date),
          createdAt: safeToDate(shiftData.createdAt),
          updatedAt: safeToDate(shiftData.updatedAt),
        });
      }

      return shiftsWithAssignments;
    } catch (error) {
      throw error;
    }
  },

  async getCapacityIndicators(dateFrom: Date, dateTo: Date): Promise<Array<{
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
    try {
      // companyId wird hier nicht übergeben, da diese Methode intern verwendet wird
      // und getByDateRange einen Fallback zu getCompanyIdFromAuth() hat
      const shifts = await this.getByDateRange(dateFrom, dateTo);

      // Lade alle benötigten Facilities einmalig
      const facilityMap = new Map<string, { name: string; stations: Array<{ id: string; name: string }> }>();
      const facilityIds = [...new Set(shifts.map(s => s.facilityId).filter(Boolean))];
      
      await Promise.all(
        facilityIds.map(async (facilityId) => {
          if (facilityId) {
            const facility = await facilityService.getById(facilityId);
            if (facility) {
              facilityMap.set(facilityId, {
                name: facility.name,
                stations: facility.stations || [],
              });
            }
          }
        })
      );

      return shifts.map(shift => {
        const assigned = shift.assignedCount || 0;
        const capacity = shift.capacity || 1;
        const percentage = Math.round((assigned / capacity) * 100);

        let color: 'success' | 'warning' | 'error' = 'error';
        if (percentage >= 100) color = 'success';
        else if (percentage >= 80) color = 'warning';

        // Lade Facility- und Station-Namen aus der Map
        let facilityName = 'Unbekannte Einrichtung';
        let stationName = 'Unbekannte Station';
        
        if (shift.facilityId) {
          const facility = facilityMap.get(shift.facilityId);
          if (facility) {
            facilityName = facility.name;
            
            if (shift.stationId && facility.stations) {
              const station = facility.stations.find(s => s.id === shift.stationId);
              if (station) {
                stationName = station.name || shift.stationId || 'Unbekannte Station';
              }
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
    } catch (error) {
      throw error;
    }
  },

  async updateShiftStatus(shiftId: string, newStatus: Shift['status'], reason?: string): Promise<void> {
    try {
      const shiftRef = doc(getDb(), COLLECTION_NAME, shiftId);
      await updateDoc(shiftRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(reason && { statusChangeReason: reason }),
      });
    } catch (error) {
      throw error;
    }
  },

  async bulkUpdateStatus(
    shiftIds: string[],
    newStatus: Shift['status'],
    reason?: string
  ): Promise<void> {
    try {
      for (const id of shiftIds) {
        const shiftRef = doc(getDb(), COLLECTION_NAME, id);
        await updateDoc(shiftRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
          ...(reason && { statusChangeReason: reason }),
        });
      }
    } catch (error) {
      throw error;
    }
  },
};
