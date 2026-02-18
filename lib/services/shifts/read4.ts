import { getDb } from '@/lib/firebase';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { logger } from '@/lib/logging';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import type { Shift, ShiftFilters } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToShift } from './mapDoc';

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
