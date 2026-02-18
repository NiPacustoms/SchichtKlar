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
import type { Timesheet } from '@/lib/types/timesheet';
import type { ITimesheetRepository } from '@/src/application/ports/ITimesheetRepository';

const COLLECTION_NAME = 'timesheets';

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

function mapDocToTimesheet(
  docId: string,
  data: Record<string, unknown>
): Timesheet {
  const dateVal = data.date ?? data.startDate;
  const date = toDate(dateVal);
  const endDateVal = data.endDate ?? dateVal;
  return {
    id: docId,
    userId: String(data.userId ?? ''),
    companyId: data.companyId != null ? String(data.companyId) : undefined,
    date,
    startTime: String(data.startTime ?? ''),
    endTime: String(data.endTime ?? ''),
    breakMinutes: Number(data.breakMinutes) || 0,
    totalHours: Number(data.totalHours) || 0,
    startDate: toDate(data.startDate ?? dateVal),
    endDate: toDate(endDateVal),
    status: (data.status as Timesheet['status']) ?? 'draft',
    notes: data.notes != null ? String(data.notes) : undefined,
    facilityId: data.facilityId != null ? String(data.facilityId) : undefined,
    station: data.station != null ? String(data.station) : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    submittedAt: data.submittedAt != null ? toDate(data.submittedAt) : undefined,
    approvedAt: data.approvedAt != null ? toDate(data.approvedAt) : undefined,
    approvedBy: data.approvedBy != null ? String(data.approvedBy) : undefined,
    rejectionReason:
      data.rejectionReason != null ? String(data.rejectionReason) : undefined,
  };
}

export class TimesheetRepo implements ITimesheetRepository {
  async getById(id: string): Promise<Timesheet | null> {
    const db = getDb();
    if (!db) return null;
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!snap.exists()) return null;
    return mapDocToTimesheet(snap.id, snap.data() as Record<string, unknown>);
  }

  async listByUserId(
    userId: string,
    options?: { limit?: number }
  ): Promise<Timesheet[]> {
    const db = getDb();
    if (!db) return [];
    const limitCount = options?.limit ?? 50;
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const result: Timesheet[] = [];
    snapshot.forEach((d) => {
      result.push(mapDocToTimesheet(d.id, d.data() as Record<string, unknown>));
    });
    return result;
  }
}
