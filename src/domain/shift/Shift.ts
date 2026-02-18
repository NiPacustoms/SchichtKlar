/**
 * Shift entity – pure domain model.
 * Uses lib/types/shift for compatibility; service may use extended shape (title, date string).
 */
import type { Shift as IShift } from '@/lib/types/shift';
import type { ShiftStatus } from './ShiftStatus';
import { isShiftOpen, isShiftTerminal } from './ShiftStatus';

export type { ShiftStatus } from './ShiftStatus';

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

export class Shift {
  readonly id: string;
  readonly facilityId: string;
  readonly stationId: string;
  readonly date: Date;
  readonly startTime: string;
  readonly endTime: string;
  readonly type: IShift['type'];
  readonly requiredQualifications: string[];
  readonly maxStaff: number;
  readonly status: ShiftStatus;
  readonly capacity: number;
  readonly assignedCount: number;
  readonly companyId?: string;
  readonly tz?: string;
  readonly createdBy?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: IShift) {
    this.id = data.id;
    this.facilityId = data.facilityId;
    this.stationId = data.stationId ?? '';
    this.date = data.date instanceof Date ? data.date : new Date(data.date);
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.type = data.type ?? 'Frühdienst';
    this.requiredQualifications = data.requiredQualifications ?? [];
    this.maxStaff = data.maxStaff ?? 1;
    this.status = (data.status as ShiftStatus) ?? 'open';
    this.capacity = data.capacity ?? 1;
    this.assignedCount = data.assignedCount ?? 0;
    this.companyId = data.companyId;
    this.tz = data.tz;
    this.createdBy = data.createdBy;
    this.createdAt = toDate(data.createdAt);
    this.updatedAt = toDate(data.updatedAt);
  }

  get isOpen(): boolean {
    return isShiftOpen(this.status);
  }

  get isTerminal(): boolean {
    return isShiftTerminal(this.status);
  }

  get hasCapacity(): boolean {
    return this.assignedCount < this.capacity && this.isOpen;
  }

  toPlain(): IShift {
    return {
      id: this.id,
      facilityId: this.facilityId,
      stationId: this.stationId,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      type: this.type,
      requiredQualifications: this.requiredQualifications,
      maxStaff: this.maxStaff,
      status: this.status,
      capacity: this.capacity,
      assignedCount: this.assignedCount,
      companyId: this.companyId,
      tz: this.tz ?? 'Europe/Berlin',
      createdBy: this.createdBy ?? '',
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
