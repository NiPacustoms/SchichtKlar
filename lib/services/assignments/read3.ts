import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/errors';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import type { Assignment } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToAssignment } from './mapDoc';

export async function getByStatus(status: Assignment['status']): Promise<Assignment[]> {
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
    where('status', '==', status),
    orderBy('assignedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => mapDocToAssignment({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

export async function getByUserAndDateRange(
  userId: string,
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<Assignment[]> {
  const db = getDb();
  if (!db) return [];
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
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const assignments = snapshot.docs.map(d => mapDocToAssignment({ id: d.id, data: () => d.data() as Record<string, unknown> }));
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  return assignments.filter(a => {
    const t = a.assignedAt instanceof Date ? a.assignedAt.getTime() : 0;
    return t >= startTime && t <= endTime;
  });
}
