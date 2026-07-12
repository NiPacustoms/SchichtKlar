/**
 * Utility functions for calculating signature schedule requirements
 * Based on assignment duration and German labor law requirements
 *
 * Regel 8 (Spez.): Unterschriftsblöcke dürfen maximal 7 Tage abdecken.
 * Der erzeugte Zeitplan garantiert das konstruktiv: Signatur spätestens an
 * Tag 7 bzw. am Einsatzende, bei längeren Einsätzen jeden Sonntag + am Ende.
 */

/**
 * Datum → lokaler YYYY-MM-DD-String.
 * WICHTIG: bewusst NICHT toISOString() – das rechnet nach UTC um und
 * verschiebt lokale Mitternachts-Daten (Europe/Berlin) auf den Vortag.
 */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates required signature dates for an assignment
 * Rules:
 * - For assignments up to 7 days: Signature on the Sunday within the period,
 *   otherwise on the last day (never after the assignment ends)
 * - For longer assignments: Signature every Sunday + at the end
 */
export function calculateSignatureSchedule(
  startDate: Date,
  endDate: Date
): {
  requiredDates: Date[];
  nextRequiredDate: Date | null;
} {
  const requiredDates: Date[] = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0); // Kalendertag des Endes (Mitternacht – konsistente Date-Keys)

  // Calculate days difference (inklusive Start- und Endtag)
  const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (daysDiff <= 7) {
    // Bis 7 Tage: Sonntag im Zeitraum, sonst letzter Einsatztag.
    // (Vorher wurde starr „Tag 7" gesetzt – bei kurzen Einsätzen ohne Sonntag
    // lag der Signaturtermin damit NACH dem Einsatzende.)
    const sundayInPeriod = findNextSunday(start, end);
    requiredDates.push(sundayInPeriod ?? new Date(end));
  } else {
    // Länger als 7 Tage: jeden Sonntag + Einsatzende
    const firstSunday = findNextSunday(start, end);
    if (firstSunday) {
      const currentDate = new Date(firstSunday);
      while (currentDate <= end) {
        requiredDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7); // Next Sunday
      }
    }
    requiredDates.push(new Date(end));
  }

  // Sort + Duplikate entfernen (Einsatzende kann selbst ein Sonntag sein)
  requiredDates.sort((a, b) => a.getTime() - b.getTime());
  const deduped: Date[] = [];
  const seen = new Set<string>();
  for (const d of requiredDates) {
    const key = toLocalDateKey(d);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(d);
    }
  }

  return {
    requiredDates: deduped,
    nextRequiredDate: deduped.length > 0 ? deduped[0] : null,
  };
}

/**
 * Finds the next Sunday on or after the given date, within the end date
 */
function findNextSunday(startDate: Date, endDate: Date): Date | null {
  const current = new Date(startDate);
  const end = new Date(endDate);

  // Find next Sunday
  const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  current.setDate(current.getDate() + daysUntilSunday);

  if (current <= end) {
    return current;
  }

  return null;
}

/**
 * Checks if a signature is required today for an assignment
 */
export function isSignatureRequiredToday(
  assignmentStartDate: Date,
  assignmentEndDate: Date,
  collectedDates: string[]
): boolean {
  const { requiredDates } = calculateSignatureSchedule(assignmentStartDate, assignmentEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Lokale Date-Keys (kein UTC-Versatz)
  const todayStr = toLocalDateKey(today);
  const isRequiredDate = requiredDates.some(date => toLocalDateKey(date) === todayStr);

  // Check if already collected
  const alreadyCollected = collectedDates.includes(todayStr);

  return isRequiredDate && !alreadyCollected;
}

/**
 * Gets the next required signature date for an assignment
 */
export function getNextRequiredSignatureDate(
  assignmentStartDate: Date,
  assignmentEndDate: Date,
  collectedDates: string[]
): Date | null {
  const { requiredDates } = calculateSignatureSchedule(assignmentStartDate, assignmentEndDate);

  // Find first date that hasn't been collected
  for (const date of requiredDates) {
    if (!collectedDates.includes(toLocalDateKey(date))) {
      return date;
    }
  }

  return null;
}

/**
 * Regel 8 serverseitig prüfbar: validiert, dass ein Zeitplan keinen Block
 * länger als 7 Tage lässt (Abstand Start→erste Signatur, zwischen Signaturen,
 * letzte Signatur→Ende jeweils ≤ 7 Kalendertage).
 */
export function validateSignatureScheduleMaxBlock(
  startDate: Date,
  endDate: Date,
  requiredDates: Date[]
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];
  const DAY = 24 * 60 * 60 * 1000;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const sorted = [...requiredDates]
    .map(d => {
      const c = new Date(d);
      c.setHours(0, 0, 0, 0);
      return c;
    })
    .sort((a, b) => a.getTime() - b.getTime());

  if (sorted.length === 0) {
    const days = Math.round((end.getTime() - start.getTime()) / DAY) + 1;
    if (days > 7) violations.push(`Einsatz über ${days} Tage ohne Signaturtermine`);
    return { isValid: violations.length === 0, violations };
  }

  let blockStart = start;
  for (const d of sorted) {
    const blockDays = Math.round((d.getTime() - blockStart.getTime()) / DAY) + 1;
    if (blockDays > 7) {
      violations.push(
        `Signaturblock ${toLocalDateKey(blockStart)} – ${toLocalDateKey(d)} umfasst ${blockDays} Tage (max. 7)`
      );
    }
    blockStart = new Date(d.getTime() + DAY);
  }
  if (blockStart <= end) {
    const tailDays = Math.round((end.getTime() - blockStart.getTime()) / DAY) + 1;
    if (tailDays > 7) {
      violations.push(
        `Restblock ${toLocalDateKey(blockStart)} – ${toLocalDateKey(end)} umfasst ${tailDays} Tage ohne Signatur (max. 7)`
      );
    }
  }

  return { isValid: violations.length === 0, violations };
}
