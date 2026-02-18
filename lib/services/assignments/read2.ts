import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/errors';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Assignment, PaginatedResponse } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToAssignment } from './mapDoc';

export async function getByShiftId(shiftId: string): Promise<Assignment[]> {
  const db = getDb();
  if (!db) {
    logger.warn('Firebase not initialized, returning empty array');
    return [];
  }
  const companyId = await getCompanyIdFromAuth();
  if (!companyId) {
    logger.warn('No companyId found, returning empty array');
    return [];
  }
  const q = query(
    collection(db, COLLECTION_NAME),
    where('companyId', '==', companyId),
    where('shiftId', '==', shiftId),
    orderBy('assignedAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => mapDocToAssignment({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

export async function getAll(page = 1, pageSize = 50): Promise<PaginatedResponse<Assignment>> {
  const db = getDb();
  if (!db) {
    logger.warn('Firebase not initialized, returning empty result');
    return { data: [], total: 0, page, limit: pageSize, hasMore: false };
  }
  try {
    const companyId = await getCompanyIdFromAuth();
    if (!companyId) {
      logger.warn('No companyId found, returning empty result');
      return { data: [], total: 0, page, limit: pageSize, hasMore: false };
    }
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      orderBy('assignedAt', 'desc'),
      limit(pageSize)
    );
    const snapshot = await getDocs(q);
    const assignments = snapshot.docs.map(d => mapDocToAssignment({ id: d.id, data: () => d.data() as Record<string, unknown> }));
    return {
      data: assignments,
      total: assignments.length,
      page,
      limit: pageSize,
      hasMore: assignments.length === pageSize,
    };
  } catch (error) {
    logger.error('Error getting all assignments', error instanceof Error ? error : new Error(String(error)));
    return { data: [], total: 0, page, limit: pageSize, hasMore: false };
  }
}
