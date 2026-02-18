import { getDb } from '@/lib/firebase';
import { errorHandler, logger } from '@/lib/errors';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { doc, getDoc, getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Assignment } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToAssignment } from './mapDoc';

export async function getById(id: string): Promise<Assignment | null> {
  const db = getDb();
  if (!db) {
    logger.warn('Firebase not initialized, returning null');
    return null;
  }
  try {
    const assignmentDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!assignmentDoc.exists()) return null;
    return mapDocToAssignment({ id: assignmentDoc.id, data: () => assignmentDoc.data() as Record<string, unknown> });
  } catch (error) {
    const appError = errorHandler.handleFirebaseError(error);
    logger.error('Failed to get assignment by ID', appError);
    throw appError;
  }
}

export async function getByUserId(userId: string, companyId?: string, limitCount = 50): Promise<Assignment[]> {
  const db = getDb();
  if (!db) {
    logger.warn('Firebase not initialized, returning empty array');
    return [];
  }
  try {
    let resolvedCompanyId: string | undefined = companyId;
    if (!resolvedCompanyId) {
      const authCompanyId = await getCompanyIdFromAuth();
      resolvedCompanyId = authCompanyId || undefined;
    }
    if (!resolvedCompanyId) {
      logger.warn('No companyId found, returning empty array');
      return [];
    }
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', resolvedCompanyId),
      where('userId', '==', userId),
      orderBy('assignedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapDocToAssignment({ id: d.id, data: () => d.data() as Record<string, unknown> }));
  } catch (error) {
    logger.error('Error getting assignments by user ID', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}
