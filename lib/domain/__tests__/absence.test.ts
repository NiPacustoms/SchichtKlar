import { describe, expect, it } from 'vitest';
import { absenceCoversDay, absencesOverlap, daysBetween, deRange, isValidDayKey } from '../absence';

describe('Krankmeldungen', () => {
  it('Kalendertage inklusive Ende, über Monatswechsel', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });

  it('prüft gültige Datumsschlüssel', () => {
    expect(isValidDayKey('2026-02-29')).toBe(false);
    expect(isValidDayKey('2028-02-29')).toBe(true);
    expect(isValidDayKey('19.10.2026')).toBe(false);
  });

  it('deckt Tage inklusive Rand ab, erkennt Überschneidungen', () => {
    expect(absenceCoversDay({ fromKey: '2026-10-19', toKey: '2026-10-21' }, '2026-10-21')).toBe(true);
    expect(absenceCoversDay({ fromKey: '2026-10-19', toKey: '2026-10-21' }, '2026-10-22')).toBe(false);
    expect(absencesOverlap({ fromKey: '2026-10-19', toKey: '2026-10-21' }, { fromKey: '2026-10-21', toKey: '2026-10-25' })).toBe(true);
  });

  it('formatiert Zeiträume deutsch', () => {
    expect(deRange('2026-10-19', '2026-10-19')).toBe('19.10.2026');
    expect(deRange('2026-10-19', '2026-10-21')).toBe('19.10.2026 – 21.10.2026');
  });
});
