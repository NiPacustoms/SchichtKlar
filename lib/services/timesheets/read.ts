import { db, getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import { getDoc, getDocs, doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Timesheet } from './types';
import type { FirestoreTimesheetData } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToTimesheet } from './mapDoc';

export async function getById(id: string): Promise<Timesheet | null> {
  if (!db) {
    logger.warn('Firebase not initialized, returning null');
    return null;
  }
  try {
    const firestoreDb = getDb();
    const timesheetDoc = await getDoc(doc(firestoreDb, COLLECTION_NAME, id));
    if (!timesheetDoc.exists()) return null;
    const data = timesheetDoc.data() as FirestoreTimesheetData;
    return mapDocToTimesheet({ id: timesheetDoc.id, data: () => data });
  } catch (error) {
    logger.error('Error getting timesheet by ID', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

export async function getByUserId(userId: string, limitCount = 50): Promise<Timesheet[]> {
  if (!db) {
    logger.warn('Firebase not initialized, returning empty array');
    return [];
  }
  try {
    const q = query(
      collection(getDb(), COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d =>
      mapDocToTimesheet({ id: d.id, data: () => d.data() as FirestoreTimesheetData })
    );
  } catch (error) {
    throw error;
  }
}

export async function getByDate(userId: string, date: Date): Promise<Timesheet | null> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const q = query(
      collection(getDb(), COLLECTION_NAME),
      where('userId', '==', userId),
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return mapDocToTimesheet({ id: docSnap.id, data: () => docSnap.data() as FirestoreTimesheetData });
  } catch (error) {
    logger.error('Error getting timesheet by date', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

export async function getByUserAndDateRange(userId: string, start: Date, end: Date): Promise<Timesheet[]> {
  const q = query(
    collection(getDb(), COLLECTION_NAME),
    where('userId', '==', userId),
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d =>
    mapDocToTimesheet({ id: d.id, data: () => d.data() as FirestoreTimesheetData })
  );
}

export async function getTodayTimesheet(userId: string): Promise<Timesheet | null> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const q = query(
      collection(getDb(), COLLECTION_NAME),
      where('userId', '==', userId),
      where('date', '>=', today),
      where('date', '<', tomorrow),
      orderBy('date', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return mapDocToTimesheet(snapshot.docs[0]);
  } catch (error) {
    logger.error('Error fetching today timesheet', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export async function getRecentTimesheets(userId: string, days = 7): Promise<Timesheet[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const q = query(
      collection(getDb(), COLLECTION_NAME),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      orderBy('date', 'desc'),
      limit(days)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d =>
      mapDocToTimesheet({ id: d.id, data: () => d.data() as FirestoreTimesheetData })
    );
  } catch (error) {
    logger.error('Error fetching recent timesheets', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
