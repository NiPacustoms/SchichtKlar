/**
 * Krankmeldungen – reine Logik ohne Firebase.
 *
 * Datenmodell absences/{id}:
 *   companyId, userId, type: 'sick'
 *   fromKey, toKey: 'YYYY-MM-DD' (deutsche Kalendertage, inklusive)
 *   status: 'reported' (gilt sofort, keine Genehmigung) | 'cancelled'
 *   auProvided (Arbeitsunfähigkeit ärztlich festgestellt)
 *
 * Eine Urlaubsverwaltung gibt es bewusst nicht. Krankmeldungen enthalten
 * keine Diagnose: Für die Entgeltfortzahlung genügen Beginn und
 * voraussichtliche Dauer (§ 5 EFZG); Gesundheitsdaten dürfen nicht abgefragt
 * werden (Art. 9 DSGVO).
 */

export type AbsenceType = 'sick';
export type AbsenceStatus = 'reported' | 'cancelled';

export interface Absence {
  id: string;
  companyId: string;
  userId: string;
  type: AbsenceType;
  fromKey: string;
  toKey: string;
  status: AbsenceStatus;
  auProvided?: boolean;
  createdAt?: Date;
}

/** Diese Status machen eine Person in der Planung nicht verfügbar */
export const BLOCKING_ABSENCE_STATUSES: AbsenceStatus[] = ['reported'];

const KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDayKey(k: string): boolean {
  if (!KEY.test(k)) return false;
  const d = new Date(`${k}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === k;
}

export function absenceCoversDay(a: Pick<Absence, 'fromKey' | 'toKey'>, dayKey: string): boolean {
  return a.fromKey <= dayKey && dayKey <= a.toKey;
}

export function absencesOverlap(a: Pick<Absence, 'fromKey' | 'toKey'>, b: Pick<Absence, 'fromKey' | 'toKey'>): boolean {
  return a.fromKey <= b.toKey && b.fromKey <= a.toKey;
}

/** Alle Kalendertage zwischen from und to (inklusive) als Schlüssel */
export function daysBetween(fromKey: string, toKey: string): string[] {
  const out: string[] = [];
  const d = new Date(`${fromKey}T12:00:00Z`);
  const end = new Date(`${toKey}T12:00:00Z`);
  for (let i = 0; d <= end && i < 400; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export const deDate = (k: string) => {
  const [y, m, d] = k.split('-');
  return `${d}.${m}.${y}`;
};
export const deRange = (from: string, to: string) => (from === to ? deDate(from) : `${deDate(from)} – ${deDate(to)}`);

export const ABSENCE_STATUS_LABEL: Record<AbsenceStatus, string> = {
  reported: 'Gemeldet',
  cancelled: 'Zurückgezogen',
};
