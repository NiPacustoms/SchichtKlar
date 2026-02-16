import { addDays } from 'date-fns';
import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Konvertiert eine Schicht-Zeit in UTC Timestamps
 * @param date Schichtdatum
 * @param start Startzeit (HH:mm)
 * @param end Endzeit (HH:mm)
 * @param tz Zeitzone (default: Europe/Berlin)
 * @returns Object mit UTC start/end Timestamps
 */
export function parseShiftToUTC(
  date: Date,
  start: string,
  end: string,
  tz: string = 'Europe/Berlin'
): { startUTC: Date; endUTC: Date; isOvernight: boolean } {
  // Datum + Startzeit kombinieren
  const startDateTime = `${format(date, 'yyyy-MM-dd')}T${start}:00`;
  const endDateTime = `${format(date, 'yyyy-MM-dd')}T${end}:00`;

  // Prüfen ob overnight (end < start)
  const isOvernight = end < start;

  // UTC Timestamps berechnen
  const startUTC = fromZonedTime(startDateTime, tz);
  let endUTC = fromZonedTime(endDateTime, tz);

  // Bei overnight: Endzeit + 1 Tag
  if (isOvernight) {
    endUTC = fromZonedTime(`${format(addDays(date, 1), 'yyyy-MM-dd')}T${end}:00`, tz);
  }

  return { startUTC, endUTC, isOvernight };
}

/**
 * Prüft ob zwei Zeitintervalle überlappen
 * @param interval1 Erstes Intervall
 * @param interval2 Zweites Intervall
 * @returns true wenn Überlappung vorhanden
 */
export function checkOverlap(
  interval1: { start: Date; end: Date },
  interval2: { start: Date; end: Date }
): boolean {
  // Überlappung wenn: max(start1, start2) < min(end1, end2)
  const overlapStart = new Date(Math.max(interval1.start.getTime(), interval2.start.getTime()));
  const overlapEnd = new Date(Math.min(interval1.end.getTime(), interval2.end.getTime()));

  return overlapStart < overlapEnd;
}

/**
 * Behandelt overnight-Schichten korrekt
 * @param start Startzeit
 * @param end Endzeit
 * @returns Objekt mit korrigierten Zeiten und overnight-Flag
 */
export function handleOvernightShift(
  start: string,
  end: string
): {
  start: string;
  end: string;
  isOvernight: boolean;
  duration: number; // Stunden
} {
  const isOvernight = end < start;

  // Dauer berechnen (in Stunden)
  let duration: number;
  if (isOvernight) {
    // Overnight: (24 - start) + end
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    duration = 24 - startHour + endHour;
  } else {
    // Normal: end - start
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    duration = endHour - startHour;
  }

  return {
    start,
    end,
    isOvernight,
    duration,
  };
}

/**
 * Konvertiert UTC Timestamp zurück in lokale Zeit
 * @param utcDate UTC Timestamp
 * @param tz Ziel-Zeitzone
 * @returns Lokale Zeit als Date
 */
export function utcToLocal(utcDate: Date, tz: string = 'Europe/Berlin'): Date {
  return toZonedTime(utcDate, tz);
}

/**
 * Formatiert Zeit für Anzeige mit Zeitzone
 * @param date Datum
 * @param tz Zeitzone
 * @returns Formatierte Zeit-String
 */
export function formatTimeWithTz(date: Date, tz: string = 'Europe/Berlin'): string {
  return format(date, 'HH:mm', { timeZone: tz });
}

/**
 * Berechnet alle Zeitkonflikte für einen User an einem Datum
 * @param userId User ID
 * @param newShift Neue Schicht
 * @param existingAssignments Bestehende Assignments
 * @returns Array von Konflikten
 */
export function findTimeConflicts(
  userId: string,
  newShift: { startUTC: Date; endUTC: Date },
  existingAssignments: Array<{
    id: string;
    shiftId: string;
    startUTC: Date;
    endUTC: Date;
    facilityName: string;
    stationName: string;
  }>
): Array<{
  assignmentId: string;
  shiftId: string;
  conflictStart: Date;
  conflictEnd: Date;
  facilityName: string;
  stationName: string;
}> {
  const conflicts: Array<{
    assignmentId: string;
    shiftId: string;
    conflictStart: Date;
    conflictEnd: Date;
    facilityName: string;
    stationName: string;
  }> = [];

  for (const assignment of existingAssignments) {
    if (
      checkOverlap(
        { start: newShift.startUTC, end: newShift.endUTC },
        { start: assignment.startUTC, end: assignment.endUTC }
      )
    ) {
      // Überlappung gefunden
      const conflictStart = new Date(
        Math.max(newShift.startUTC.getTime(), assignment.startUTC.getTime())
      );
      const conflictEnd = new Date(
        Math.min(newShift.endUTC.getTime(), assignment.endUTC.getTime())
      );

      conflicts.push({
        assignmentId: assignment.id,
        shiftId: assignment.shiftId,
        conflictStart,
        conflictEnd,
        facilityName: assignment.facilityName,
        stationName: assignment.stationName,
      });
    }
  }

  return conflicts;
}

/**
 * Prüft DST-Wechsel für ein Datum
 * @param date Datum
 * @param tz Zeitzone
 * @returns Objekt mit DST-Informationen
 */
export function checkDSTTransition(
  date: Date,
  tz: string = 'Europe/Berlin'
): {
  isDST: boolean;
  offset: number; // Minuten
  transitionDate?: Date;
} {
  // Vereinfachte DST-Prüfung für Deutschland
  const year = date.getFullYear();
  const marchLastSunday = new Date(year, 2, 31 - new Date(year, 2, 31).getDay());
  const octoberLastSunday = new Date(year, 9, 31 - new Date(year, 9, 31).getDay());

  const isDST = date >= marchLastSunday && date < octoberLastSunday;

  return {
    isDST,
    offset: isDST ? 120 : 60, // Sommerzeit: +2h, Winterzeit: +1h
    transitionDate: isDST ? marchLastSunday : octoberLastSunday,
  };
}
