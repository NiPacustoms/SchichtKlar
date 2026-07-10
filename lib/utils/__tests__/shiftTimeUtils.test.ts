import { describe, expect, it } from 'vitest';
import {
  getTimeTrackingWindow,
  TIME_TRACKING_ALLOWED_MINUTES_BEFORE_START,
  parseShiftToUTC,
} from '../shiftTimeUtils';

describe('getTimeTrackingWindow', () => {
  const shiftDate = new Date('2025-02-03T00:00:00.000Z'); // 3. Feb 2025 (Datum für Schicht)
  const startTime = '07:00';
  const endTime = '15:00';
  const tz = 'Europe/Berlin';

  it('gibt too_early zurück, wenn jetzt vor dem erlaubten Fenster liegt', () => {
    // 15 min vor Start = 06:45 Berlin; 06:44 Berlin = zu früh
    // Feb: Berlin UTC+1 → 06:44 Berlin = 05:44 UTC
    const now = new Date('2025-02-03T05:44:00.000Z');
    const result = getTimeTrackingWindow(now, shiftDate, startTime, endTime, tz);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('too_early');
  });

  it('gibt ok zurück, wenn jetzt genau am Fensterstart (15 min vor Start) liegt', () => {
    const now = new Date('2025-02-03T05:45:00.000Z'); // 06:45 Berlin
    const result = getTimeTrackingWindow(now, shiftDate, startTime, endTime, tz);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('ok');
  });

  it('gibt ok zurück, wenn jetzt während der Schicht liegt', () => {
    const now = new Date('2025-02-03T10:00:00.000Z'); // 11:00 Berlin
    const result = getTimeTrackingWindow(now, shiftDate, startTime, endTime, tz);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('ok');
  });

  it('gibt too_late zurück, wenn jetzt nach Schichtende liegt', () => {
    const now = new Date('2025-02-03T14:01:00.000Z'); // 15:01 Berlin
    const result = getTimeTrackingWindow(now, shiftDate, startTime, endTime, tz);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('too_late');
  });

  it('respektiert benutzerdefinierte Minuten vor Start', () => {
    // 06:49 Berlin: im 15-min-Fenster (ab 06:45) erlaubt, im 10-min-Fenster (ab 06:50) noch zu früh.
    const now = new Date('2025-02-03T05:49:00.000Z');
    const resultDefault = getTimeTrackingWindow(now, shiftDate, startTime, endTime, tz, 15, 0);
    const resultCustom = getTimeTrackingWindow(now, shiftDate, startTime, endTime, tz, 10, 0);
    expect(resultDefault.allowed).toBe(true);
    expect(resultCustom.allowed).toBe(false);
    expect(resultCustom.reason).toBe('too_early');
  });
});

describe('parseShiftToUTC', () => {
  it('berechnet Übernacht-Schicht (Ende am Folgetag)', () => {
    const date = new Date('2025-02-03T00:00:00.000Z');
    const { startUTC, endUTC, isOvernight } = parseShiftToUTC(date, '22:00', '06:00', 'Europe/Berlin');
    expect(isOvernight).toBe(true);
    expect(startUTC.getUTCHours()).toBe(21); // 22:00 Berlin = 21:00 UTC (Feb)
    expect(endUTC.getUTCDate()).toBe(4); // 06:00 nächster Tag
  });

  it('verwendet Standard-Zeitzone Europe/Berlin', () => {
    const date = new Date('2025-02-03T00:00:00.000Z');
    const { startUTC } = parseShiftToUTC(date, '07:00', '15:00');
    expect(startUTC.getUTCHours()).toBe(6); // 07:00 Berlin = 06:00 UTC
  });
});

describe('TIME_TRACKING constants', () => {
  it('TIME_TRACKING_ALLOWED_MINUTES_BEFORE_START ist 15', () => {
    expect(TIME_TRACKING_ALLOWED_MINUTES_BEFORE_START).toBe(15);
  });
});
