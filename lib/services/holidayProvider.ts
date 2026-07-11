// Feiertags-Provider: berechnet deutsche Feiertage für beliebige Jahre.
// Optional V2: externe API (z. B. feiertage-api.de) für dynamische Daten.

export interface HolidayProvider {
  getHolidays(year: number, state?: string): Promise<Date[]>;
}

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

export class StaticHolidayProvider implements HolidayProvider {
  /**
   * Berechnet Feiertage für ein Jahr und optional Bundesland
   */
  async getHolidays(year: number, state?: string): Promise<Date[]> {
    const normalizedYear = Number.isFinite(year) ? Math.floor(year) : new Date().getFullYear();
    const holidays: Date[] = [];

    // Feste bundesweite Feiertage
    holidays.push(
      new Date(normalizedYear, 0, 1),   // Neujahr
      new Date(normalizedYear, 4, 1),   // Tag der Arbeit
      new Date(normalizedYear, 9, 3),   // Tag der Deutschen Einheit
      new Date(normalizedYear, 11, 25), // 1. Weihnachtsfeiertag
      new Date(normalizedYear, 11, 26), // 2. Weihnachtsfeiertag
    );

    // Bewegliche Feiertage (Ostern-basiert)
    const easter = this.calculateEaster(normalizedYear);
    holidays.push(
      this.addDays(easter, -2),  // Karfreitag
      this.addDays(easter, 1),   // Ostermontag
      this.addDays(easter, 39),  // Christi Himmelfahrt
      this.addDays(easter, 50),  // Pfingstmontag (Ostersonntag + 50)
    );

    // Bundesland-spezifische Feiertage
    if (state) {
      const normalizedState = state.toUpperCase() as GermanState;
      
      // Heilige Drei Könige (6. Januar)
      if (['BW', 'BY', 'ST'].includes(normalizedState)) {
        holidays.push(new Date(normalizedYear, 0, 6));
      }

      // Fronleichnam (60 Tage nach Ostern)
      if (['BW', 'BY', 'HE', 'NW', 'RP', 'SL'].includes(normalizedState)) {
        holidays.push(this.addDays(easter, 60));
      }

      // Mariä Himmelfahrt (15. August)
      if (['BY', 'SL'].includes(normalizedState)) {
        holidays.push(new Date(normalizedYear, 7, 15));
      }

      // Reformationstag (31. Oktober) – seit 2018 auch HB/HH/NI/SH
      if (['BB', 'HB', 'HH', 'MV', 'NI', 'SH', 'SN', 'ST', 'TH'].includes(normalizedState)) {
        holidays.push(new Date(normalizedYear, 9, 31));
      }

      // Internationaler Frauentag (8. März) – Berlin seit 2019, MV seit 2023
      if (['BE', 'MV'].includes(normalizedState) && normalizedYear >= 2019) {
        if (normalizedState === 'BE' || normalizedYear >= 2023) {
          holidays.push(new Date(normalizedYear, 2, 8));
        }
      }

      // Weltkindertag (20. September) – Thüringen seit 2019
      if (normalizedState === 'TH' && normalizedYear >= 2019) {
        holidays.push(new Date(normalizedYear, 8, 20));
      }

      // Allerheiligen (1. November)
      if (['BY', 'BW', 'NW', 'RP', 'SL'].includes(normalizedState)) {
        holidays.push(new Date(normalizedYear, 10, 1));
      }

      // Buß- und Bettag (Mittwoch vor dem 23. November, nur Sachsen)
      if (normalizedState === 'SN') {
        holidays.push(this.calculateBußUndBettag(normalizedYear));
      }
    }

    return holidays.sort((a, b) => a.getTime() - b.getTime());
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
   * Berechnet Buß- und Bettag (Mittwoch vor dem 23. November)
   */
  private calculateBußUndBettag(year: number): Date {
    const nov23 = new Date(year, 10, 23);
    const dayOfWeek = nov23.getDay();
    // Mittwoch = 3, also 3 Tage vorher
    // Mittwoch STRIKT vor dem 23.11.: fällt der 23.11. selbst auf einen
    // Mittwoch (z. B. 2022), ist es der 16.11. – daher || 7.
    const daysToSubtract = ((dayOfWeek + 4) % 7) || 7;
    return this.addDays(nov23, -daysToSubtract);
  }

  /**
   * Fügt Tage zu einem Datum hinzu
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

export const holidayProvider: HolidayProvider = new StaticHolidayProvider();



