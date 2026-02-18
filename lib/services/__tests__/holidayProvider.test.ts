import { describe, expect, it } from 'vitest';
import { holidayProvider, type GermanStateCode } from '../holidayProvider';

describe('holidayProvider', () => {
  const year = 2025;

  function toIsoDates(dates: Date[]): string[] {
    return dates.map(date => date.toISOString().slice(0, 10));
  }

  it('liefert bundesweite Feiertage', async () => {
    const holidays = await holidayProvider.getHolidays(year);
    const isoDates = toIsoDates(holidays);

    expect(isoDates).toContain('2025-01-01'); // Neujahr
    expect(isoDates).toContain('2025-05-01'); // Tag der Arbeit
    expect(isoDates).toContain('2025-10-03'); // Tag der Deutschen Einheit
    expect(isoDates).toContain('2025-12-25'); // 1. Weihnachtstag
    expect(isoDates).toContain('2025-12-26'); // 2. Weihnachtstag
  });

  it('fügt bundeslandspezifische Feiertage hinzu', async () => {
    const holidays = await holidayProvider.getHolidays(year, 'BY');
    const isoDates = toIsoDates(holidays);

    expect(isoDates).toContain('2025-08-15'); // Mariä Himmelfahrt (Bayern)
  });

  it('berechnet dynamische Feiertage (Buß- und Bettag in SN)', async () => {
    const holidays = await holidayProvider.getHolidays(year, 'SN');
    const isoDates = toIsoDates(holidays);

    expect(isoDates).toContain('2025-11-19');
  });

  it('liefert neue Kopien bei wiederholten Aufrufen', async () => {
    const state: GermanStateCode = 'NW';
    const first = await holidayProvider.getHolidays(year, state);
    const originalLength = first.length;

    first.push(new Date('2099-01-01T12:00:00Z'));

    const second = await holidayProvider.getHolidays(year, state);

    expect(second.length).toBe(originalLength);
    expect(second.find(date => date.getUTCFullYear() === 2099)).toBeUndefined();
  });
});
