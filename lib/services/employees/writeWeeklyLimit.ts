/**
 * Admin: Setzt das Wochenstunden-Limit für einen Mitarbeiter.
 * Optional: Genehmigung hinzufügen (neues Limit nach Antrag).
 */

import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { WeeklyLimitGenehmigung } from '@/lib/types/weeklyLimit';
import { calculateWeeklyHours, getStartOfWeek } from '@/lib/services/timesheets/calculateWeeklyHours';
import { checkLimitStatus } from '@/lib/services/timesheets/checkLimitStatus';
import { logger } from '@/lib/logging';

const USERS_COLLECTION = 'users';

const MIN_LIMIT = 20;
const MAX_LIMIT = 80;

/**
 * Setzt wochenstundenLimit auf users/{mitarbeiterId}.
 * Validiert 20–80h. Aktualisiert limitStatus aus aktueller Woche.
 */
export async function writeWeeklyLimit(mitarbeiterId: string, limit: number): Promise<void> {
  if (limit < MIN_LIMIT || limit > MAX_LIMIT) {
    throw new Error(`Wochenstunden-Limit muss zwischen ${MIN_LIMIT} und ${MAX_LIMIT} liegen.`);
  }
  const db = getDb();
  if (!db) {
    throw new Error('Firebase nicht initialisiert.');
  }
  const userRef = doc(db, USERS_COLLECTION, mitarbeiterId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('Mitarbeiter nicht gefunden.');
  }

  const startOfWeek = getStartOfWeek(new Date());
  const { wochenstunden } = await calculateWeeklyHours(mitarbeiterId, startOfWeek);
  const aktuelleWochenstunden = Math.round(wochenstunden * 100) / 100;
  const { status } = checkLimitStatus(limit, aktuelleWochenstunden);

  await updateDoc(userRef, {
    wochenstundenLimit: limit,
    aktuelleWochenstunden,
    limitStatus: status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fügt eine Genehmigung hinzu (Admin hat Limit-Erhöhung bestätigt) und setzt das neue Limit.
 */
export async function addLimitGenehmigung(
  mitarbeiterId: string,
  adminId: string,
  neuesLimit: number
): Promise<void> {
  if (neuesLimit < MIN_LIMIT || neuesLimit > MAX_LIMIT) {
    throw new Error(`Wochenstunden-Limit muss zwischen ${MIN_LIMIT} und ${MAX_LIMIT} liegen.`);
  }
  const db = getDb();
  if (!db) {
    throw new Error('Firebase nicht initialisiert.');
  }
  const userRef = doc(db, USERS_COLLECTION, mitarbeiterId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('Mitarbeiter nicht gefunden.');
  }

  const data = userSnap.data();
  const existing: WeeklyLimitGenehmigung[] = Array.isArray(data.limitGenehmigungen)
    ? (data.limitGenehmigungen as Array<{ adminId: string; neuesLimit: number; datum: unknown }>).map(
        g => ({
          adminId: g.adminId,
          neuesLimit: g.neuesLimit,
          datum: g.datum && typeof (g.datum as { toDate?: () => Date }).toDate === 'function' 
            ? (g.datum as { toDate: () => Date }).toDate() 
            : new Date(),
        })
      )
    : [];

  const newEntry: WeeklyLimitGenehmigung = {
    adminId,
    neuesLimit,
    datum: new Date(),
  };
  const limitGenehmigungen = [...existing, newEntry];

  const startOfWeek = getStartOfWeek(new Date());
  const { wochenstunden } = await calculateWeeklyHours(mitarbeiterId, startOfWeek);
  const aktuelleWochenstunden = Math.round(wochenstunden * 100) / 100;
  const { status } = checkLimitStatus(neuesLimit, aktuelleWochenstunden);

  await updateDoc(userRef, {
    wochenstundenLimit: neuesLimit,
    aktuelleWochenstunden,
    limitStatus: status,
    limitGenehmigungen,
    updatedAt: serverTimestamp(),
  });
  logger.info('Limit-Genehmigung gespeichert', { mitarbeiterId, adminId, neuesLimit });
}
