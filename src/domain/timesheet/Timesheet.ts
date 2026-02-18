/**
 * Timesheet entity – pure domain model.
 * Uses lib/types/timesheet for compatibility.
 */
import type { Timesheet as ITimesheet } from '@/lib/types/timesheet';
import type { TimesheetStatus } from './TimesheetStatus';
import { isTimesheetTerminal, canEditTimesheet } from './TimesheetStatus';

export type { TimesheetStatus } from './TimesheetStatus';

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

export class Timesheet {
  readonly id: string;
  readonly userId: string;
  readonly companyId?: string;
  readonly date: Date;
  readonly startTime: string;
  readonly endTime: string;
  readonly breakMinutes: number;
  readonly totalHours: number;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly status: TimesheetStatus;
  readonly notes?: string;
  readonly facilityId?: string;
  readonly station?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly submittedAt?: Date;
  readonly approvedAt?: Date;
  readonly approvedBy?: string;
  readonly rejectionReason?: string;

  constructor(data: ITimesheet) {
    this.id = data.id;
    this.userId = data.userId;
    this.companyId = data.companyId;
    this.date = toDate(data.date);
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.breakMinutes = data.breakMinutes ?? 0;
    this.totalHours = data.totalHours ?? 0;
    this.startDate = toDate(data.startDate);
    this.endDate = toDate(data.endDate);
    this.status = (data.status as TimesheetStatus) ?? 'draft';
    this.notes = data.notes;
    this.facilityId = data.facilityId;
    this.station = data.station;
    this.createdAt = toDate(data.createdAt);
    this.updatedAt = toDate(data.updatedAt);
    this.submittedAt = data.submittedAt != null ? toDate(data.submittedAt) : undefined;
    this.approvedAt = data.approvedAt != null ? toDate(data.approvedAt) : undefined;
    this.approvedBy = data.approvedBy;
    this.rejectionReason = data.rejectionReason;
  }

  get isTerminal(): boolean {
    return isTimesheetTerminal(this.status);
  }

  get isEditable(): boolean {
    return canEditTimesheet(this.status);
  }

  toPlain(): ITimesheet {
    return {
      id: this.id,
      userId: this.userId,
      companyId: this.companyId,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      breakMinutes: this.breakMinutes,
      totalHours: this.totalHours,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
      notes: this.notes,
      facilityId: this.facilityId,
      station: this.station,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      submittedAt: this.submittedAt,
      approvedAt: this.approvedAt,
      approvedBy: this.approvedBy,
      rejectionReason: this.rejectionReason,
    };
  }
}
