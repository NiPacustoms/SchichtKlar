/**
 * Liest Wochenstunden-Limit und Live-Status eines Mitarbeiters.
 * aktuelleWochenstunden werden aus Timesheets (Mo–So) berechnet.
 */

import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { WeeklyLimit, WeeklyLimitGenehmigung } from '@/lib/types/weeklyLimit';
import { calculateWeeklyHours, getStartOfWeek } from '@/lib/services/timesheets/calculateWeeklyHours';
import { checkLimitStatus } from '@/lib/services/timesheets/checkLimitStatus';
import { logger } from '@/lib/logging';

const USERS_COLLECTION = 'users';

function parseLimitGenehmigungen(data: unknown): WeeklyLimitGenehmigung[] | undefined {
  if (!Array.isArray(data)) return undefined;
  return data
    .filter(
      (item): item is Record<string, unknown> =>
        item != null &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).adminId === 'string' &&
        typeof (item as Record<string, unknown>).neuesLimit === 'number'
    )
    .map(item => {
      const d = (item as { datum?: { toDate?: () => Date } }).datum;
      const datum =
        d && typeof d === 'object' && typeof (d as { toDate?: () => Date }).toDate === 'function'
          ? (d as { toDate: () => Date }).toDate()
          : new Date();
      return {
        adminId: item.adminId as string,
        neuesLimit: item.neuesLimit as number,
        datum,
      };
    });
}

/**
 * Liefert Wochenlimit-Status für einen Mitarbeiter (aktuelle Woche).
 * Nutzt Firebase users/{mitarbeiterId} für wochenstundenLimit und berechnet
 * aktuelleWochenstunden aus Timesheets.
 */
export async function readWeeklyLimit(mitarbeiterId: string): Promise<WeeklyLimit | null> {
  const db = getDb();
  if (!db) {
    logger.warn('Firebase not initialized, readWeeklyLimit returns null');
    return null;
  }
  try {
    const userRef = doc(db, USERS_COLLECTION, mitarbeiterId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const data = userSnap.data();
    const wochenstundenLimit = typeof data.wochenstundenLimit === 'number' ? data.wochenstundenLimit : 0;

    const startOfWeek = getStartOfWeek(new Date());
    const { wochenstunden } = await calculateWeeklyHours(mitarbeiterId, startOfWeek);
    const aktuelleWochenstunden = Math.round(wochenstunden * 100) / 100;

    const { status, ueberschreitung } = checkLimitStatus(wochenstundenLimit, aktuelleWochenstunden);
    const limitGenehmigungen = parseLimitGenehmigungen(data.limitGenehmigungen);

    return {
      mitarbeiterId,
      wochenstundenLimit,
      aktuelleWochenstunden,
      status,
      ueberschreitung,
      limitGenehmigungen,
    };
  } catch (error) {
    logger.error('readWeeklyLimit failed', error instanceof Error ? error : new Error(String(error)), {
      mitarbeiterId,
    });
    return null;
  }
}
