import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import type { Facility, Station } from '@/lib/types/facility';
import type { IFacilityRepository } from '@/src/application/ports/IFacilityRepository';

const COLLECTION_NAME = 'facilities';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (
    value != null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function mapDocToFacility(
  docId: string,
  data: Record<string, unknown>
): Facility {
  const stations = (data.stations as Station[] | undefined) ?? [];
  return {
    id: docId,
    companyId: data.companyId != null ? String(data.companyId) : undefined,
    name: String(data.name ?? ''),
    address: String(data.address ?? ''),
    contactPerson: String(data.contactPerson ?? ''),
    phone: String(data.phone ?? ''),
    email: String(data.email ?? ''),
    stations,
    colorCode: String(data.colorCode ?? '#005f73'),
    debtorNumber: String(data.debtorNumber ?? ''),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export class FacilityRepo implements IFacilityRepository {
  async getById(id: string): Promise<Facility | null> {
    const db = getDb();
    if (!db) return null;
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!snap.exists()) return null;
    return mapDocToFacility(snap.id, snap.data() as Record<string, unknown>);
  }

  async listByCompanyId(
    companyId: string,
    options?: { limit?: number }
  ): Promise<Facility[]> {
    const db = getDb();
    if (!db) return [];
    const limitCount = options?.limit ?? 100;
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      orderBy('name', 'asc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const result: Facility[] = [];
    snapshot.forEach((d) => {
      result.push(mapDocToFacility(d.id, d.data() as Record<string, unknown>));
    });
    return result;
  }
}
