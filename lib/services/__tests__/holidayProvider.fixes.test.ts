import { describe, expect, it } from 'vitest';
import { holidayProvider } from '../holidayProvider';

function toKeys(dates: Date[]): string[] {
  return dates.map(d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
}

describe('holidayProvider – Logik-Fixes (11.07.2026)', () => {
  it('Pfingstmontag 2026 ist der 25.05. (Ostern+50, nicht +49 = Pfingstsonntag)', async () => {
    const k = toKeys(await holidayProvider.getHolidays(2026));
    expect(k).toContain('2026-05-25');
    expect(k).not.toContain('2026-05-24');
  });

  it('Buß- und Bettag 2022: 23.11. war selbst ein Mittwoch → Feiertag ist der 16.11.', async () => {
    const k = toKeys(await holidayProvider.getHolidays(2022, 'SN'));
    expect(k).toContain('2022-11-16');
    expect(k).not.toContain('2022-11-23');
  });

  it('Reformationstag gilt seit 2018 auch in HB/HH/NI/SH', async () => {
    for (const state of ['HB', 'HH', 'NI', 'SH']) {
      const k = toKeys(await holidayProvider.getHolidays(2026, state));
      expect(k, `Reformationstag fehlt für ${state}`).toContain('2026-10-31');
    }
  });

  it('Berlin: Internationaler Frauentag (08.03.) seit 2019; nicht in Bayern', async () => {
    expect(toKeys(await holidayProvider.getHolidays(2026, 'BE'))).toContain('2026-03-08');
    expect(toKeys(await holidayProvider.getHolidays(2026, 'BY'))).not.toContain('2026-03-08');
  });

  it('Thüringen: Weltkindertag (20.09.) seit 2019', async () => {
    expect(toKeys(await holidayProvider.getHolidays(2026, 'TH'))).toContain('2026-09-20');
  });
});
