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

/** Aktive Einsätze der Person mit aufgelöstem Einsatztag (startDate oder Datum der Schicht). */
async function loadActiveWithDay(userId: string): Promise<Array<{ assignment: Assignment; day: Date }>> {
  const db = getDb();
  if (!db) return [];
  const companyId = await getCompanyIdFromAuth();
  if (!companyId) return [];
  const snap = await getDocs(
    query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      where('userId', '==', userId),
      where('status', 'in', ['assigned', 'accepted', 'pending', 'pending-signature']),
      limit(300)
    )
  );
  const toDate = (v: unknown): Date | null => {
    if (!v) return null;
    if (v instanceof Date) return v;
    const t = (v as { toDate?: () => Date }).toDate?.();
    if (t) return t;
    const d = new Date(v as string);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const shiftDays = new Map<string, Date | null>();
  const raw = snap.docs.map(d => ({ d, data: d.data() as Record<string, unknown> }));
  await Promise.all(
    [...new Set(raw.filter(r => !r.data.startDate && r.data.shiftId).map(r => r.data.shiftId as string))].map(async id => {
      try {
        const sd = await getDoc(doc(db, 'shifts', id));
        shiftDays.set(id, sd.exists() ? toDate(sd.data().date) : null);
      } catch {
        shiftDays.set(id, null);
      }
    })
  );
  const out: Array<{ assignment: Assignment; day: Date }> = [];
  for (const { d, data } of raw) {
    const day = toDate(data.startDate) ?? (data.shiftId ? shiftDays.get(data.shiftId as string) ?? null : null);
    if (!day) continue;
    out.push({ assignment: mapDocToAssignment({ id: d.id, data: () => data }), day });
  }
  return out.sort((a, b) => a.day.getTime() - b.day.getTime() || String(a.assignment.startTime ?? '').localeCompare(String(b.assignment.startTime ?? '')));
}

/** Einsatz von heute (nach Einsatztag, nicht nach Zuweisungsdatum). */
export async function getTodayAssignment(userId: string): Promise<Assignment | null> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const list = (await loadActiveWithDay(userId)).filter(x => x.day >= today && x.day < tomorrow);
    const confirmed = list.find(x => x.assignment.status === 'accepted' || x.assignment.status === 'assigned');
    return (confirmed ?? list[0])?.assignment ?? null;
  } catch (error) {
    logger.error('Error fetching today assignment', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/** Die nächsten Einsätze ab morgen, chronologisch. */
export async function getUpcomingAssignments(userId: string): Promise<Assignment[]> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return (await loadActiveWithDay(userId))
      .filter(x => x.day >= tomorrow)
      .slice(0, 5)
      .map(x => x.assignment);
  } catch (error) {
    logger.error('Error fetching upcoming assignments', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
