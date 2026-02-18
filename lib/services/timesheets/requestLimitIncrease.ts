/**
 * Pflegekraft: Antrag auf Erhöhung des Wochenstunden-Limits.
 * Erstellt einen Eintrag für Admin (z. B. Subcollection oder Anforderung).
 * Die eigentliche Erhöhung erfolgt durch Admin über writeWeeklyLimit/addLimitGenehmigung.
 */

import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { logger } from '@/lib/logging';

/** Collection für Limit-Erhöhungsanträge (Admin sieht sie im Dashboard) */
export const LIMIT_REQUESTS_COLLECTION = 'limitIncreaseRequests';

export interface LimitIncreaseRequest {
  mitarbeiterId: string;
  requestedLimit: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  decidedAt?: Date;
  decidedBy?: string;
}

/**
 * Erstellt einen Antrag auf Limit-Erhöhung.
 * Admin bearbeitet über addLimitGenehmigung bzw. eigene UI.
 */
export async function requestLimitIncrease(
  mitarbeiterId: string,
  requestedLimit: number,
  reason?: string
): Promise<string> {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase nicht initialisiert.');
  }
  if (requestedLimit < 20 || requestedLimit > 80) {
    throw new Error('Gewünschtes Limit muss zwischen 20 und 80 Stunden liegen.');
  }

  const ref = await addDoc(collection(db, LIMIT_REQUESTS_COLLECTION), {
    mitarbeiterId,
    requestedLimit,
    reason: reason ?? null,
    status: 'pending',
    createdAt: serverTimestamp(),
    decidedAt: null,
    decidedBy: null,
  });
  logger.info('Limit-Erhöhung beantragt', { mitarbeiterId, requestedLimit, id: ref.id });
  return ref.id;
}

/**
 * Prüft, ob für den Mitarbeiter bereits ein offener Antrag existiert.
 */
export async function hasPendingLimitRequest(mitarbeiterId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const q = query(
    collection(db, LIMIT_REQUESTS_COLLECTION),
    where('mitarbeiterId', '==', mitarbeiterId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
