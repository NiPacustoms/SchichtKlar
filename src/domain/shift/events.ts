import type { ShiftStatus } from './ShiftStatus';

/**
 * Domain event: shift status changed.
 */
export interface ShiftStatusChangedEvent {
  type: 'ShiftStatusChanged';
  shiftId: string;
  facilityId: string;
  companyId?: string;
  previousStatus: ShiftStatus;
  newStatus: ShiftStatus;
  occurredAt: Date;
  metadata?: Record<string, unknown>;
}

export function createShiftStatusChangedEvent(
  shiftId: string,
  facilityId: string,
  previousStatus: ShiftStatus,
  newStatus: ShiftStatus,
  companyId?: string,
  metadata?: Record<string, unknown>
): ShiftStatusChangedEvent {
  return {
    type: 'ShiftStatusChanged',
    shiftId,
    facilityId,
    companyId,
    previousStatus,
    newStatus,
    occurredAt: new Date(),
    metadata,
  };
}

export type ShiftDomainEvent = ShiftStatusChangedEvent;
