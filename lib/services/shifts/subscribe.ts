import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { Shift, ShiftFilters } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToShift } from './mapDoc';

export function subscribeAll(
  filters: ShiftFilters | undefined,
  onUpdate: (shifts: Shift[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const db = getDb();
  if (!db) return () => void 0;
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
    // Mandantenisolation: companyId-Filter ist unter den strikten Firestore-Rules
    // Pflicht – ohne ihn lehnt Firestore die shifts-Query ab.
    if (filters?.companyId) q = query(q, where('companyId', '==', filters.companyId));
    if (filters?.facilityId) q = query(q, where('facilityId', '==', filters.facilityId));
    if (filters?.status) q = query(q, where('status', '==', filters.status));
    if (filters?.type) q = query(q, where('type', '==', filters.type));
    if (filters?.dateFrom) q = query(q, where('date', '>=', filters.dateFrom));
    if (filters?.dateTo) q = query(q, where('date', '<=', filters.dateTo));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const shifts = snapshot.docs.map(d => mapDocToShift(d.id, d.data() as Record<string, unknown>));
        onUpdate(shifts);
      },
      (err) => onError?.(err)
    );
    return unsubscribe;
  } catch (error) {
    onError?.(error);
    return () => void 0;
  }
}
