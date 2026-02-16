// Feiertags-Service für automatische Feiertagserkennung
// Unterstützt alle deutschen Bundesländer
import { logger } from '@/lib/logging';

export type GermanState = 
  | 'BW' // Baden-Württemberg
  | 'BY' // Bayern
  | 'BE' // Berlin
  | 'BB' // Brandenburg
  | 'HB' // Bremen
  | 'HH' // Hamburg
  | 'HE' // Hessen
  | 'MV' // Mecklenburg-Vorpommern
  | 'NI' // Niedersachsen
  | 'NW' // Nordrhein-Westfalen
  | 'RP' // Rheinland-Pfalz
  | 'SL' // Saarland
  | 'SN' // Sachsen
  | 'ST' // Sachsen-Anhalt
  | 'SH' // Schleswig-Holstein
  | 'TH'; // Thüringen

export interface Holiday {
  date: Date;
  name: string;
  state?: GermanState; // undefined = bundesweit
  states: GermanState[]; // Alle Bundesländer, in denen der Feiertag gilt
}

export class HolidayService {
  private holidaysCache: Map<number, Holiday[]> = new Map(); // Cache pro Jahr
  
  /**
   * Ruft Feiertage für ein Jahr und Bundesland ab
   * Nutzt externe API oder lokale Berechnung
   */
  async getHolidays(year: number, state: GermanState): Promise<Holiday[]> {
    // Prüfe Cache
    const cacheKey = year;
    if (this.holidaysCache.has(cacheKey)) {
      const cached = this.holidaysCache.get(cacheKey)!;
      return cached.filter(h => !h.state || h.states.includes(state));
    }
    
    try {
      // Versuche externe API (z.B. feiertage-api.de)
      const apiUrl = process.env.NEXT_PUBLIC_HOLIDAY_API_URL || 'https://feiertage-api.de/api';
      const response = await fetch(`${apiUrl}?jahr=${year}&nur_land=${state}`);
      
      if (response.ok) {
        const data = await response.json();
        const holidays = this.parseHolidayAPIResponse(data, year);
        this.holidaysCache.set(cacheKey, holidays);
        return holidays.filter(h => !h.state || h.states.includes(state));
      }
    } catch (error) {
      logger.warn('Feiertags-API nicht verfügbar, verwende lokale Berechnung');
    }
    
    // Fallback: Lokale Berechnung
    const holidays = this.calculateHolidays(year, state);
    this.holidaysCache.set(cacheKey, holidays);
    return holidays;
  }
  
  /**
   * Prüft ob ein Datum ein Feiertag ist
   */
  async isHoliday(date: Date, state: GermanState): Promise<boolean> {
    const year = date.getFullYear();
    const holidays = await this.getHolidays(year, state);
    
    return holidays.some(holiday => {
      return holiday.date.toDateString() === date.toDateString();
    });
  }
  
  /**
   * Berechnet Feiertage lokal (Fallback)
   */
  private calculateHolidays(year: number, state: GermanState): Holiday[] {
    const holidays: Holiday[] = [];
    
    // Feste Feiertage (bundesweit)
    holidays.push(
      { date: new Date(year, 0, 1), name: 'Neujahr', states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'] },
      { date: new Date(year, 4, 1), name: 'Tag der Arbeit', states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'] },
      { date: new Date(year, 9, 3), name: 'Tag der Deutschen Einheit', states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'] },
      { date: new Date(year, 11, 25), name: '1. Weihnachtstag', states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'] },
      { date: new Date(year, 11, 26), name: '2. Weihnachtstag', states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'] },
    );
    
    // Bewegliche Feiertage (Ostern-basiert)
    const easter = this.calculateEaster(year);
    holidays.push(
      { date: this.addDays(easter, -2), name: 'Karfreitag', states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'] },
      { date: this.addDays(easter, 1), name: 'Ostermontag', states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'] },
      { date: this.addDays(easter, 39), name: 'Christi Himmelfahrt', states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'] },
      { date: this.addDays(easter, 49), name: 'Pfingstmontag', states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'] },
      { date: this.addDays(easter, 60), name: 'Fronleichnam', states: ['BW', 'BY', 'HE', 'NW', 'RP', 'SL'] }, // Nur katholische Bundesländer
    );
    
    // Bundesland-spezifische Feiertage
    if (state === 'BW' || state === 'BY' || state === 'ST') {
      holidays.push({ date: new Date(year, 0, 6), name: 'Heilige Drei Könige', states: [state] });
    }
    if (state === 'BY' || state === 'SL') {
      holidays.push({ date: new Date(year, 7, 15), name: 'Mariä Himmelfahrt', states: [state] });
    }
    if (state === 'BB' || state === 'MV' || state === 'SN' || state === 'ST' || state === 'TH') {
      holidays.push({ date: new Date(year, 9, 31), name: 'Reformationstag', states: [state] });
    }
    if (state === 'BY' || state === 'BW' || state === 'NW' || state === 'RP' || state === 'SL') {
      holidays.push({ date: new Date(year, 10, 1), name: 'Allerheiligen', states: [state] });
    }
    if (state === 'SN') {
      holidays.push({ date: new Date(year, 10, 17), name: 'Buß- und Bettag', states: [state] });
    }
    
    return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  /**
   * Berechnet Ostersonntag (Gauß'sche Osterformel)
   */
  private calculateEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    return new Date(year, month, day);
  }
  
  /**
   * Fügt Tage zu einem Datum hinzu
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  /**
   * Parst API-Response von feiertage-api.de
   */
  private parseHolidayAPIResponse(data: Record<string, { datum: string; hinweis: string }>, year: number): Holiday[] {
    const holidays: Holiday[] = [];
    
    Object.entries(data).forEach(([name, info]) => {
      const parsedDate = new Date(info.datum);
      const date = Number.isNaN(parsedDate.getTime()) ? new Date(year, 0, 1) : parsedDate;
      holidays.push({
        date,
        name,
        states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'], // Default: alle
      });
    });
    
    return holidays;
  }
  
  /**
   * Zählt Feiertage in einem Zeitraum
   */
  async countHolidays(startDate: Date, endDate: Date, state: GermanState): Promise<number> {
    const holidays = await this.getHolidays(startDate.getFullYear(), state);
    
    return holidays.filter(holiday => {
      return holiday.date >= startDate && holiday.date <= endDate;
    }).length;
  }
}

export const holidayService = new HolidayService();

