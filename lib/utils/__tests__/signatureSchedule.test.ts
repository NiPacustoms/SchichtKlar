import { describe, it, expect } from 'vitest';
import {
  calculateSignatureSchedule,
  isSignatureRequiredToday,
  toLocalDateKey,
  validateSignatureScheduleMaxBlock,
} from '../signatureSchedule';

// Feste Referenzdaten (lokale Zeit): Mo 06.07.2026 – So 12.07.2026
const MON = new Date(2026, 6, 6);
const WED = new Date(2026, 6, 8);
const SUN = new Date(2026, 6, 12);

describe('toLocalDateKey', () => {
  it('nutzt das lokale Datum (kein UTC-Versatz bei Mitternacht)', () => {
    // toISOString() hätte in Europe/Berlin (UTC+2) den Vortag geliefert
    expect(toLocalDateKey(new Date(2026, 6, 6, 0, 0, 0))).toBe('2026-07-06');
    expect(toLocalDateKey(new Date(2026, 6, 6, 23, 59, 59))).toBe('2026-07-06');
  });
});

describe('calculateSignatureSchedule', () => {
  it('Eintages-Einsatz: Signatur am Einsatztag selbst (nicht Tag 7 danach)', () => {
    const { requiredDates } = calculateSignatureSchedule(WED, WED);
    expect(requiredDates).toHaveLength(1);
    expect(toLocalDateKey(requiredDates[0])).toBe('2026-07-08');
  });

  it('kurzer Einsatz ohne Sonntag: Signatur am letzten Tag, nie nach Einsatzende', () => {
    // Mo–Mi (3 Tage, kein Sonntag im Zeitraum)
    const { requiredDates } = calculateSignatureSchedule(MON, WED);
    expect(requiredDates).toHaveLength(1);
    expect(toLocalDateKey(requiredDates[0])).toBe('2026-07-08');
  });

  it('kurzer Einsatz mit Sonntag: Signatur am Sonntag', () => {
    const { requiredDates } = calculateSignatureSchedule(MON, SUN);
    expect(requiredDates).toHaveLength(1);
    expect(toLocalDateKey(requiredDates[0])).toBe('2026-07-12');
  });

  it('langer Einsatz: jeden Sonntag + Ende, keine Duplikate, kein Block > 7 Tage', () => {
    // Mo 06.07. – Di 21.07. (16 Tage): Sonntage 12.07. + 19.07., Ende 21.07.
    const end = new Date(2026, 6, 21);
    const { requiredDates } = calculateSignatureSchedule(MON, end);
    expect(requiredDates.map(toLocalDateKey)).toEqual([
      '2026-07-12',
      '2026-07-19',
      '2026-07-21',
    ]);
    const check = validateSignatureScheduleMaxBlock(MON, end, requiredDates);
    expect(check.isValid).toBe(true);
  });

  it('Einsatzende am Sonntag erzeugt keinen doppelten Termin', () => {
    // Mo 06.07. – So 19.07. (14 Tage): Sonntage 12.07. + 19.07. = Ende
    const end = new Date(2026, 6, 19);
    const { requiredDates } = calculateSignatureSchedule(MON, end);
    expect(requiredDates.map(toLocalDateKey)).toEqual(['2026-07-12', '2026-07-19']);
  });
});

describe('isSignatureRequiredToday', () => {
  it('Eintages-Einsatz heute: Signatur ist heute fällig', () => {
    const today = new Date();
    expect(isSignatureRequiredToday(today, today, [])).toBe(true);
  });

  it('bereits gesammelte Signatur (lokaler Date-Key) wird erkannt', () => {
    const today = new Date();
    const todayKey = toLocalDateKey(today);
    expect(isSignatureRequiredToday(today, today, [todayKey])).toBe(false);
  });
});

describe('validateSignatureScheduleMaxBlock (Regel 8: max. 7 Tage)', () => {
  it('meldet Einsätze über 7 Tage ohne Signaturtermine', () => {
    const end = new Date(2026, 6, 21);
    const check = validateSignatureScheduleMaxBlock(MON, end, []);
    expect(check.isValid).toBe(false);
    expect(check.violations[0]).toContain('ohne Signaturtermine');
  });

  it('meldet Blöcke über 7 Tage zwischen Signaturterminen', () => {
    const end = new Date(2026, 6, 26);
    // Nur ein Termin am Ende → Block 06.–26.07. = 21 Tage
    const check = validateSignatureScheduleMaxBlock(MON, end, [end]);
    expect(check.isValid).toBe(false);
  });

  it('akzeptiert den generierten Zeitplan', () => {
    const end = new Date(2026, 6, 31);
    const { requiredDates } = calculateSignatureSchedule(MON, end);
    expect(validateSignatureScheduleMaxBlock(MON, end, requiredDates).isValid).toBe(true);
  });
});
