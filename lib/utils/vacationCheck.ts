import { logger } from '@/lib/logging';

import { timesService } from '@/lib/services/times';

/**
 * Prüft, ob ein Mitarbeiter zu einem bestimmten Datum im Urlaub ist
 * 
 * @param userId - ID des Mitarbeiters
 * @param date - Datum, das geprüft werden soll
 * @returns true wenn der Mitarbeiter an diesem Datum im genehmigten Urlaub ist
 */
export async function isEmployeeOnVacation(userId: string, date: Date): Promise<boolean> {
  try {
    // Lade alle genehmigten Urlaubsanträge des Mitarbeiters
    const allTimes = await timesService.getAll(userId);
    const vacationEntries = allTimes.filter(
      (entry) => entry.type === 'vacation' && entry.status === 'approved'
    );

    // Prüfe, ob das Datum innerhalb eines Urlaubszeitraums liegt
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return vacationEntries.some((entry) => {
      if (!entry.startDate || !entry.endDate) return false;

      const startDate = new Date(entry.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(entry.endDate);
      endDate.setHours(23, 59, 59, 999);

      return checkDate >= startDate && checkDate <= endDate;
    });
  } catch (error) {
    logger.error('Fehler beim Prüfen des Urlaubsstatus:', error);
    return false; // Bei Fehler erlauben wir die Zuweisung (Fail-Safe)
  }
}

/**
 * Prüft, ob ein Mitarbeiter in einem Zeitraum Urlaub hat
 * 
 * @param userId - ID des Mitarbeiters
 * @param startDate - Startdatum des zu prüfenden Zeitraums
 * @param endDate - Enddatum des zu prüfenden Zeitraums
 * @returns true wenn der Mitarbeiter in diesem Zeitraum Urlaub hat
 */
export async function hasVacationInPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  try {
    const allTimes = await timesService.getAll(userId);
    const vacationEntries = allTimes.filter(
      (entry) => entry.type === 'vacation' && entry.status === 'approved'
    );

    const checkStart = new Date(startDate);
    checkStart.setHours(0, 0, 0, 0);
    const checkEnd = new Date(endDate);
    checkEnd.setHours(23, 59, 59, 999);

    return vacationEntries.some((entry) => {
      if (!entry.startDate || !entry.endDate) return false;

      const vacationStart = new Date(entry.startDate);
      vacationStart.setHours(0, 0, 0, 0);
      const vacationEnd = new Date(entry.endDate);
      vacationEnd.setHours(23, 59, 59, 999);

      // Prüfe auf Überschneidung
      return (
        (checkStart >= vacationStart && checkStart <= vacationEnd) ||
        (checkEnd >= vacationStart && checkEnd <= vacationEnd) ||
        (checkStart <= vacationStart && checkEnd >= vacationEnd)
      );
    });
  } catch (error) {
    logger.error('Fehler beim Prüfen des Urlaubszeitraums:', error);
    return false;
  }
}

/**
 * Gibt alle Urlaubszeiträume eines Mitarbeiters zurück
 * 
 * @param userId - ID des Mitarbeiters
 * @returns Array von Urlaubszeiträumen
 */
export async function getEmployeeVacationPeriods(userId: string): Promise<Array<{ startDate: Date; endDate: Date; days: number }>> {
  try {
    const allTimes = await timesService.getAll(userId);
    const vacationEntries = allTimes.filter(
      (entry) => entry.type === 'vacation' && entry.status === 'approved'
    );

    return vacationEntries
      .filter((entry) => entry.startDate && entry.endDate)
      .map((entry) => ({
        startDate: entry.startDate!,
        endDate: entry.endDate!,
        days: entry.days || 0,
      }));
  } catch (error) {
    logger.error('Fehler beim Laden der Urlaubszeiträume:', error);
    return [];
  }
}

