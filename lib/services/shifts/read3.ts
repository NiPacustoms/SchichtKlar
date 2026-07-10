import { getDb } from '@/lib/firebase';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { logger } from '@/lib/logging';
import { facilityService } from '../facilities';
import { collection, getDocs, orderBy, query, QueryConstraint, where } from 'firebase/firestore';
import type { Shift, ShiftFilters } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToShift } from './mapDoc';

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
