import { describe, expect, it } from 'vitest';
import { computeWorkHoursBreakdown, getHolidayKeys } from '../src/utils/workHoursBreakdown';
import { parseShiftToUTC } from '../src/utils/timeUtils';

// Schichtdatum wie im Client gespeichert: Mitternacht Europe/Berlin
const berlinMidnight = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  // Sommerzeit (UTC+2) bis 25.10.2026, danach UTC+1
  const offsetH = iso >= '2026-10-25' || iso < '2026-03-29' ? 1 : 2;
  return new Date(d.getTime() - offsetH * 3600_000);
};

describe('computeWorkHoursBreakdown (deutsche Zeit, unabhängig von Server-TZ)', () => {
  it('Frühdienst an einem Werktag hat keine Nachtstunden', () => {
    const { startUTC, endUTC } = parseShiftToUTC(berlinMidnight('2026-10-19'), '06:00', '14:00');
    const b = computeWorkHoursBreakdown(startUTC, endUTC, 30);
    expect(b.totalHours).toBe(7.5);
    expect(b.nightHours).toBe(0);
    expect(b.weekendHours).toBe(0);
  });

  it('Nachtdienst 21:00–06:30: 7 h im Nachtfenster 23–6 vor Pause', () => {
    const { startUTC, endUTC } = parseShiftToUTC(berlinMidnight('2026-10-20'), '21:00', '06:30');
    const b = computeWorkHoursBreakdown(startUTC, endUTC, 0);
    expect(b.totalHours).toBe(9.5);
    expect(b.nightHours).toBe(7);
  });

  it('Sonntagsdienst zählt als Sonntag (nicht Samstag wegen UTC-Versatz)', () => {
    const { startUTC, endUTC } = parseShiftToUTC(berlinMidnight('2026-10-18'), '06:00', '14:00');
    const b = computeWorkHoursBreakdown(startUTC, endUTC, 0, 20);
    expect(b.sundayHours).toBe(8);
    expect(b.saturdayHours).toBe(0);
    expect(b.surchargeAmount).toBe(80); // 8 h × 20 € × 50 %
  });

  it('Samstag-Nacht → Sonntag teilt korrekt an Mitternacht', () => {
    const { startUTC, endUTC } = parseShiftToUTC(berlinMidnight('2026-10-17'), '22:00', '06:00');
    const b = computeWorkHoursBreakdown(startUTC, endUTC, 0);
    expect(b.saturdayHours).toBe(2);
    expect(b.sundayHours).toBe(6);
  });

  it('Zeitumstellung: Nacht 24./25.10. ist eine Stunde länger', () => {
    const { startUTC, endUTC } = parseShiftToUTC(berlinMidnight('2026-10-24'), '22:00', '06:00');
    const b = computeWorkHoursBreakdown(startUTC, endUTC, 0);
    expect(b.totalHours).toBe(9);
  });

  it('Allerheiligen ist Feiertag in NRW, aber nicht bundesweit', () => {
    const { startUTC, endUTC } = parseShiftToUTC(berlinMidnight('2027-11-01'), '06:00', '14:00');
    expect(computeWorkHoursBreakdown(startUTC, endUTC, 0, 20, 'NW').holidayHours).toBe(8);
    expect(computeWorkHoursBreakdown(startUTC, endUTC, 0, 20).holidayHours).toBe(0);
  });
});

describe('getHolidayKeys', () => {
  it('kennt Fronleichnam 2026 in NRW', () => {
    expect(getHolidayKeys(2026, 'NW').has('2026-06-04')).toBe(true);
    expect(getHolidayKeys(2026).has('2026-06-04')).toBe(false);
  });
  it('kennt Ostermontag 2026', () => {
    expect(getHolidayKeys(2026).has('2026-04-06')).toBe(true);
  });
  it('Buß- und Bettag in Sachsen 2022 ist der 16.11.', () => {
    expect(getHolidayKeys(2022, 'SN').has('2022-11-16')).toBe(true);
  });
});
