/**
 * Geschäftsregel „1 Einsatz pro Kalendertag" (KNOWN_LIMITATIONS C1).
 *
 * Eine Person darf an einem Kalendertag (Europe/Berlin) nur einen aktiven
 * Einsatz haben. Ein Admin darf mit schriftlicher Begründung übersteuern
 * (z. B. geteilter Dienst); die Begründung wird am Einsatz und im Audit-Log
 * gespeichert.
 *
 * Diese Datei ist rein (keine Firebase-Abhängigkeit) und wird 1:1 von
 * functions/src/utils/dayRule.ts gespiegelt – Änderungen dort mitziehen.
 */

/** Status, in denen ein Einsatz die Person an dem Tag belegt. */
export const DAY_RULE_ACTIVE_STATUSES = ['assigned', 'accepted', 'pending-signature'] as const;

/** Mindestlänge der Admin-Begründung (Zeichen, ohne Leerraum am Rand). */
export const DAY_RULE_MIN_REASON_LENGTH = 10;

/** Fehlercode, den Server und Client für Tagesregel-Konflikte verwenden. */
export const DAY_RULE_CONFLICT_CODE = 'DAY_RULE_CONFLICT';

const berlinFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Kalendertag in Europe/Berlin als YYYY-MM-DD – unabhängig von der Zeitzone des Geräts/Servers. */
export function berlinDayKey(date: Date): string {
  return berlinFormatter.format(date);
}

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalisiert die verschiedenen Datumsformen aus Firestore (Timestamp, Date,
 * ISO-String, reiner Tages-String) auf einen Berliner Tages-Key.
 */
export function toDayKey(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    if (DAY_KEY_RE.test(value)) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : berlinDayKey(parsed);
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : berlinDayKey(value);
  }
  const maybeTs = value as { toDate?: () => Date; seconds?: number };
  if (typeof maybeTs.toDate === 'function') return toDayKey(maybeTs.toDate());
  if (typeof maybeTs.seconds === 'number') return berlinDayKey(new Date(maybeTs.seconds * 1000));
  return null;
}

export function isDayRuleActiveStatus(status: unknown): boolean {
  return typeof status === 'string' && (DAY_RULE_ACTIVE_STATUSES as readonly string[]).includes(status);
}

export function isValidOverrideReason(reason: unknown): reason is string {
  return typeof reason === 'string' && reason.trim().length >= DAY_RULE_MIN_REASON_LENGTH;
}

export interface DayRuleEntry {
  id: string;
  dayKey: string | null;
  status: string;
}

/** IDs aller aktiven Einsätze am selben Tag (ohne den Einsatz selbst). */
export function findSameDayConflicts(
  target: { dayKey: string; excludeId?: string },
  existing: DayRuleEntry[]
): string[] {
  return existing
    .filter(e => e.id !== target.excludeId)
    .filter(e => isDayRuleActiveStatus(e.status))
    .filter(e => e.dayKey === target.dayKey)
    .map(e => e.id);
}

/** Deutsches Tagesformat für Meldungen: 2026-10-18 → 18.10.2026 */
export function formatDayKeyDE(dayKey: string): string {
  const [y, m, d] = dayKey.split('-');
  return `${d}.${m}.${y}`;
}

export class DayRuleConflictError extends Error {
  readonly code = DAY_RULE_CONFLICT_CODE;
  constructor(
    readonly dayKey: string,
    readonly conflictingAssignmentIds: string[]
  ) {
    super(`Für den ${formatDayKeyDE(dayKey)} ist bereits ein Einsatz eingeplant (1 Einsatz pro Tag).`);
    this.name = 'DayRuleConflictError';
  }
}

/** Erkennt einen Tagesregel-Konflikt in Fehlern von Callables (details.code) oder lokal geworfenen Fehlern. */
export function getDayRuleConflict(
  error: unknown
): { dayKey?: string; conflictingAssignmentIds: string[]; message: string } | null {
  if (error instanceof DayRuleConflictError) {
    return { dayKey: error.dayKey, conflictingAssignmentIds: error.conflictingAssignmentIds, message: error.message };
  }
  const e = error as { details?: { code?: string; dayKey?: string; conflictingAssignmentIds?: string[] }; message?: string };
  if (e?.details?.code === DAY_RULE_CONFLICT_CODE) {
    return {
      dayKey: e.details.dayKey,
      conflictingAssignmentIds: e.details.conflictingAssignmentIds ?? [],
      message: e.message || 'Für diesen Tag ist bereits ein Einsatz eingeplant.',
    };
  }
  return null;
}
