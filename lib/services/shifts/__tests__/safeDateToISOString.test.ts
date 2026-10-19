import { describe, expect, it } from 'vitest';
import { safeDateToISOString } from '../types';

describe('safeDateToISOString', () => {
  it('liefert den deutschen Kalendertag für Mitternacht Europe/Berlin (Sommerzeit)', () => {
    // 19.10.2026 00:00 Berlin = 18.10.2026 22:00 UTC
    expect(safeDateToISOString(new Date('2026-10-18T22:00:00Z'))).toBe('2026-10-19');
  });
  it('liefert den deutschen Kalendertag im Winter', () => {
    // 02.11.2026 00:00 Berlin = 01.11.2026 23:00 UTC
    expect(safeDateToISOString(new Date('2026-11-01T23:00:00Z'))).toBe('2026-11-02');
  });
  it('akzeptiert Firestore-Timestamps', () => {
    expect(safeDateToISOString({ toDate: () => new Date('2026-10-18T22:00:00Z') })).toBe('2026-10-19');
  });
});
