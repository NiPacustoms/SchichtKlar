import type { Timesheet, TimesheetAggregation } from './types';
import { DEFAULT_DECIMALS } from './types';

export function roundToDecimals(value: number, decimals: number = DEFAULT_DECIMALS): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ensureValidDate(value: Date | null | undefined): Date | null {
  if (!value) return null;
  const time = value.getTime();
  if (Number.isNaN(time)) return null;
  return new Date(time);
}

export type TimesheetInterval = { start: Date; end: Date };

export function getTimesheetInterval(timesheet: Timesheet): TimesheetInterval | null {
  const start = ensureValidDate(timesheet.startDate) ?? ensureValidDate(timesheet.date);
  if (!start) return null;
  let end = ensureValidDate(timesheet.endDate);
  if (!end || end <= start) {
    const totalHours = Number.isFinite(timesheet.totalHours) ? timesheet.totalHours : 0;
    end = totalHours > 0
      ? new Date(start.getTime() + totalHours * 60 * 60 * 1000)
      : new Date(start.getTime());
  }
  return { start, end };
}

export function detectTimesheetOverlaps(timesheets: Timesheet[]): string[] {
  const conflicts: string[] = [];
  const groupedByUser = new Map<string, Timesheet[]>();
  for (const sheet of timesheets) {
    if (!groupedByUser.has(sheet.userId)) groupedByUser.set(sheet.userId, []);
    groupedByUser.get(sheet.userId)!.push(sheet);
  }
  for (const [userId, list] of groupedByUser.entries()) {
    const sorted = [...list].sort((a, b) => {
      const intervalA = getTimesheetInterval(a);
      const intervalB = getTimesheetInterval(b);
      if (!intervalA || !intervalB) return 0;
      return intervalA.start.getTime() - intervalB.start.getTime();
    });
    let previousInterval: TimesheetInterval | null = null;
    let previousSheet: Timesheet | null = null;
    for (const sheet of sorted) {
      const interval = getTimesheetInterval(sheet);
      if (!interval) {
        conflicts.push(`Zeiterfassung ${sheet.id} für Nutzer ${userId} enthält ungültige Zeitangaben.`);
        continue;
      }
      if (interval.end <= interval.start) {
        conflicts.push(
          `Zeiterfassung ${sheet.id} für Nutzer ${userId} hat eine Endzeit vor oder gleich der Startzeit (${formatDateTime(interval.start)} – ${formatDateTime(interval.end)}).`
        );
        continue;
      }
      if (previousInterval && previousSheet && interval.start < previousInterval.end) {
        conflicts.push(
          `Zeiterfassungskonflikt für Nutzer ${userId}: ${previousSheet.id} (${formatDateTime(previousInterval.start)} – ${formatDateTime(previousInterval.end)}) überschneidet sich mit ${sheet.id} (${formatDateTime(interval.start)} – ${formatDateTime(interval.end)}).`
        );
      }
      if (!previousInterval || interval.end > previousInterval.end) {
        previousInterval = interval;
        previousSheet = sheet;
      }
    }
  }
  return conflicts;
}

export function aggregateTimesheetsByUser(timesheets: Timesheet[]): TimesheetAggregation[] {
  const map = new Map<string, TimesheetAggregation>();
  for (const sheet of timesheets) {
    const existing = map.get(sheet.userId) ?? {
      userId: sheet.userId,
      totalHours: 0,
      approvedHours: 0,
      overtimeHours: 0,
      nightHours: 0,
      weekendHours: 0,
      holidayHours: 0,
    };
    const totalHours = Number.isFinite(sheet.totalHours) ? sheet.totalHours : 0;
    existing.totalHours += totalHours;
    existing.overtimeHours = (existing.overtimeHours ?? 0) + (Number.isFinite(sheet.overtimeHours) ? sheet.overtimeHours ?? 0 : 0);
    existing.nightHours = (existing.nightHours ?? 0) + (Number.isFinite(sheet.nightHours) ? sheet.nightHours ?? 0 : 0);
    existing.weekendHours = (existing.weekendHours ?? 0) + (Number.isFinite(sheet.weekendHours) ? sheet.weekendHours ?? 0 : 0);
    existing.holidayHours = (existing.holidayHours ?? 0) + (Number.isFinite(sheet.holidayHours) ? sheet.holidayHours ?? 0 : 0);
    if (sheet.status === 'approved') existing.approvedHours += totalHours;
    map.set(sheet.userId, existing);
  }
  return Array.from(map.values()).map(entry => ({
    ...entry,
    totalHours: roundToDecimals(entry.totalHours),
    approvedHours: roundToDecimals(entry.approvedHours),
    overtimeHours: roundToDecimals(entry.overtimeHours),
    nightHours: roundToDecimals(entry.nightHours),
    weekendHours: roundToDecimals(entry.weekendHours),
    holidayHours: roundToDecimals(entry.holidayHours),
  }));
}
