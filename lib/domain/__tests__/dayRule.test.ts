import { describe, expect, it } from 'vitest';
import {
  berlinDayKey,
  DayRuleConflictError,
  findSameDayConflicts,
  getDayRuleConflict,
  isValidOverrideReason,
  toDayKey,
} from '../dayRule';

describe('dayRule – Berliner Kalendertag', () => {
  it('ordnet Berliner Mitternacht dem richtigen Tag zu (nicht dem UTC-Vortag)', () => {
    // 01.01.2026 00:30 Berlin = 31.12.2025 23:30 UTC
    expect(berlinDayKey(new Date('2025-12-31T23:30:00Z'))).toBe('2026-01-01');
  });

  it('berücksichtigt Sommerzeit', () => {
    // 18.10.2026 00:15 Berlin (CEST, UTC+2) = 17.10.2026 22:15 UTC
    expect(berlinDayKey(new Date('2026-10-17T22:15:00Z'))).toBe('2026-10-18');
  });

  it('normalisiert Firestore-Formen', () => {
    expect(toDayKey('2026-10-18')).toBe('2026-10-18');
    expect(toDayKey({ toDate: () => new Date('2026-10-17T22:00:00Z') })).toBe('2026-10-18');
    expect(toDayKey({ seconds: Date.parse('2026-10-17T22:00:00Z') / 1000 })).toBe('2026-10-18');
    expect(toDayKey(null)).toBeNull();
    expect(toDayKey('kein datum')).toBeNull();
  });
});

describe('dayRule – Konflikte', () => {
  const existing = [
    { id: 'a1', dayKey: '2026-10-18', status: 'accepted' },
    { id: 'a2', dayKey: '2026-10-18', status: 'declined' },
    { id: 'a3', dayKey: '2026-10-19', status: 'assigned' },
    { id: 'a4', dayKey: '2026-10-18', status: 'pending-signature' },
  ];

  it('findet nur aktive Einsätze am selben Tag', () => {
    expect(findSameDayConflicts({ dayKey: '2026-10-18' }, existing)).toEqual(['a1', 'a4']);
  });

  it('ignoriert den Einsatz selbst (z. B. beim Annehmen)', () => {
    expect(findSameDayConflicts({ dayKey: '2026-10-18', excludeId: 'a1' }, existing)).toEqual(['a4']);
  });

  it('erlaubt Einsätze an anderen Tagen', () => {
    expect(findSameDayConflicts({ dayKey: '2026-10-20' }, existing)).toEqual([]);
  });
});

describe('dayRule – Admin-Übersteuerung', () => {
  it('verlangt eine echte Begründung', () => {
    expect(isValidOverrideReason('')).toBe(false);
    expect(isValidOverrideReason('   ok    ')).toBe(false);
    expect(isValidOverrideReason('Geteilter Dienst, mit PDL abgestimmt')).toBe(true);
  });

  it('erkennt Konflikte aus Callable-Fehlern und lokalen Fehlern', () => {
    const callableError = { message: 'x', details: { code: 'DAY_RULE_CONFLICT', dayKey: '2026-10-18', conflictingAssignmentIds: ['a1'] } };
    expect(getDayRuleConflict(callableError)?.conflictingAssignmentIds).toEqual(['a1']);
    const local = new DayRuleConflictError('2026-10-18', ['a1']);
    expect(getDayRuleConflict(local)?.message).toContain('18.10.2026');
    expect(getDayRuleConflict(new Error('anders'))).toBeNull();
  });
});
