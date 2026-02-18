import { safeToDate, safeDateToISOString } from './types';

export function timeToMs(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours * 60 + minutes) * 60 * 1000;
}

export function checkTimeOverlap(
  shift1: { startTime: string; endTime: string; date?: string },
  shift2: { startTime: string; endTime: string; date?: string }
): boolean {
  const base1 = new Date(shift1.date || '').getTime();
  const base2 = new Date(shift2.date || '').getTime();
  const start1 = base1 + timeToMs(shift1.startTime);
  const end1 = base1 + timeToMs(shift1.endTime);
  const start2 = base2 + timeToMs(shift2.startTime);
  const end2 = base2 + timeToMs(shift2.endTime);
  return start1 < end2 && start2 < end1;
}

export { safeToDate, safeDateToISOString };
