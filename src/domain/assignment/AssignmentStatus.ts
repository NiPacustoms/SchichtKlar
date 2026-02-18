/**
 * Assignment status – single source of truth for domain.
 * Aligned with lib/types/assignment.ts for compatibility.
 */
export type AssignmentStatus =
  | 'requested'
  | 'accepted'
  | 'declined'
  | 'assigned'
  | 'completed'
  | 'pending-signature'
  | 'pending'
  | 'done'
  | 'published';

export const ASSIGNMENT_STATUS_VALUES: AssignmentStatus[] = [
  'requested',
  'accepted',
  'declined',
  'assigned',
  'completed',
  'pending-signature',
  'pending',
  'done',
  'published',
];

export function isTerminalStatus(status: AssignmentStatus): boolean {
  return ['declined', 'completed', 'done'].includes(status);
}

export function canTransitionTo(
  from: AssignmentStatus,
  to: AssignmentStatus
): boolean {
  if (from === to) return false;
  if (isTerminalStatus(from)) return false;
  const allowed: Partial<Record<AssignmentStatus, AssignmentStatus[]>> = {
    published: ['accepted', 'declined', 'assigned', 'pending', 'pending-signature'],
    requested: ['accepted', 'declined', 'assigned'],
    pending: ['accepted', 'declined', 'assigned', 'done', 'pending-signature'],
    'pending-signature': ['accepted', 'declined', 'assigned', 'done'],
    accepted: ['assigned', 'declined', 'completed'],
    assigned: ['completed', 'declined'],
  };
  const next = allowed[from];
  return next ? next.includes(to) : false;
}
