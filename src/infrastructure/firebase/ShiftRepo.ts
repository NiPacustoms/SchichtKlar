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
import type { Shift } from '@/lib/types/shift';
import type { IShiftRepository } from '@/src/application/ports/IShiftRepository';

const COLLECTION_NAME = 'shifts';
const SHIFT_TYPE_VALUES: Shift['type'][] = [
  'Frühdienst',
  'Spätdienst',
  'Nachtdienst',
  'On-call',
];

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

function mapDocToShift(
  docId: string,
  data: Record<string, unknown>
): Shift {
  const rawType = data.type as string | undefined;
  const type: Shift['type'] =
    rawType && SHIFT_TYPE_VALUES.includes(rawType as Shift['type'])
      ? (rawType as Shift['type'])
      : 'Frühdienst';
  return {
    id: docId,
    facilityId: String(data.facilityId ?? ''),
    stationId: String(data.stationId ?? ''),
    date: toDate(data.date),
    startTime: String(data.startTime ?? ''),
    endTime: String(data.endTime ?? ''),
    type,
    requiredQualifications: Array.isArray(data.requiredQualifications)
      ? (data.requiredQualifications as string[])
      : [],
    maxStaff: Number(data.maxStaff) || 1,
    capacity: Number(data.capacity) || 1,
    assignedCount: Number(data.assignedCount) || 0,
    status: (data.status as Shift['status']) ?? 'open',
    companyId: data.companyId != null ? String(data.companyId) : undefined,
    tz: String(data.timezone ?? data.tz ?? 'Europe/Berlin'),
    createdBy: String(data.createdBy ?? ''),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export class ShiftRepo implements IShiftRepository {
  async getById(id: string): Promise<Shift | null> {
    const db = getDb();
    if (!db) return null;
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!snap.exists()) return null;
    return mapDocToShift(snap.id, snap.data() as Record<string, unknown>);
  }

  async listByFacilityId(
    facilityId: string,
    options?: { limit?: number; dateFrom?: Date; dateTo?: Date }
  ): Promise<Shift[]> {
    const db = getDb();
    if (!db) return [];
    const limitCount = options?.limit ?? 100;
    const constraints = [
      where('facilityId', '==', facilityId),
      orderBy('date', 'asc'),
      limit(limitCount),
    ];
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const snapshot = await getDocs(q);
    const result: Shift[] = [];
    snapshot.forEach((d) => {
      result.push(mapDocToShift(d.id, d.data() as Record<string, unknown>));
    });
    if (options?.dateFrom || options?.dateTo) {
      const from = options.dateFrom?.getTime();
      const to = options.dateTo?.getTime();
      return result.filter((s) => {
        const t = s.date.getTime();
        if (from != null && t < from) return false;
        if (to != null && t > to) return false;
        return true;
      });
    }
    return result;
  }
}
