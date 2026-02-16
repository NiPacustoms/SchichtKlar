import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import { facilityService } from '@/lib/services/facilities';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import type { Timesheet } from '@/lib/types';
import { AppError, ErrorCode } from '@/lib/errors';

const SHIFT_COLLECTION = 'shifts';
const TIMESHEET_COLLECTION = 'timesheets';
const DEFAULT_TIMESHEET_STATUSES: Array<Timesheet['status']> = ['submitted', 'approved'];

export interface FacilityHoursSummaryRange {
  startDate: Date;
  endDate: Date;
}

export interface FacilityHoursSummary {
  facilityId: string;
  facilityName: string;
  plannedHours: number;
  workedHours: number;
  missingEntries: number;
  shiftCount: number;
  timesheetCount: number;
  pendingTimesheets: number;
  range: FacilityHoursSummaryRange;
  incompleteData?: boolean;
}

export interface FacilityHoursSummaryRequest {
  facilityId?: string;
  startDate?: Date;
  endDate?: Date;
  timesheetStatuses?: Array<Timesheet['status']>;
}

function normalizeDateRange(start?: Date, end?: Date): FacilityHoursSummaryRange {
  const now = new Date();
  const mondayOffset = ((now.getDay() + 6) % 7);
  const defaultStart = new Date(now);
  defaultStart.setDate(now.getDate() - mondayOffset);
  defaultStart.setHours(0, 0, 0, 0);

  const defaultEnd = new Date(defaultStart);
  defaultEnd.setDate(defaultStart.getDate() + 6);
  defaultEnd.setHours(23, 59, 59, 999);

  const normalizedStart = start ? new Date(start) : defaultStart;
  normalizedStart.setHours(0, 0, 0, 0);
  const normalizedEnd = end ? new Date(end) : defaultEnd;
  normalizedEnd.setHours(23, 59, 59, 999);

  if (normalizedStart > normalizedEnd) {
    const tmp = new Date(normalizedStart);
    normalizedStart.setTime(normalizedEnd.getTime());
    normalizedEnd.setTime(tmp.getTime());
  }

  return { startDate: normalizedStart, endDate: normalizedEnd };
}

function calculateShiftDurationHours(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) {
    return 0;
  }

  const [startHour, startMinute] = startTime.split(':').map(v => Number.parseInt(v, 10));
  const [endHour, endMinute] = endTime.split(':').map(v => Number.parseInt(v, 10));

  if ([startHour, startMinute, endHour, endMinute].some(value => Number.isNaN(value))) {
    return 0;
  }

  let diffMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  if (diffMinutes <= 0) {
    diffMinutes += 24 * 60;
  }
  return diffMinutes / 60;
}

function roundHours(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isPermissionDeniedError(error: unknown): boolean {
  if (!error) return false;

  if (typeof error === 'object' && 'code' in (error as Record<string, unknown>)) {
    const code = (error as { code?: string }).code;
    if (code === 'permission-denied') {
      return true;
    }
  }

  if (error instanceof AppError) {
    if (error.code === ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS) {
      return true;
    }
    if (typeof error.message === 'string' && error.message.toLowerCase().includes('missing or insufficient permissions')) {
      return true;
    }
  }

  if (error instanceof Error) {
    return error.message?.toLowerCase().includes('missing or insufficient permissions') ?? false;
  }

  return false;
}

function isMissingIndexError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const hasCode = (error as { code?: string }).code;
  const message = (error as { message?: string }).message ?? (error instanceof Error ? error.message : '');
  const normalizedMessage = message?.toLowerCase() || '';

  if (hasCode === 'failed-precondition' && normalizedMessage.includes('index')) {
    return true;
  }

  if (normalizedMessage.includes('the query requires an index')) {
    return true;
  }

  return false;
}

async function collectPlannedHours(
  facilityId: string,
  companyId: string,
  startDate: Date,
  endDate: Date,
) {
  if (!companyId) {
    logger.warn('[facilityHours] Missing companyId for planned hours query', undefined, { facilityId });
    return {
      plannedHours: 0,
      shiftCount: 0,
    };
  }

  const db = getDb();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const q = query(
    collection(db, SHIFT_COLLECTION),
    where('facilityId', '==', facilityId),
    where('companyId', '==', companyId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  );

  const snapshot = await getDocs(q);
  let plannedHours = 0;
  let shiftCount = 0;

  snapshot.forEach(docSnap => {
    const data = docSnap.data() as {
      startTime?: string;
      endTime?: string;
      durationMinutes?: number;
      assignedCount?: number;
      capacity?: number;
      maxStaff?: number;
    };
    shiftCount += 1;

    if (typeof data.durationMinutes === 'number' && data.durationMinutes > 0) {
      const participants = Math.max(
        Number.isFinite(data.assignedCount ?? 0) ? (data.assignedCount ?? 0) : 0,
        Number.isFinite(data.capacity ?? 0) ? (data.capacity ?? 0) : 0,
        Number.isFinite(data.maxStaff ?? 0) ? (data.maxStaff ?? 0) : 0,
        1,
      );
      plannedHours += (data.durationMinutes / 60) * participants;
      return;
    }

    const duration = calculateShiftDurationHours(data.startTime, data.endTime);
    const participants = Math.max(
      data.assignedCount ?? 0,
      data.capacity ?? 0,
      data.maxStaff ?? 0,
      1,
    );
    plannedHours += duration * participants;
  });

  return {
    plannedHours,
    shiftCount,
  };
}

async function collectWorkedHours(
  facilityId: string,
  companyId: string,
  startDate: Date,
  endDate: Date,
  allowedStatuses: Array<Timesheet['status']>,
) {
  if (!companyId) {
    logger.warn('[facilityHours] Missing companyId for worked hours query', undefined, { facilityId });
    return {
      workedHours: 0,
      timesheetCount: 0,
      pendingCount: 0,
    };
  }

  const db = getDb();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const q = query(
    collection(db, TIMESHEET_COLLECTION),
    where('facilityId', '==', facilityId),
    where('companyId', '==', companyId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  );

  const snapshot = await getDocs(q);
  let workedHours = 0;
  let approvedOrSubmittedCount = 0;
  let pendingCount = 0;

  snapshot.forEach(docSnap => {
    const data = docSnap.data() as {
      totalHours?: number;
      startTime?: string;
      endTime?: string;
      status?: Timesheet['status'];
    };
    if (data.status && allowedStatuses.includes(data.status)) {
      const hours = typeof data.totalHours === 'number' && Number.isFinite(data.totalHours)
        ? data.totalHours
        : calculateShiftDurationHours(data.startTime, data.endTime);
      workedHours += hours;
      approvedOrSubmittedCount += 1;
    } else {
      pendingCount += 1;
    }
  });

  return {
    workedHours,
    timesheetCount: approvedOrSubmittedCount,
    pendingCount,
  };
}

export const facilityHoursService = {
  async getSummary({
    facilityId,
    startDate,
    endDate,
    timesheetStatuses,
  }: FacilityHoursSummaryRequest = {}): Promise<FacilityHoursSummary[]> {
    const db = getDb();
    if (!db) {
      logger.warn('[facilityHours] Firestore not initialized, returning empty summary');
      return [];
    }

    const companyId = await getCompanyIdFromAuth();
    if (!companyId) {
      logger.warn('[facilityHours] No companyId available, aborting');
      return [];
    }

    const range = normalizeDateRange(startDate, endDate);
    const allowedStatuses = timesheetStatuses && timesheetStatuses.length > 0
      ? timesheetStatuses
      : DEFAULT_TIMESHEET_STATUSES;

    const facilities = await facilityService.getAll(companyId);
    const filteredFacilities = facilityId
      ? facilities.filter(f => f.id === facilityId)
      : facilities;

    if (filteredFacilities.length === 0) {
      return [];
    }

    const summaries = await Promise.all(
      filteredFacilities.map(async facility => {
        try {
          if (!facility.companyId) {
            logger.warn('[facilityHours] Facility without companyId skipped', undefined, { facilityId: facility.id });
            return null;
          }
          const [planned, worked] = await Promise.all([
            collectPlannedHours(facility.id, facility.companyId, range.startDate, range.endDate),
            collectWorkedHours(facility.id, facility.companyId, range.startDate, range.endDate, allowedStatuses),
          ]);

          const missingEntries = Math.max(planned.shiftCount - worked.timesheetCount, 0);

          return {
            facilityId: facility.id,
            facilityName: facility.name,
            plannedHours: roundHours(planned.plannedHours),
            workedHours: roundHours(worked.workedHours),
            missingEntries,
            shiftCount: planned.shiftCount,
            timesheetCount: worked.timesheetCount,
            pendingTimesheets: worked.pendingCount,
            range,
          } as FacilityHoursSummary;
        } catch (error) {
          if (isPermissionDeniedError(error)) {
            logger.warn(
              '[facilityHours] Permission denied while reading facility data, falling back to empty summary',
              { action: 'facilityHours.getSummary' },
              {
                facilityId: facility.id,
                error: error instanceof Error ? error.message : String(error),
              },
            );
            return {
              facilityId: facility.id,
              facilityName: facility.name,
              plannedHours: 0,
              workedHours: 0,
              missingEntries: 0,
              shiftCount: 0,
              timesheetCount: 0,
              pendingTimesheets: 0,
              range,
              incompleteData: true,
            } satisfies FacilityHoursSummary;
          }

          if (isMissingIndexError(error)) {
            const message = error instanceof Error ? error.message : 'Firestore index fehlt';
            const appError = new AppError(
              ErrorCode.FIREBASE_MISSING_INDEX,
              message,
              undefined,
              {
                route: 'facilityHours',
                additionalData: {
                  facilityId: facility.id,
                },
              },
              {
                originalError: error instanceof Error ? error : undefined,
              },
            );
            logger.error(
              '[facilityHours] Missing Firestore index for facility summary',
              appError,
              { action: 'facilityHours.getSummary' },
              { facilityId: facility.id },
            );
            throw appError;
          }

          logger.error(
            '[facilityHours] Failed to build summary for facility',
            error instanceof Error ? error : new Error(String(error)),
            {},
            { facilityId: facility.id },
          );
          throw error instanceof Error ? error : new Error(String(error));
        }
      }),
    );

    return summaries
      .filter((summary): summary is FacilityHoursSummary => summary !== null)
      .sort((a, b) => a.facilityName.localeCompare(b.facilityName, 'de', { sensitivity: 'base' }));
  },
};

