import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import { doc, getDoc } from 'firebase/firestore';
import type { Shift } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToShift } from './mapDoc';

export async function getById(id: string): Promise<Shift | null> {
  const db = getDb();
  if (!db) {
    logger.warn('Firebase not initialized, returning null');
    return null;
  }
  try {
    const shiftDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!shiftDoc.exists()) return null;
    const data = shiftDoc.data() as Record<string, unknown>;
    return mapDocToShift(shiftDoc.id, data);
  } catch (error) {
    throw error;
  }
}
