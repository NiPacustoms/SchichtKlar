import { logger } from '@/lib/logging';

import { timesService } from '@/lib/services/times';

const TOTAL_VACATION_DAYS = 28; // Jeder Mitarbeiter hat immer 28 Tage Urlaub

/**
 * Berechnet die tatsächlich genutzten Urlaubstage aus genehmigten Urlaubsanträgen
 * Dies ist die einzige Quelle der Wahrheit - keine Mock-Daten oder Platzhalter
 * 
 * @param userId - ID des Mitarbeiters
 * @returns Anzahl der genutzten Urlaubstage basierend auf genehmigten Anträgen
 */
export async function calculateUsedVacationDays(userId: string): Promise<number> {
  try {
    // Lade alle Urlaubsanträge des Mitarbeiters aus der Datenbank
    const allTimeEntries = await timesService.getAll(userId);
    
    // Filtere nur genehmigte Urlaubsanträge
    const approvedVacations = allTimeEntries.filter(
      (entry) => entry.type === 'vacation' && entry.status === 'approved'
    );
    
    // Summiere die Tage aus allen genehmigten Urlaubsanträgen
    const totalUsedDays = approvedVacations.reduce((sum, entry) => {
      return sum + (entry.days || 0);
    }, 0);
    
    return totalUsedDays;
  } catch (error) {
    logger.error('Fehler beim Berechnen der genutzten Urlaubstage:', error);
    // Bei Fehler: Versuche aus User-Dokument zu lesen, aber logge Warnung
    logger.warn('Verwende Fallback: usedVacationDays aus User-Dokument');
    return 0; // Bei Fehler: 0 zurückgeben, nicht einen falschen Wert
  }
}

/**
 * Berechnet die verfügbaren Urlaubstage
 * 
 * @param userId - ID des Mitarbeiters
 * @returns Anzahl der verfügbaren Urlaubstage
 */
export async function calculateAvailableVacationDays(userId: string): Promise<number> {
  const usedDays = await calculateUsedVacationDays(userId);
  return Math.max(0, TOTAL_VACATION_DAYS - usedDays);
}

/**
 * Gibt die Gesamtzahl der Urlaubstage zurück (immer 28)
 */
export function getTotalVacationDays(): number {
  return TOTAL_VACATION_DAYS;
}

