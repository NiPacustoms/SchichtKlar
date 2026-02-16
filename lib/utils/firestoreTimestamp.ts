/**
 * Type-Guard und Hilfsfunktionen für Firestore Timestamps
 * Vermeidet `as any` bei toDate()-Aufrufen.
 */

export interface TimestampLike {
  toDate(): Date;
}

export function isFirestoreTimestamp(value: unknown): value is TimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as TimestampLike).toDate === 'function'
  );
}

/**
 * Konvertiert Firestore Timestamp oder Date zu Date
 */
export function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (isFirestoreTimestamp(value)) return value.toDate();
  if (typeof value === 'string') return new Date(value);
  return new Date();
}
