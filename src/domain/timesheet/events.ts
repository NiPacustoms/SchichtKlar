import type { TimesheetStatus } from './TimesheetStatus';

/**
 * Domain event: timesheet status changed.
 */
export interface TimesheetStatusChangedEvent {
  type: 'TimesheetStatusChanged';
  timesheetId: string;
  userId: string;
  companyId?: string;
  previousStatus: TimesheetStatus;
  newStatus: TimesheetStatus;
  occurredAt: Date;
  metadata?: Record<string, unknown>;
}

export function createTimesheetStatusChangedEvent(
  timesheetId: string,
  userId: string,
  previousStatus: TimesheetStatus,
  newStatus: TimesheetStatus,
  companyId?: string,
  metadata?: Record<string, unknown>
): TimesheetStatusChangedEvent {
  return {
    type: 'TimesheetStatusChanged',
    timesheetId,
    userId,
    companyId,
    previousStatus,
    newStatus,
    occurredAt: new Date(),
    metadata,
  };
}

export type TimesheetDomainEvent = TimesheetStatusChangedEvent;
