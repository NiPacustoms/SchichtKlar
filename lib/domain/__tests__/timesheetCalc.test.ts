import { describe, expect, it } from 'vitest';
import { calculateTimesheet, describeTimesheetFlags, requiredBreakFor, TimesheetInputError } from '../timesheetCalc';

describe('calculateTimesheet', () => {
  it('Frühdienst mit 30 min Pause', () => {
    const r = calculateTimesheet('06:00', '14:00', 30);
    expect(r.totalHours).toBe(7.5);
    expect(r.flags).toEqual([]);
  });

  it('Nachtdienst über Mitternacht', () => {
    const r = calculateTimesheet('21:00', '06:30', 45);
    expect(r.grossMinutes).toBe(570);
    expect(r.totalHours).toBe(8.75);
    expect(r.flags).toEqual(['OVER_8H']);
  });

  it('Beginn gleich Ende ist ein laufender Dienst, keine 24 h', () => {
    const r = calculateTimesheet('06:00', '06:00', 0);
    expect(r.running).toBe(true);
    expect(r.totalHours).toBe(0);
  });

  it('meldet fehlende Pflichtpause (§ 4 ArbZG)', () => {
    const r = calculateTimesheet('06:00', '14:00', 0);
    expect(r.flags).toContain('BREAK_TOO_SHORT');
    expect(r.breakShortfallMinutes).toBe(30);
    expect(describeTimesheetFlags(r)[0]).toMatch(/30 min vorgeschrieben/);
  });

  it('20 min Pause bei 6:20 Anwesenheit ist ausreichend (Arbeit genau 6 h)', () => {
    const r = calculateTimesheet('08:00', '14:20', 20);
    expect(r.workMinutes).toBe(360);
    expect(r.flags).not.toContain('BREAK_TOO_SHORT');
  });

  it('über 9 h Arbeit verlangt 45 min', () => {
    const r = calculateTimesheet('06:00', '16:00', 30);
    expect(r.requiredBreakMinutes).toBe(45);
    expect(r.breakShortfallMinutes).toBe(15);
  });

  it('meldet mehr als 10 h', () => {
    expect(calculateTimesheet('06:00', '17:30', 45).flags).toContain('OVER_10H');
  });

  it('lehnt Pause länger als Dienst ab statt negativer Stunden', () => {
    expect(() => calculateTimesheet('06:00', '06:30', 45)).toThrow(TimesheetInputError);
  });

  it('lehnt ungültige Uhrzeiten ab statt NaN zu speichern', () => {
    expect(() => calculateTimesheet('6 Uhr', '14:00', 0)).toThrow(/Ungültige Uhrzeit/);
    expect(() => calculateTimesheet('24:00', '14:00', 0)).toThrow(TimesheetInputError);
  });

  it('lehnt negative oder gebrochene Pausen ab', () => {
    expect(() => calculateTimesheet('06:00', '14:00', -5)).toThrow(/Pause/);
    expect(() => calculateTimesheet('06:00', '14:00', 12.5)).toThrow(/Pause/);
  });
});

describe('requiredBreakFor', () => {
  it.each([
    [360, 0],
    [361, 30],
    [540, 30],
    [541, 45],
  ])('%i min Arbeit → %i min Pause', (work, br) => expect(requiredBreakFor(work)).toBe(br));
});
