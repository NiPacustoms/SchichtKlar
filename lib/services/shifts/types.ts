export interface Shift {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  facilityId: string;
  stationId?: string;
  companyId?: string;
  type?: string;
  requiredQualifications: string[];
  capacity: number;
  maxStaff: number;
  assignedCount?: number;
  status: 'open' | 'filled' | 'cancelled';
  assignedTo?: string[];
  notes?: string;
  timezone?: string;
  color?: string;
  shiftGroupId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftFilters {
  facilityId?: string;
  stationId?: string;
  status?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  dateFrom?: Date;
  dateTo?: Date;
  qualifications?: string[];
  companyId?: string;
}

export const COLLECTION_NAME = 'shifts';

export function safeToDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

const BERLIN_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Kalendertag (YYYY-MM-DD) in deutscher Zeit. Schichtdaten liegen als
 * Mitternacht Europe/Berlin vor (= 22:00/23:00 UTC am Vortag); toISOString()
 * würde deshalb den Vortag liefern.
 */
export function safeDateToISOString(value: unknown): string {
  const d = safeToDate(value);
  if (Number.isNaN(d.getTime())) return '';
  return BERLIN_DAY.format(d);
}
