import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import type { Shift } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToShift } from './mapDoc';

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
