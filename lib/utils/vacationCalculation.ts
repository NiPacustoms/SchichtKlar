/**
 * Utility-Funktionen zur Berechnung von Urlaubstagen
 * 
 * Basis: 28 Tage Urlaubsanspruch pro Jahr (unabhängig von Vollzeit/Teilzeit)
 * Die Tage werden proportional zu den Arbeitsstunden verteilt.
 */

const FULL_TIME_HOURS_PER_WEEK = 40; // Standard-Vollzeit
const BASE_VACATION_DAYS_PER_YEAR = 28; // Gesetzlicher Mindestanspruch

/**
 * Gibt die Urlaubstage pro Jahr zurück
 * Jeder Mitarbeiter hat immer 28 Tage Urlaub, unabhängig von Vollzeit/Teilzeit
 * 
 * @param workingHoursPerWeek - Vertraglich vereinbarte Arbeitsstunden pro Woche (wird nicht verwendet, aber für API-Kompatibilität beibehalten)
 * @returns Immer 28 Tage
 * 
 * @example
 * calculateProportionalVacationDays(40) // 28 Tage
 * calculateProportionalVacationDays(20) // 28 Tage
 * calculateProportionalVacationDays(30) // 28 Tage
 */
export function calculateProportionalVacationDays(
  _workingHoursPerWeek?: number
): number {
  // Jeder Mitarbeiter hat immer 28 Tage Urlaub, unabhängig von den Arbeitsstunden
  return BASE_VACATION_DAYS_PER_YEAR;
}

/**
 * Berechnet die Stunden pro Urlaubstag basierend auf den wöchentlichen Arbeitsstunden
 * 
 * @param workingHoursPerWeek - Vertraglich vereinbarte Arbeitsstunden pro Woche
 * @returns Stunden pro Urlaubstag
 * 
 * @example
 * calculateHoursPerVacationDay(40) // 8 Stunden (Vollzeit)
 * calculateHoursPerVacationDay(20) // 4 Stunden (50% Teilzeit)
 */
export function calculateHoursPerVacationDay(
  workingHoursPerWeek?: number
): number {
  const hours = workingHoursPerWeek ?? FULL_TIME_HOURS_PER_WEEK;
  
  if (hours <= 0 || hours > 80) {
    return 8; // Standard: 8 Stunden pro Tag
  }
  
  // Durchschnittliche Stunden pro Arbeitstag (5-Tage-Woche)
  return hours / 5;
}

/**
 * Konvertiert Urlaubstage in Stunden basierend auf den Arbeitsstunden
 * 
 * @param days - Anzahl der Urlaubstage
 * @param workingHoursPerWeek - Vertraglich vereinbarte Arbeitsstunden pro Woche
 * @returns Stunden für die angegebenen Urlaubstage
 */
export function convertVacationDaysToHours(
  days: number,
  workingHoursPerWeek?: number
): number {
  const hoursPerDay = calculateHoursPerVacationDay(workingHoursPerWeek);
  return days * hoursPerDay;
}

/**
 * Konvertiert Urlaubsstunden zurück in Tage basierend auf den Arbeitsstunden
 * 
 * @param hours - Anzahl der Urlaubsstunden
 * @param workingHoursPerWeek - Vertraglich vereinbarte Arbeitsstunden pro Woche
 * @returns Tage für die angegebenen Urlaubsstunden
 */
export function convertVacationHoursToDays(
  hours: number,
  workingHoursPerWeek?: number
): number {
  const hoursPerDay = calculateHoursPerVacationDay(workingHoursPerWeek);
  if (hoursPerDay <= 0) return 0;
  return hours / hoursPerDay;
}

/**
 * Holt die Arbeitsstunden eines Mitarbeiters aus verschiedenen Quellen
 * Priorität: User.workingHoursPerWeek > Einstellungen > Standard (40h)
 *
 * @param user - User-Objekt mit optionalen workingHoursPerWeek
 * @param settings - Optional: Einstellungen mit workingHoursPerWeek
 * @returns Arbeitsstunden pro Woche
 */
export function getWorkingHoursPerWeek(
  user?: { workingHoursPerWeek?: number },
  settings?: { workingHoursPerWeek?: number }
): number {
  return user?.workingHoursPerWeek
    ?? settings?.workingHoursPerWeek
    ?? FULL_TIME_HOURS_PER_WEEK;
}

