import { getDb, auth } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import type { Timesheet } from './types';
import type { FirestoreTimesheetData } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToTimesheet } from './mapDoc';

export async function getTimesheetsByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Timesheet[]> {
  try {
    const db = getDb();
    if (!db) {
      logger.warn('Firebase not initialized, returning empty array');
      return [];
    }
    let isAdmin = false;
    let companyId: string | null = null;
    if (typeof window !== 'undefined' && auth?.currentUser) {
      try {
        const tokenResult = await auth.currentUser.getIdTokenResult(false);
        isAdmin = (tokenResult.claims.role as string) === 'admin';
        companyId = (tokenResult.claims.companyId as string) || null;
      } catch (tokenError) {
        logger.warn('Failed to get token claims for timesheet query: ' + (tokenError instanceof Error ? tokenError.message : String(tokenError)));
      }
    }
    let q;
    if (userId) {
      if (isAdmin && companyId) {
        q = query(
          collection(db, COLLECTION_NAME),
          where('userId', '==', userId),
          where('companyId', '==', companyId),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );
      } else {
        q = query(
          collection(db, COLLECTION_NAME),
          where('userId', '==', userId),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );
      }
    } else {
      if (isAdmin && companyId) {
        q = query(
          collection(db, COLLECTION_NAME),
          where('companyId', '==', companyId),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );
      } else if (typeof window !== 'undefined' && auth?.currentUser) {
        q = query(
          collection(db, COLLECTION_NAME),
          where('userId', '==', auth.currentUser.uid),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );
      } else {
        logger.warn('No authenticated user for timesheet query, returning empty array');
        return [];
      }
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapDocToTimesheet({ id: d.id, data: () => d.data() as FirestoreTimesheetData }));
  } catch (error) {
    logger.error('Error fetching timesheets by date range', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
