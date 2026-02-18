import { db, getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import type { Timesheet } from './types';
import type { FirestoreTimesheetData } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToTimesheet } from './mapDoc';

export async function getAll(companyIdParam?: string): Promise<Timesheet[]> {
  if (!db) {
    logger.warn('Firebase not initialized, returning empty array');
    return [];
  }
  try {
    let companyId = companyIdParam;
    if (!companyId) companyId = await getCompanyIdFromAuth() || undefined;
    if (!companyId) {
      logger.warn('No companyId found, returning empty array');
      return [];
    }
    const usersQuery = query(
      collection(getDb(), 'users'),
      where('companyId', '==', companyId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const userIds = usersSnapshot.docs.map(d => d.id);
    if (userIds.length === 0) return [];
    if (userIds.length <= 10) {
      const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', 'in', userIds),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d =>
        mapDocToTimesheet({ id: d.id, data: () => d.data() as FirestoreTimesheetData })
      );
    }
    const allTimesheets: Timesheet[] = [];
    for (let i = 0; i < userIds.length; i += 10) {
      const chunk = userIds.slice(i, i + 10);
      const chunkQuery = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', 'in', chunk),
        orderBy('date', 'desc')
      );
      const chunkSnapshot = await getDocs(chunkQuery);
      chunkSnapshot.docs.forEach(d => {
        allTimesheets.push(
          mapDocToTimesheet({ id: d.id, data: () => d.data() as FirestoreTimesheetData })
        );
      });
    }
    allTimesheets.sort((a, b) => b.date.getTime() - a.date.getTime());
    return allTimesheets;
  } catch (error) {
    logger.error('Error getting all timesheets', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}
