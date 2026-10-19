/**
 * Abwesenheiten (Urlaub, Krankheit) – reine Logik ohne Firebase.
 *
 * Datenmodell absences/{id}:
 *   companyId, userId, type: 'vacation' | 'sick'
 *   fromKey, toKey: 'YYYY-MM-DD' (deutsche Kalendertage, inklusive)
 *   status: Urlaub 'requested' → 'approved' | 'rejected'; 'cancelled' durch Person
 *           Krankheit 'reported' (keine Genehmigung nötig), 'cancelled'
 *   note (ohne Diagnose!), auProvided (Bescheinigung liegt vor), decidedBy/At
 *
 * Krankmeldungen enthalten bewusst keine Diagnose: Für die Entgeltfortzahlung
 * genügen Beginn und voraussichtliche Dauer (§ 5 EFZG); Gesundheitsdaten
 * dürfen nicht abgefragt werden (Art. 9 DSGVO).
 */

export type AbsenceType = 'vacation' | 'sick';
export type AbsenceStatus = 'requested' | 'approved' | 'rejected' | 'reported' | 'cancelled';

export interface Absence {
  id: string;
  companyId: string;
  userId: string;
  type: AbsenceType;
  fromKey: string;
  toKey: string;
  status: AbsenceStatus;
  note?: string | null;
  auProvided?: boolean;
  decidedBy?: string | null;
  decidedAt?: Date | null;
  decisionNote?: string | null;
  createdAt?: Date;
}

/** Diese Status machen eine Person in der Planung nicht verfügbar */
export const BLOCKING_ABSENCE_STATUSES: AbsenceStatus[] = ['approved', 'reported'];

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

/**
 * Urlaubstage = Werktage Mo–Fr ohne gesetzliche Feiertage (5-Tage-Woche).
 * holidays: Menge von 'YYYY-MM-DD'.
 */
export function vacationDays(fromKey: string, toKey: string, holidays: Set<string> = new Set()): number {
  return daysBetween(fromKey, toKey).filter(k => {
    const dow = new Date(`${k}T12:00:00Z`).getUTCDay();
    return dow !== 0 && dow !== 6 && !holidays.has(k);
  }).length;
}

export interface VacationBalance {
  entitlement: number;
  taken: number;
  planned: number;
  requested: number;
  remaining: number;
}

/**
 * Resturlaub für ein Kalenderjahr. Genommen = genehmigt und vorbei,
 * geplant = genehmigt in der Zukunft, beantragt = noch offen.
 */
export function vacationBalance(
  year: number,
  entitlement: number,
  absences: Pick<Absence, 'type' | 'status' | 'fromKey' | 'toKey'>[],
  todayKey: string,
  holidays: Set<string> = new Set()
): VacationBalance {
  const yFrom = `${year}-01-01`;
  const yTo = `${year}-12-31`;
  let taken = 0;
  let planned = 0;
  let requested = 0;
  for (const a of absences) {
    if (a.type !== 'vacation') continue;
    const from = a.fromKey < yFrom ? yFrom : a.fromKey;
    const to = a.toKey > yTo ? yTo : a.toKey;
    if (from > to) continue;
    if (a.status === 'requested') {
      requested += vacationDays(from, to, holidays);
    } else if (a.status === 'approved') {
      const pastEnd = to < todayKey ? to : prevKey(todayKey);
      if (from <= pastEnd) taken += vacationDays(from, pastEnd < to ? pastEnd : to, holidays);
      const futureStart = from > todayKey ? from : todayKey;
      if (futureStart <= to) planned += vacationDays(futureStart, to, holidays);
    }
  }
  return { entitlement, taken, planned, requested, remaining: entitlement - taken - planned };
}

function prevKey(k: string): string {
  const d = new Date(`${k}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const deDate = (k: string) => {
  const [y, m, d] = k.split('-');
  return `${d}.${m}.${y}`;
};
export const deRange = (from: string, to: string) => (from === to ? deDate(from) : `${deDate(from)} – ${deDate(to)}`);

export const ABSENCE_TYPE_LABEL: Record<AbsenceType, string> = { vacation: 'Urlaub', sick: 'Krank' };
export const ABSENCE_STATUS_LABEL: Record<AbsenceStatus, string> = {
  requested: 'Beantragt',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
  reported: 'Gemeldet',
  cancelled: 'Zurückgezogen',
};
