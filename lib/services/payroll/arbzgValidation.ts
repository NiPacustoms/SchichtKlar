// Arbeitszeitgesetz (ArbZG) Validierungen
// Prüft Einhaltung der gesetzlichen Arbeitszeitvorschriften
import { logger } from '@/lib/logging';

export interface TimesheetEntry {
  date: Date | string;
  startTime?: string; // Format: "HH:mm"
  endTime?: string; // Format: "HH:mm"
  totalHours: number;
  breakMinutes?: number; // Pausenzeit in Minuten
}

export interface ArbZGValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  violations: Array<{
    type: 'daily' | 'weekly' | 'rest' | 'break';
    date?: Date;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

export class ArbZGValidationService {
  // Gesetzliche Grenzen nach ArbZG
  private readonly MAX_DAILY_HOURS = 8; // §3 ArbZG: Höchstarbeitszeit 8h/Tag
  private readonly MAX_WEEKLY_HOURS = 40; // §3 ArbZG: Höchstarbeitszeit 40h/Woche
  private readonly MIN_REST_PERIOD = 11; // §5 ArbZG: Ruhezeit 11h ununterbrochen
  private readonly BREAK_THRESHOLD_6H = 30; // §4 ArbZG: 30min Pause bei >6h
  private readonly BREAK_THRESHOLD_9H = 45; // §4 ArbZG: 45min Pause bei >9h
  
  /**
   * Validiert Arbeitszeiten nach ArbZG
   */
  validateArbZG(timesheets: TimesheetEntry[]): ArbZGValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const violations: ArbZGValidationResult['violations'] = [];
    
    // 1. Tägliche Arbeitszeit prüfen
    const dailyViolations = this.validateDailyHours(timesheets);
    violations.push(...dailyViolations);
    
    // 2. Wöchentliche Arbeitszeit prüfen
    const weeklyViolations = this.validateWeeklyHours(timesheets);
    violations.push(...weeklyViolations);
    
    // 3. Ruhezeiten prüfen
    const restViolations = this.validateRestPeriods(timesheets);
    violations.push(...restViolations);
    
    // 4. Pausen prüfen
    const breakViolations = this.validateBreaks(timesheets);
    violations.push(...breakViolations);
    
    // Kategorisiere Verstöße
    violations.forEach(violation => {
      if (violation.severity === 'error') {
        errors.push(violation.message);
      } else {
        warnings.push(violation.message);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      violations,
    };
  }
  
  /**
   * Prüft tägliche Arbeitszeit (§3 ArbZG)
   */
  private validateDailyHours(timesheets: TimesheetEntry[]): ArbZGValidationResult['violations'] {
    const violations: ArbZGValidationResult['violations'] = [];
    
    timesheets.forEach(entry => {
      const date = typeof entry.date === 'string' ? new Date(entry.date) : entry.date;
      
      // Validierung: Gültiges Datum und gültige Stunden
      if (isNaN(date.getTime())) return; // Ungültiges Datum überspringen
      if (!Number.isFinite(entry.totalHours) || entry.totalHours < 0) return; // Ungültige Stunden überspringen
      
      const hours = entry.totalHours;
      
      if (hours > this.MAX_DAILY_HOURS) {
        violations.push({
          type: 'daily',
          date,
          message: `Arbeitszeit ${hours.toFixed(2)}h überschreitet 8h/Tag am ${date.toLocaleDateString('de-DE')}`,
          severity: hours > 10 ? 'error' : 'warning', // >10h = kritisch
        });
      }
    });
    
    return violations;
  }
  
  /**
   * Prüft wöchentliche Arbeitszeit (§3 ArbZG)
   */
  private validateWeeklyHours(timesheets: TimesheetEntry[]): ArbZGValidationResult['violations'] {
    const violations: ArbZGValidationResult['violations'] = [];
    
    // Gruppiere nach Kalenderwoche
    const weeklyHours = new Map<string, number>();
    
    timesheets.forEach(entry => {
      const date = typeof entry.date === 'string' ? new Date(entry.date) : entry.date;
      
      // Validierung: Gültiges Datum und gültige Stunden
      if (isNaN(date.getTime())) return; // Ungültiges Datum überspringen
      if (!Number.isFinite(entry.totalHours) || entry.totalHours < 0) return; // Ungültige Stunden überspringen
      
      const weekKey = this.getWeekKey(date);
      const currentHours = weeklyHours.get(weekKey) || 0;
      weeklyHours.set(weekKey, currentHours + entry.totalHours);
    });
    
    // Prüfe jede Woche
    weeklyHours.forEach((hours, weekKey) => {
      if (hours > this.MAX_WEEKLY_HOURS) {
        // Finde das erste Datum dieser Woche für die Violation
        const weekDate = timesheets.find(entry => {
          const date = typeof entry.date === 'string' ? new Date(entry.date) : entry.date;
          if (isNaN(date.getTime())) return false;
          return this.getWeekKey(date) === weekKey;
        });
        const violationDate = weekDate ? (typeof weekDate.date === 'string' ? new Date(weekDate.date) : weekDate.date) : new Date();
        
        violations.push({
          type: 'weekly',
          date: violationDate,
          message: `Wöchentliche Arbeitszeit ${hours.toFixed(2)}h überschreitet 40h/Woche (${weekKey})`,
          severity: hours > 48 ? 'error' : 'warning', // >48h = kritisch
        });
      }
    });
    
    return violations;
  }
  
  /**
   * Prüft Ruhezeiten (§5 ArbZG: 11h ununterbrochen)
   */
  private validateRestPeriods(timesheets: TimesheetEntry[]): ArbZGValidationResult['violations'] {
    const violations: ArbZGValidationResult['violations'] = [];
    
    if (timesheets.length < 2) return violations; // Mindestens 2 Timesheets nötig
    
    // Sortiere nach Datum und Endzeit (für Ruhezeit-Berechnung wichtig)
    const sorted = [...timesheets].sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
      const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
      
      // Validierung: Überspringe ungültige Daten
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0; // Behalte Reihenfolge bei ungültigen Daten
      }
      
      const timeA = this.getEndTime(a);
      const timeB = this.getEndTime(b);
      
      // Sortiere nach Endzeit (für Ruhezeit-Berechnung wichtig)
      if (timeA && timeB) {
        return timeA.getTime() - timeB.getTime();
      }
      // Fallback: Sortiere nach Datum
      return dateA.getTime() - dateB.getTime();
    });
    
    // Prüfe alle Paare von aufeinanderfolgenden Schichten
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      
      const currentEndTime = this.getEndTime(current);
      const nextStartTime = this.getStartTime(next);
      
      if (!currentEndTime || !nextStartTime) continue; // Überspringe wenn Zeitangaben fehlen
      
      // Berechne Ruhezeit zwischen Ende der aktuellen und Beginn der nächsten Schicht
      const restHours = this.calculateRestPeriod(currentEndTime, nextStartTime);
      
      // Prüfe nur, wenn die nächste Schicht nach der aktuellen endet (logische Reihenfolge)
      if (restHours < 0) continue; // Nächste Schicht beginnt vor Ende der aktuellen - wahrscheinlich Sortierungsproblem oder Überschneidung
      
      // Prüfe nur, wenn die nächste Schicht innerhalb von 48 Stunden beginnt
      // (um falsche Alarme bei großen Lücken zu vermeiden)
      if (restHours > 48) continue; // Zu große Lücke, wahrscheinlich kein aufeinanderfolgender Arbeitstag
      
      if (restHours < this.MIN_REST_PERIOD) {
        const currentDate = typeof current.date === 'string' ? new Date(current.date) : current.date;
        const nextDate = typeof next.date === 'string' ? new Date(next.date) : next.date;
        
        violations.push({
          type: 'rest',
          date: nextDate,
          message: `Ruhezeit ${restHours.toFixed(2)}h unterschreitet 11h zwischen ${currentDate.toLocaleDateString('de-DE')} ${currentEndTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} und ${nextDate.toLocaleDateString('de-DE')} ${nextStartTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`,
          severity: restHours < 9 ? 'error' : 'warning', // <9h = kritisch
        });
      }
    }
    
    return violations;
  }
  
  /**
   * Prüft Pausen (§4 ArbZG)
   */
  private validateBreaks(timesheets: TimesheetEntry[]): ArbZGValidationResult['violations'] {
    const violations: ArbZGValidationResult['violations'] = [];
    
    timesheets.forEach(entry => {
      const date = typeof entry.date === 'string' ? new Date(entry.date) : entry.date;
      
      // Validierung: Gültiges Datum und gültige Stunden
      if (isNaN(date.getTime())) return; // Ungültiges Datum überspringen
      if (!Number.isFinite(entry.totalHours) || entry.totalHours < 0) return; // Ungültige Stunden überspringen
      
      const hours = entry.totalHours;
      const breakMinutes = entry.breakMinutes || 0;
      
      // Validierung: Gültige Pausenzeit
      if (!Number.isFinite(breakMinutes) || breakMinutes < 0) return; // Ungültige Pausenzeit überspringen
      
      if (hours > 6 && hours <= 9) {
        // Bei >6h: Mindestens 30min Pause
        if (breakMinutes < this.BREAK_THRESHOLD_6H) {
          violations.push({
            type: 'break',
            date,
            message: `Pausenzeit ${breakMinutes}min unterschreitet 30min bei ${hours.toFixed(2)}h Arbeitszeit am ${date.toLocaleDateString('de-DE')}`,
            severity: 'warning',
          });
        }
      } else if (hours > 9) {
        // Bei >9h: Mindestens 45min Pause
        if (breakMinutes < this.BREAK_THRESHOLD_9H) {
          violations.push({
            type: 'break',
            date,
            message: `Pausenzeit ${breakMinutes}min unterschreitet 45min bei ${hours.toFixed(2)}h Arbeitszeit am ${date.toLocaleDateString('de-DE')}`,
            severity: 'error',
          });
        }
      }
    });
    
    return violations;
  }
  
  /**
   * Hilfsfunktion: Wochenschlüssel generieren (ISO 8601)
   * WICHTIG: Bei ISO 8601 wird das Jahr basierend auf dem Donnerstag der Woche bestimmt
   */
  private getWeekKey(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // 1 = Montag, 7 = Sonntag
    // Verschiebe zum Donnerstag dieser Woche (ISO 8601: Woche beginnt Montag, Donnerstag ist Tag 4)
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const isoYear = d.getUTCFullYear();
    const week = this.getWeekNumber(date);
    return `${isoYear}-W${week}`;
  }
  
  /**
   * Berechnet Kalenderwoche (ISO 8601)
   * ISO 8601: Woche 1 ist die Woche, die den 4. Januar enthält
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // 1 = Montag, 7 = Sonntag
    // Verschiebe zum Donnerstag dieser Woche (ISO 8601: Woche beginnt Montag, Donnerstag ist Tag 4)
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    // Finde den 4. Januar des Jahres, in dem dieser Donnerstag liegt
    const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const jan4DayNum = jan4.getUTCDay() || 7;
    // Finde den Donnerstag der Woche, die den 4. Januar enthält
    const jan4Thursday = new Date(jan4);
    jan4Thursday.setUTCDate(4 + (4 - jan4DayNum));
    // Berechne die Woche basierend auf dem Donnerstag
    const weekStart = new Date(jan4Thursday);
    weekStart.setUTCDate(jan4Thursday.getUTCDate() - 3); // Montag der Woche 1
    const diffMs = d.getTime() - weekStart.getTime();
    const week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
    // Sicherstellen, dass die Woche im gültigen Bereich liegt (1-53)
    return Math.max(1, Math.min(53, week));
  }
  
  /**
   * Extrahiert Endzeit aus Timesheet-Entry
   * Berücksichtigt Nachtschichten (über Mitternacht)
   */
  private getEndTime(entry: TimesheetEntry): Date | null {
    if (!entry.endTime || !entry.startTime) return null;
    
    try {
      const date = typeof entry.date === 'string' ? new Date(entry.date) : entry.date;
      if (isNaN(date.getTime())) return null; // Ungültiges Datum
      
      const endParts = entry.endTime.split(':');
      const startParts = entry.startTime.split(':');
      if (endParts.length < 2 || startParts.length < 2) return null; // Ungültiges Format
      
      const endHours = Number(endParts[0]);
      const endMinutes = Number(endParts[1] || 0);
      const startHours = Number(startParts[0]);
      const startMinutes = Number(startParts[1] || 0);
      
      // Validierung: Stunden zwischen 0-23, Minuten zwischen 0-59
      if (isNaN(endHours) || isNaN(endMinutes) || isNaN(startHours) || isNaN(startMinutes)) return null;
      if (endHours < 0 || endHours > 23 || endMinutes < 0 || endMinutes > 59) return null;
      if (startHours < 0 || startHours > 23 || startMinutes < 0 || startMinutes > 59) return null;
      
      const endTime = new Date(date);
      endTime.setHours(endHours, endMinutes, 0, 0);
      
      const startTime = new Date(date);
      startTime.setHours(startHours, startMinutes, 0, 0);
      
      // Nachtschicht-Handling: Wenn Endzeit (als Zeit) < Startzeit (als Zeit), dann ist Endzeit am nächsten Tag
      // Beispiel: Start 22:00, Ende 06:00 -> Endzeit ist am nächsten Tag
      if (endTime.getTime() < startTime.getTime()) {
        endTime.setDate(endTime.getDate() + 1);
      }
      
      return endTime;
    } catch (error) {
      logger.warn('Error parsing endTime', {}, { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }
  
  /**
   * Extrahiert Startzeit aus Timesheet-Entry
   */
  private getStartTime(entry: TimesheetEntry): Date | null {
    if (!entry.startTime) return null;
    
    try {
      const date = typeof entry.date === 'string' ? new Date(entry.date) : entry.date;
      if (isNaN(date.getTime())) return null; // Ungültiges Datum
      
      const parts = entry.startTime.split(':');
      if (parts.length < 2) return null; // Ungültiges Format
      
      const hours = Number(parts[0]);
      const minutes = Number(parts[1] || 0);
      
      // Validierung: Stunden zwischen 0-23, Minuten zwischen 0-59
      if (isNaN(hours) || isNaN(minutes)) return null;
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
      
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);
      return startTime;
    } catch (error) {
      logger.warn('Error parsing startTime', {}, { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }
  
  /**
   * Berechnet Ruhezeit zwischen zwei Zeitpunkten
   * Gibt Stunden zurück (kann negativ sein, wenn startTime vor endTime liegt)
   */
  private calculateRestPeriod(endTime: Date, startTime: Date): number {
    const diffMs = startTime.getTime() - endTime.getTime();
    return diffMs / (1000 * 60 * 60); // Stunden
  }
}

export const arbzgValidationService = new ArbZGValidationService();

