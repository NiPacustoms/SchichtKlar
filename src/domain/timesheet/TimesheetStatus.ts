/**
 * Timesheet status – single source of truth for domain.
 * Aligned with lib/types/timesheet.
 */
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export const TIMESHEET_STATUS_VALUES: TimesheetStatus[] = [
  'draft',
  'submitted',
  'approved',
  'rejected',
];

export function isTimesheetTerminal(status: TimesheetStatus): boolean {
  return status === 'approved' || status === 'rejected';
}

export function canEditTimesheet(status: TimesheetStatus): boolean {
  return status === 'draft';
}
