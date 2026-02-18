import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/errors';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { getDoc, getDocs, doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { Assignment } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToAssignment } from './mapDoc';

export async function getActiveByShift(shiftId: string): Promise<Assignment[]> {
  const db = getDb();
  if (!db) return [];
  const companyId = await getCompanyIdFromAuth();
  if (!companyId) {
    logger.warn('No companyId found, returning empty array');
    return [];
  }
  const q = query(
    collection(db, COLLECTION_NAME),
    where('companyId', '==', companyId),
    where('shiftId', '==', shiftId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => mapDocToAssignment({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

export async function getMyActiveAssignments(userId: string): Promise<Assignment[]> {
  const db = getDb();
  if (!db) return [];
  let companyId = await getCompanyIdFromAuth();
  if (!companyId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) companyId = userDoc.data().companyId;
    } catch (error) {
      logger.warn('Failed to get companyId from user document', {}, { error: error instanceof Error ? error.message : String(error) });
    }
  }
  let q;
  if (companyId) {
    q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      where('userId', '==', userId),
      where('status', 'in', ['assigned', 'accepted']),
      orderBy('assignedAt', 'asc')
    );
  } else {
    if (process.env.NODE_ENV === 'development') {
      logger.info('No companyId found for user - querying assignments without companyId filter (Development mode)', { userId });
    } else {
      logger.warn('No companyId found for user - querying assignments without companyId filter. This may indicate a configuration issue', { userId });
    }
    q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('status', 'in', ['assigned', 'accepted']),
      orderBy('assignedAt', 'asc')
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => mapDocToAssignment({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}
