/**
 * Ermittelt Wochenlimit-Status (normal | warning | blocked) aus Limit und aktuellen Stunden.
 */

import type { WeeklyLimitStatus } from '@/lib/types/weeklyLimit';

const WARNING_THRESHOLD_PERCENT = 90;

export interface LimitStatusResult {
  status: WeeklyLimitStatus;
  ueberschreitung: number;
}

/**
 * status: blocked wenn über Limit, warning wenn >= 90% des Limits, sonst normal.
 * ueberschreitung: wie viele Stunden über dem Limit (0 wenn unter/gleich).
 */
export function checkLimitStatus(
  wochenstundenLimit: number,
  aktuelleWochenstunden: number
): LimitStatusResult {
  if (wochenstundenLimit <= 0) {
    return { status: 'normal', ueberschreitung: 0 };
  }
  const ueberschreitung = Math.max(0, Math.round((aktuelleWochenstunden - wochenstundenLimit) * 100) / 100);
  if (ueberschreitung > 0) {
    return { status: 'blocked', ueberschreitung };
  }
  const percent = (aktuelleWochenstunden / wochenstundenLimit) * 100;
  const status: WeeklyLimitStatus = percent >= WARNING_THRESHOLD_PERCENT ? 'warning' : 'normal';
  return { status, ueberschreitung: 0 };
}
