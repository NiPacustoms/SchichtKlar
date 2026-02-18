import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/errors';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { getDoc, getDocs, doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Assignment } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToAssignment } from './mapDoc';

export async function getMyPendingAssignments(userId: string): Promise<Assignment[]> {
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
  if (!companyId) {
    logger.warn('No companyId found, returning empty array');
    return [];
  }
  const q = query(
    collection(db, COLLECTION_NAME),
    where('companyId', '==', companyId),
    where('userId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('assignedAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => mapDocToAssignment({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

export async function getTodayAssignment(userId: string): Promise<Assignment | null> {
  try {
    const db = getDb();
    if (!db) {
      logger.warn('Firebase not initialized, returning null');
      return null;
    }
    const companyId = await getCompanyIdFromAuth();
    if (!companyId) {
      logger.warn('No companyId found, returning null');
      return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      where('userId', '==', userId),
      where('assignedAt', '>=', today),
      where('assignedAt', '<', tomorrow),
      orderBy('assignedAt', 'asc')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    for (const d of snapshot.docs) {
      const assignment = mapDocToAssignment({ id: d.id, data: () => d.data() as Record<string, unknown> });
      if (assignment.status === 'accepted' || assignment.status === 'assigned') return assignment;
    }
    return null;
  } catch (error) {
    logger.error('Error fetching today assignment', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

export async function getUpcomingAssignments(userId: string): Promise<Assignment[]> {
  try {
    const db = getDb();
    if (!db) return [];
    const companyId = await getCompanyIdFromAuth();
    if (!companyId) return [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      where('userId', '==', userId),
      where('assignedAt', '>=', tomorrow),
      where('status', '==', 'pending'),
      orderBy('assignedAt', 'asc'),
      limit(5)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapDocToAssignment({ id: d.id, data: () => d.data() as Record<string, unknown> }));
  } catch (error) {
    logger.error('Error fetching upcoming assignments', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
