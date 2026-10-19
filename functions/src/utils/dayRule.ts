import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Geschäftsregel „1 Einsatz pro Kalendertag" (KNOWN_LIMITATIONS C1).
 *
 * Eine Person darf an einem Kalendertag (Europe/Berlin) nur einen aktiven
 * Einsatz haben. Ein Admin darf mit schriftlicher Begründung übersteuern
 * (z. B. geteilter Dienst); die Begründung wird am Einsatz und im Audit-Log
 * gespeichert.
 *
 * SERVER-SPIEGEL von lib/domain/dayRule.ts (Functions können lib/ nicht
 * importieren). Reine Logik dort ändern und hierher übernehmen; darunter
 * folgen die Firestore-Helfer.
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

export interface DayRuleOverride {
  reason: string;
  by: string;
  at: Date;
}

/** Ermittelt den Einsatztag: eigenes startDate oder Datum der verknüpften Schicht. */
export async function resolveAssignmentDayKey(
  db: Firestore,
  assignment: Record<string, unknown>,
  tx?: Transaction
): Promise<string | null> {
  const own = toDayKey(assignment.startDate);
  if (own) return own;
  const shiftId = assignment.shiftId;
  if (typeof shiftId !== 'string' || !shiftId) return null;
  const ref = db.collection('shifts').doc(shiftId);
  const snap = tx ? await tx.get(ref) : await ref.get();
  return snap.exists ? toDayKey(snap.get('date')) : null;
}

/**
 * Sucht aktive Einsätze derselben Person am selben Berliner Kalendertag
 * (innerhalb der Firma). Bei Übergabe einer Transaktion laufen alle Reads
 * darin – Reads müssen dann vor den Writes der Transaktion erfolgen.
 */
export async function findDayRuleConflicts(
  db: Firestore,
  params: { userId: string; companyId: string; dayKey: string; excludeAssignmentId?: string },
  tx?: Transaction
): Promise<string[]> {
  const q = db
    .collection('assignments')
    .where('companyId', '==', params.companyId)
    .where('userId', '==', params.userId)
    .where('status', 'in', [...DAY_RULE_ACTIVE_STATUSES]);
  const snap = tx ? await tx.get(q) : await q.get();

  const entries: DayRuleEntry[] = [];
  for (const d of snap.docs) {
    if (d.id === params.excludeAssignmentId) continue;
    const data = d.data();
    entries.push({ id: d.id, status: String(data.status), dayKey: await resolveAssignmentDayKey(db, data, tx) });
  }
  return findSameDayConflicts({ dayKey: params.dayKey, excludeId: params.excludeAssignmentId }, entries);
}

/** Einheitlicher Callable-Fehler – der Client erkennt ihn an details.code. */
export function dayRuleConflictError(dayKey: string, conflictingAssignmentIds: string[], adminMayOverride: boolean): HttpsError {
  const base = `Für den ${formatDayKeyDE(dayKey)} ist bereits ein Einsatz eingeplant (1 Einsatz pro Tag).`;
  return new HttpsError(
    'failed-precondition',
    adminMayOverride ? `${base} Zum Übersteuern bitte eine Begründung angeben.` : base,
    { code: DAY_RULE_CONFLICT_CODE, dayKey, conflictingAssignmentIds, adminMayOverride }
  );
}
