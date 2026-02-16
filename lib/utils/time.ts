/**
 * Utility functions for time calculations and formatting
 */

/**
 * Formats a Date object to "HH:MM" string
 * @param date - Date object (defaults to current time)
 * @returns Time string in "HH:MM" format
 */
export function toHHMM(date: Date = new Date()): string {
  return date.toTimeString().slice(0, 5);
}

/**
 * Calculates the difference between two time strings in minutes
 * @param start - Start time in "HH:MM" format
 * @param end - End time in "HH:MM" format
 * @returns Difference in minutes (handles overnight shifts)
 */
export function diffHHMM(start: string, end: string): number {
  const startTime = new Date(`2000-01-01T${start}`);
  const endTime = new Date(`2000-01-01T${end}`);
  
  let diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  // Handle overnight shifts (end time is next day)
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Add 24 hours
  }
  
  return diffMinutes;
}

/**
 * Calculates work minutes (total time minus break time)
 * @param start - Start time in "HH:MM" format
 * @param end - End time in "HH:MM" format
 * @param pauseMin - Break time in minutes
 * @returns Work minutes
 */
export function calcWorkMin(start: string, end: string, pauseMin: number): number {
  const totalMinutes = diffHHMM(start, end);
  return Math.max(0, totalMinutes - pauseMin);
}

/**
 * Determines the legally required break minutes according to the German Arbeitszeitgesetz.
 * - Bis einschließlich 6 Stunden Arbeitszeit: keine Pflichtpause
 * - Mehr als 6 bis 9 Stunden: mindestens 30 Minuten
 * - Mehr als 9 Stunden: mindestens 45 Minuten
 */
export function getRequiredBreakMinutes(workMinutes: number): number {
  if (workMinutes > 9 * 60) {
    return 45;
  }

  if (workMinutes > 6 * 60) {
    return 30;
  }

  return 0;
}

/**
 * Calculates effective worked minutes for a timesheet entry (without pauses).
 * Handles running timesheets (no endTime yet) and overnight shifts.
 */
export function calculateWorkedMinutes(timesheet: {
  date?: Date;
  startTime?: string;
  endTime?: string | null;
  breakMinutes?: number | null;
}, referenceDate: Date = new Date()): number {
  if (!timesheet?.startTime || !timesheet?.date) {
    return 0;
  }

  const startDate = new Date(timesheet.date);
  const [startHour, startMinute] = timesheet.startTime.split(':').map(Number);
  startDate.setHours(startHour || 0, startMinute || 0, 0, 0);

  let endDate: Date;
  if (timesheet.endTime) {
    endDate = new Date(timesheet.date);
    const [endHour, endMinute] = timesheet.endTime.split(':').map(Number);
    endDate.setHours(endHour || 0, endMinute || 0, 0, 0);

    // Handle overnight shifts (end before start)
    if (endDate.getTime() <= startDate.getTime()) {
      endDate.setDate(endDate.getDate() + 1);
    }
  } else {
    endDate = new Date(referenceDate);
  }

  let diffMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  if (diffMinutes < 0) {
    diffMinutes = 0;
  }

  const breakMinutes = timesheet.breakMinutes ?? 0;
  return Math.max(0, diffMinutes - breakMinutes);
}

/**
 * Gets current date in ISO format (yyyy-MM-dd)
 * @returns Current date as "yyyy-MM-dd"
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Creates entry ID from date (yyyyMMdd format)
 * @param date - Date object (defaults to current date)
 * @returns Entry ID in "yyyyMMdd" format
 */
export function entryIdFromDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Validates time format (HH:MM)
 * @param time - Time string to validate
 * @returns True if valid time format
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * Checks if end time is after start time
 * @param start - Start time in "HH:MM" format
 * @param end - End time in "HH:MM" format
 * @returns True if end is after start
 */
export function isEndAfterStart(start: string, end: string): boolean {
  if (!start || !end) return false;
  
  const startTime = new Date(`2000-01-01T${start}`);
  const endTime = new Date(`2000-01-01T${end}`);
  
  // Handle overnight shifts
  if (endTime.getTime() <= startTime.getTime()) {
    return true; // Assume overnight shift is valid
  }
  
  return endTime.getTime() > startTime.getTime();
}

/**
 * Checks if break warning is needed (>6h work, <30min break)
 * @param workMinutes - Total work minutes
 * @param breakMinutes - Break minutes
 * @returns True if break warning is needed
 */
export function needsBreakWarning(workMinutes: number, breakMinutes: number): boolean {
  const requiredBreak = getRequiredBreakMinutes(workMinutes);
  return breakMinutes < requiredBreak;
}

/**
 * Formats work hours for display
 * @param workMinutes - Work minutes
 * @returns Formatted hours string (e.g., "8.5h")
 */
export function formatWorkHours(workMinutes: number): string {
  const hours = workMinutes / 60;
  return `${Math.round(hours * 100) / 100}h`;
}
