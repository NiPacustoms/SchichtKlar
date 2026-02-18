/**
 * Shift status – single source of truth for domain.
 * Aligned with lib/types/shift and lib/services/shifts.
 */
export type ShiftStatus = 'open' | 'filled' | 'cancelled';

export const SHIFT_STATUS_VALUES: ShiftStatus[] = ['open', 'filled', 'cancelled'];

export function isShiftOpen(status: ShiftStatus): boolean {
  return status === 'open';
}

export function isShiftTerminal(status: ShiftStatus): boolean {
  return status === 'cancelled';
}
