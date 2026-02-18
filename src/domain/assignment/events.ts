import type { AssignmentStatus } from './AssignmentStatus';

/**
 * Domain event: assignment status changed.
 * Emitted when an assignment transitions to a new status.
 */
export interface AssignmentStatusChangedEvent {
  type: 'AssignmentStatusChanged';
  assignmentId: string;
  userId: string;
  shiftId: string;
  companyId?: string;
  previousStatus: AssignmentStatus;
  newStatus: AssignmentStatus;
  occurredAt: Date;
  metadata?: Record<string, unknown>;
}

export function createAssignmentStatusChangedEvent(
  assignmentId: string,
  userId: string,
  shiftId: string,
  previousStatus: AssignmentStatus,
  newStatus: AssignmentStatus,
  companyId?: string,
  metadata?: Record<string, unknown>
): AssignmentStatusChangedEvent {
  return {
    type: 'AssignmentStatusChanged',
    assignmentId,
    userId,
    shiftId,
    companyId,
    previousStatus,
    newStatus,
    occurredAt: new Date(),
    metadata,
  };
}

export type AssignmentDomainEvent = AssignmentStatusChangedEvent;
