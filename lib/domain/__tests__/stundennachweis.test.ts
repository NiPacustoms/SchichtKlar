import { describe, expect, it } from 'vitest';
import { buildMonthlyStatement, monthRangeKeys, shiftMonth, statementSignState, type StatementSheet } from '../stundennachweis';

const sheet = (id: string, dayKey: string, start: string, end: string, pause: number, hours: number, extra: Partial<StatementSheet> = {}): StatementSheet => ({
  id,
  dayKey,
  startTime: start,
  endTime: end,
  breakMinutes: pause,
  totalHours: hours,
  status: 'approved',
  facilityName: 'Caritas St. Michael',
  station: 'Station Wasser',
  ...extra,
});

describe('Monatlicher Stundennachweis', () => {
  it('bildet den Papierbogen ab: Pause in Stunden, Dauer, Summe', () => {
    const s = buildMonthlyStatement('2026-09', [
      sheet('a', '2026-09-03', '13:30', '21:15', 30, 7.25),
      sheet('b', '2026-09-22', '07:00', '13:00', 30, 5.5, { facilityName: 'PE Kirsch', station: undefined }),
      sheet('c', '2026-09-24', '07:00', '11:30', 30, 4),
      sheet('x', '2026-10-01', '07:00', '11:30', 30, 4), // anderer Monat
      sheet('r', '2026-09-25', '07:00', '11:30', 30, 4, { status: 'rejected' }),
    ]);
    expect(s.rows.map(r => r.dayKey)).toEqual(['2026-09-03', '2026-09-22', '2026-09-24']);
    expect(s.rows[0]).toMatchObject({ begin: '13:30', end: '21:15', pauseHours: 0.5, hours: 7.25 });
    expect(s.rows[0].remark).toContain('Caritas St. Michael · Station Wasser');
    expect(s.totals.hours).toBe(16.75);
    expect(s.totals.byFacility).toEqual([
      { name: 'Caritas St. Michael', hours: 11.25 },
      { name: 'PE Kirsch', hours: 5.5 },
    ]);
    expect(s.allApproved).toBe(true);
  });

  it('trennt freigegebene und offene Stunden', () => {
    const s = buildMonthlyStatement('2026-09', [sheet('a', '2026-09-03', '07:00', '15:00', 30, 7.5), sheet('b', '2026-09-04', '07:00', '15:00', 30, 7.5, { status: 'submitted' })]);
    expect(s.totals).toMatchObject({ hours: 15, approvedHours: 7.5, openHours: 7.5 });
    expect(s.allApproved).toBe(false);
  });

  it('zählt Diensttage, keine Krank- oder Urlaubszeilen', () => {
    const s = buildMonthlyStatement('2026-10', [sheet('a', '2026-10-17', '07:00', '15:00', 30, 7.5)]);
    expect(s.rows.length).toBe(1);
    expect(s.rows[0]).not.toHaveProperty('zusatz');
    expect(s.totals).toMatchObject({ workDays: 1 });
    expect(s.totals).not.toHaveProperty('sickDays');
  });

  it('Fingerabdruck erkennt Änderungen nach der Unterschrift', () => {
    const a = buildMonthlyStatement('2026-09', [sheet('a', '2026-09-03', '07:00', '15:00', 30, 7.5)]);
    const b = buildMonthlyStatement('2026-09', [sheet('a', '2026-09-03', '07:00', '15:30', 30, 8)]);
    expect(a.fingerprint).not.toBe(b.fingerprint);
    const signed = { employeeSignedAt: new Date(), signedFingerprint: a.fingerprint };
    expect(statementSignState(a, signed)).toBe('employee-signed');
    expect(statementSignState(b, signed)).toBe('changed');
    expect(statementSignState(a, { ...signed, employerSignedAt: new Date() })).toBe('acknowledged');
    expect(statementSignState(a, null)).toBe('open');
  });

  it('Monatsgrenzen', () => {
    expect(monthRangeKeys('2028-02')).toEqual({ fromKey: '2028-02-01', toKey: '2028-02-29' });
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});
