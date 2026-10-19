import { describe, expect, it } from 'vitest';
import { absenceCoversDay, daysBetween, isValidDayKey, vacationBalance, vacationDays } from '../absence';

describe('Abwesenheiten', () => {
  it('zählt Urlaubstage Mo–Fr ohne Feiertage', () => {
    // 19.–25.10.2026: Mo–So → 5 Werktage
    expect(vacationDays('2026-10-19', '2026-10-25')).toBe(5);
    // Woche mit Tag der Deutschen Einheit (Sa 03.10.2026) ändert nichts, mit Feiertag am Werktag schon
    expect(vacationDays('2026-12-21', '2026-12-27', new Set(['2026-12-25', '2026-12-26']))).toBe(4);
  });

  it('Kalendertage inklusive Ende, über Monatswechsel', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });

  it('prüft gültige Datumsschlüssel', () => {
    expect(isValidDayKey('2026-02-29')).toBe(false);
    expect(isValidDayKey('2028-02-29')).toBe(true);
    expect(isValidDayKey('19.10.2026')).toBe(false);
  });

  it('deckt Tage inklusive Rand ab', () => {
    expect(absenceCoversDay({ fromKey: '2026-10-19', toKey: '2026-10-21' }, '2026-10-21')).toBe(true);
    expect(absenceCoversDay({ fromKey: '2026-10-19', toKey: '2026-10-21' }, '2026-10-22')).toBe(false);
  });

  it('Resturlaub: genommen, geplant, beantragt; abgelehnt zählt nicht', () => {
    const b = vacationBalance(
      2026,
      30,
      [
        { type: 'vacation', status: 'approved', fromKey: '2026-08-03', toKey: '2026-08-14' }, // 10 Tage vorbei
        { type: 'vacation', status: 'approved', fromKey: '2026-10-16', toKey: '2026-10-23' }, // Fr..Fr, heute Mo 19.
        { type: 'vacation', status: 'requested', fromKey: '2026-12-28', toKey: '2026-12-31' }, // 4 Tage
        { type: 'vacation', status: 'rejected', fromKey: '2026-11-02', toKey: '2026-11-06' },
        { type: 'sick', status: 'reported', fromKey: '2026-09-01', toKey: '2026-09-03' },
      ],
      '2026-10-19'
    );
    expect(b.taken).toBe(11); // 10 + Fr 16.10.
    expect(b.planned).toBe(5); // Mo 19. – Fr 23.
    expect(b.requested).toBe(4);
    expect(b.remaining).toBe(14);
  });

  it('Urlaub über den Jahreswechsel zählt nur im jeweiligen Jahr', () => {
    const b = vacationBalance(2027, 30, [{ type: 'vacation', status: 'approved', fromKey: '2026-12-28', toKey: '2027-01-08' }], '2027-06-01');
    expect(b.taken).toBe(6); // 04.–08.01. (5) + 01.01. ist Fr → ohne Feiertagsliste mitgezählt
  });
});
