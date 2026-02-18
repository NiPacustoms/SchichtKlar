import { db, getDb } from '@/lib/firebase';
import { ValidationError, ErrorCode, createAppError } from '@/lib/errors';
import { logger } from '@/lib/logging';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import type { TimesheetRangeResult } from './types';
import type { FirestoreTimesheetData } from './types';
import { COLLECTION_NAME } from './types';
import { mapDocToTimesheet } from './mapDoc';
import { detectTimesheetOverlaps, aggregateTimesheetsByUser } from './validation';

export async function getByDateRange(
  userId: string | undefined,
  startDate: Date,
  endDate: Date,
  approvedOnly = true
): Promise<TimesheetRangeResult> {
  let normalizedStart: Date | null = null;
  let normalizedEnd: Date | null = null;
  const normalizedUserId = typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined;
  const metadata: TimesheetRangeResult['metadata'] = {
    userId: normalizedUserId,
    startDate: new Date(),
    endDate: new Date(),
    approvedOnly,
  };
  try {
    if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
      throw new ValidationError(ErrorCode.VALIDATION_INVALID_FORMAT, 'Startdatum ist ungültig.', { additionalData: { startDate } }, { component: 'timesheetService.getByDateRange' });
    }
    if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
      throw new ValidationError(ErrorCode.VALIDATION_INVALID_FORMAT, 'Enddatum ist ungültig.', { additionalData: { endDate } }, { component: 'timesheetService.getByDateRange' });
    }
    normalizedStart = new Date(startDate);
    normalizedStart.setHours(0, 0, 0, 0);
    normalizedEnd = new Date(endDate);
    normalizedEnd.setHours(23, 59, 59, 999);
    if (normalizedStart > normalizedEnd) {
      throw new ValidationError(ErrorCode.VALIDATION_OUT_OF_RANGE, 'Startdatum darf nicht nach dem Enddatum liegen.', { additionalData: { startDate: normalizedStart, endDate: normalizedEnd } }, { component: 'timesheetService.getByDateRange' });
    }
    metadata.startDate = normalizedStart;
    metadata.endDate = normalizedEnd;
    if (!db) {
      logger.warn('Firebase not initialized, returning empty timesheet range result');
      return { timesheets: [], aggregates: [], metadata };
    }
    const constraints = [
      where('date', '>=', normalizedStart),
      where('date', '<=', normalizedEnd),
      orderBy('date', 'asc'),
    ];
    if (normalizedUserId) constraints.unshift(where('userId', '==', normalizedUserId));
    if (approvedOnly) constraints.push(where('status', '==', 'approved'));
    const snapshot = await getDocs(query(collection(getDb(), COLLECTION_NAME), ...constraints));
    const timesheets = snapshot.docs.map(d => mapDocToTimesheet({ id: d.id, data: () => d.data() as FirestoreTimesheetData }));
    const overlapConflicts = detectTimesheetOverlaps(timesheets);
    if (overlapConflicts.length > 0) {
      throw new ValidationError(ErrorCode.TIMESHEET_INVALID, overlapConflicts[0], {
        userId: normalizedUserId,
        additionalData: { conflicts: overlapConflicts, startDate: normalizedStart, endDate: normalizedEnd },
      }, { component: 'timesheetService.getByDateRange' });
    }
    const aggregates = aggregateTimesheetsByUser(timesheets);
    return { timesheets, aggregates, metadata };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    const appError = createAppError(error, ErrorCode.INTERNAL_ERROR, {
      userId: normalizedUserId,
      additionalData: { startDate: normalizedStart ?? startDate, endDate: normalizedEnd ?? endDate, approvedOnly },
    });
    appError.metadata.component = 'timesheetService.getByDateRange';
    throw appError;
  }
}
