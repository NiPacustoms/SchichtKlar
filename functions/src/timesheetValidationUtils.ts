/**
 * Wiederverwendbare ArbZG-Validierungslogik für Zeiterfassungen
 * Rechtskonform nach deutschem Arbeitszeitgesetz (ArbZG)
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

// ArbZG (Arbeitszeitgesetz) Konstanten
export const ARBZG_CONSTANTS = {
  MAX_DAILY_HOURS: 10, // Maximal 10 Stunden pro Tag (§3 ArbZG)
  MAX_WEEKLY_HOURS: 48, // Maximal 48 Stunden pro Woche (§3 ArbZG)
  MIN_BREAK_AFTER_6_HOURS: 30, // Mindestens 30 Minuten Pause nach 6 Stunden (§4 ArbZG)
  MIN_BREAK_AFTER_9_HOURS: 45, // Mindestens 45 Minuten Pause nach 9 Stunden (§4 ArbZG)
  MIN_REST_PERIOD: 11, // Mindestens 11 Stunden Ruhezeit zwischen Schichten (§5 ArbZG)
};

export interface TimesheetValidationData {
  id?: string;
  userId: string;
  date: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  breakMinutes?: number;
  totalHours?: number;
  shiftId?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Konvertiert Zeit-String zu Date-Objekt
 */
function parseTimeToDate(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes || 0, 0, 0);
  return result;
}

/**
 * Führt vollständige ArbZG-konforme Validierung einer Zeiterfassung durch
 */
export async function validateTimesheetArbZG(
  timesheet: TimesheetValidationData
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Normalisiere Datumswerte
  const date = typeof timesheet.date === 'string' ? new Date(timesheet.date) : timesheet.date;
  const startTime = typeof timesheet.startTime === 'string' 
    ? parseTimeToDate(date, timesheet.startTime) 
    : timesheet.startTime;
  const endTime = typeof timesheet.endTime === 'string'
    ? parseTimeToDate(date, timesheet.endTime)
    : timesheet.endTime;

  // 1. Grundlegende Zeitvalidierung
  if (!startTime) {
    errors.push('Startzeit ist erforderlich');
    return { isValid: false, errors, warnings };
  }

  if (!endTime) {
    errors.push('Endzeit ist erforderlich');
    return { isValid: false, errors, warnings };
  }

  const now = new Date();

  // Startzeit darf nicht in der Zukunft liegen
  if (startTime > now) {
    errors.push('Startzeit kann nicht in der Zukunft liegen');
  }

  // Endzeit muss nach Startzeit liegen
  if (endTime <= startTime) {
    // Nachtschicht: Endzeit am nächsten Tag
    const nextDayEnd = new Date(endTime);
    nextDayEnd.setDate(nextDayEnd.getDate() + 1);
    if (nextDayEnd <= startTime) {
      errors.push('Endzeit muss nach der Startzeit liegen');
    }
  }

  // 2. Arbeitszeitberechnung
  let workingMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  
  // Nachtschicht-Handling
  if (workingMinutes < 0) {
    workingMinutes += 24 * 60;
  }

  const breakMinutes = timesheet.breakMinutes || 0;
  const grossWorkingHours = workingMinutes / 60; // Brutto-Arbeitszeit (vor Pausenabzug)
  const netWorkingHours = (workingMinutes - breakMinutes) / 60; // Netto-Arbeitszeit (nach Pausenabzug)

  // 3. ArbZG §3: Maximale tägliche Arbeitszeit (10 Stunden) - bezieht sich auf Netto-Arbeitszeit
  if (netWorkingHours > ARBZG_CONSTANTS.MAX_DAILY_HOURS) {
    errors.push(
      `Tägliche Arbeitszeit von ${netWorkingHours.toFixed(2)}h überschreitet das Maximum von ${ARBZG_CONSTANTS.MAX_DAILY_HOURS}h (ArbZG §3)`
    );
  }

  // 4. ArbZG §4: Pausenregelung - bezieht sich auf Brutto-Arbeitszeit (Zeitspanne zwischen Start und Ende)
  // WICHTIG: Die Pausenregelung prüft die Zeitspanne zwischen Start und Ende, nicht die Netto-Arbeitszeit
  if (grossWorkingHours >= 6 && breakMinutes < ARBZG_CONSTANTS.MIN_BREAK_AFTER_6_HOURS) {
    errors.push(
      `Nach 6 Stunden Arbeit sind mindestens ${ARBZG_CONSTANTS.MIN_BREAK_AFTER_6_HOURS} Minuten Pause erforderlich (ArbZG §4)`
    );
  }

  // KRITISCH: 45-Minuten-Pause nach 9 Stunden
  if (grossWorkingHours >= 9 && breakMinutes < ARBZG_CONSTANTS.MIN_BREAK_AFTER_9_HOURS) {
    errors.push(
      `Nach 9 Stunden Arbeit sind mindestens ${ARBZG_CONSTANTS.MIN_BREAK_AFTER_9_HOURS} Minuten Pause erforderlich (ArbZG §4)`
    );
  }

  // 5. ArbZG §5: Ruhezeiten (11 Stunden zwischen Schichten)
  const restPeriodValidation = await validateRestPeriod(timesheet.userId, startTime, timesheet.id);
  if (!restPeriodValidation.isValid) {
    errors.push(...restPeriodValidation.errors);
  }
  if (restPeriodValidation.warnings.length > 0) {
    warnings.push(...restPeriodValidation.warnings);
  }

  // 6. ArbZG §3: Maximale wöchentliche Arbeitszeit (48 Stunden)
  const weeklyHours = await calculateWeeklyHours(timesheet.userId, startTime, timesheet.id);
  if (weeklyHours > ARBZG_CONSTANTS.MAX_WEEKLY_HOURS) {
    errors.push(
      `Wöchentliche Arbeitszeit von ${weeklyHours.toFixed(2)}h überschreitet das Maximum von ${ARBZG_CONSTANTS.MAX_WEEKLY_HOURS}h (ArbZG §3)`
    );
  }

  // 7. Überschneidungsprüfung
  const overlaps = await checkTimesheetOverlaps(
    timesheet.userId,
    startTime,
    endTime,
    timesheet.id
  );
  if (overlaps.length > 0) {
    errors.push(`Überschneidung mit anderen Zeiterfassungen: ${overlaps.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validiert Ruhezeiten zwischen Schichten (ArbZG §5)
 * Mindestens 11 Stunden Ruhezeit zwischen Ende der letzten und Beginn der neuen Schicht
 */
async function validateRestPeriod(
  userId: string,
  newStartTime: Date,
  excludeTimesheetId?: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Finde letzte beendete Schicht des Users
    const lastTimesheetsQuery = db
      .collection('timesheets')
      .where('userId', '==', userId)
      .where('status', 'in', ['submitted', 'approved'])
      .orderBy('date', 'desc')
      .orderBy('endTime', 'desc')
      .limit(10);

    const lastTimesheets = await lastTimesheetsQuery.get();

    if (lastTimesheets.empty) {
      // Keine vorherige Schicht - Ruhezeit-Prüfung nicht anwendbar
      return { isValid: true, errors, warnings };
    }

    // Finde die letzte Schicht, die vor der neuen Schicht endet
    let lastEndTime: Date | null = null;
    let lastTimesheetDate: Date | null = null;

    for (const doc of lastTimesheets.docs) {
      if (doc.id === excludeTimesheetId) continue;

      const data = doc.data();
      if (!data.endTime) continue;

      // Kombiniere Datum und Endzeit
      const timesheetDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      const [hours, minutes] = data.endTime.split(':').map(Number);
      const endDateTime = new Date(timesheetDate);
      endDateTime.setHours(hours, minutes || 0, 0, 0);

      // Wenn Endzeit nach Mitternacht liegt (Nachtschicht)
      if (endDateTime < timesheetDate) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      if (endDateTime < newStartTime) {
        lastEndTime = endDateTime;
        lastTimesheetDate = timesheetDate;
        break;
      }
    }

    if (lastEndTime && lastTimesheetDate) {
      // Berechne Ruhezeit in Stunden
      const restHours = (newStartTime.getTime() - lastEndTime.getTime()) / (1000 * 60 * 60);

      if (restHours < ARBZG_CONSTANTS.MIN_REST_PERIOD) {
        errors.push(
          `Ruhezeit von ${restHours.toFixed(2)}h unterschreitet das Minimum von ${ARBZG_CONSTANTS.MIN_REST_PERIOD}h zwischen Schichten (ArbZG §5)`
        );
      } else if (restHours < ARBZG_CONSTANTS.MIN_REST_PERIOD + 0.5) {
        // Warnung wenn knapp über Minimum
        warnings.push(
          `Ruhezeit von ${restHours.toFixed(2)}h liegt knapp über dem Minimum von ${ARBZG_CONSTANTS.MIN_REST_PERIOD}h`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    console.error('Error validating rest period:', error);
    // Bei Fehlern: Warnung statt Fehler (nicht blockierend)
    warnings.push('Ruhezeiten-Prüfung konnte nicht durchgeführt werden');
    return { isValid: true, errors, warnings };
  }
}

/**
 * Berechnet wöchentliche Arbeitszeit für einen User
 */
async function calculateWeeklyHours(
  userId: string,
  date: Date,
  excludeTimesheetId?: string
): Promise<number> {
  try {
    // Berechne Start und Ende der Woche (Montag bis Sonntag)
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const timesheets = await db
      .collection('timesheets')
      .where('userId', '==', userId)
      .where('status', 'in', ['submitted', 'approved'])
      .where('date', '>=', monday)
      .where('date', '<=', sunday)
      .get();

    let totalHours = 0;
    timesheets.forEach(doc => {
      if (doc.id === excludeTimesheetId) return;
      const data = doc.data();
      if (data.totalHours) {
        totalHours += data.totalHours;
      }
    });

    return totalHours;
  } catch (error) {
    console.error('Error calculating weekly hours:', error);
    return 0;
  }
}

/**
 * Prüft auf Überschneidungen mit anderen Zeiterfassungen
 */
async function checkTimesheetOverlaps(
  userId: string,
  startTime: Date,
  endTime: Date,
  excludeTimesheetId?: string
): Promise<string[]> {
  const overlaps: string[] = [];

  try {
    // Erweitere Suchbereich um 1 Tag vor/nach, um Nachtschichten zu erfassen
    const searchStart = new Date(startTime);
    searchStart.setDate(searchStart.getDate() - 1);
    searchStart.setHours(0, 0, 0, 0);

    const searchEnd = new Date(endTime);
    searchEnd.setDate(searchEnd.getDate() + 1);
    searchEnd.setHours(23, 59, 59, 999);

    const timesheets = await db
      .collection('timesheets')
      .where('userId', '==', userId)
      .where('status', 'in', ['draft', 'submitted', 'approved'])
      .where('date', '>=', searchStart)
      .where('date', '<=', searchEnd)
      .get();

    timesheets.forEach(doc => {
      if (excludeTimesheetId && doc.id === excludeTimesheetId) return;

      const data = doc.data();
      if (!data.startTime || !data.endTime) return;

      const timesheetDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      const [endHours, endMinutes] = data.endTime.split(':').map(Number);

      const existingStart = new Date(timesheetDate);
      existingStart.setHours(startHours, startMinutes || 0, 0, 0);

      const existingEnd = new Date(timesheetDate);
      existingEnd.setHours(endHours, endMinutes || 0, 0, 0);

      // Nachtschicht-Handling
      if (existingEnd < existingStart) {
        existingEnd.setDate(existingEnd.getDate() + 1);
      }

      // Prüfe auf Überschneidung
      if (startTime < existingEnd && endTime > existingStart) {
        overlaps.push(doc.id);
      }
    });

    return overlaps;
  } catch (error) {
    console.error('Error checking overlaps:', error);
    return [];
  }
}

