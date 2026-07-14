import { getDb } from '@/lib/firebase';
import { getDoc, getDocs, doc, collection, query, where } from 'firebase/firestore';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { COLLECTION_NAME } from './types';

export async function getAvailableSlots(shiftId: string): Promise<number> {
  const shiftDoc = await getDoc(doc(getDb(), COLLECTION_NAME, shiftId));
  if (!shiftDoc.exists()) return 0;
  const data = shiftDoc.data() as { capacity?: number; assignedCount?: number };
  const capacity = data.capacity || 1;
  const assignedCount = data.assignedCount || 0;
  return Math.max(0, capacity - assignedCount);
}

export async function getAssignedUsers(shiftId: string): Promise<string[]> {
  // Mandantenisolation: companyId-Filter ist unter den strikten Rules Pflicht.
  const companyId = await getCompanyIdFromAuth();
  if (!companyId) return [];
  const q = query(
    collection(getDb(), 'assignments'),
    where('companyId', '==', companyId),
    where('shiftId', '==', shiftId),
    where('status', 'in', ['assigned', 'accepted'])
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => (d.data() as { userId: string }).userId);
}
