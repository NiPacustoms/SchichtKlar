/**
 * Berechnet bei jeder Änderung einer Zeiterfassung serverseitig die Aufteilung
 * in Nacht-, Wochenend-, Feiertags- und Überstunden samt Zuschlag.
 *
 * Vorher geschah das nur im Callable `submitTimesheet`, das die App nie
 * aufruft – Zeiten gingen per Unterschrift direkt in „freigegeben“, und alle
 * Zuschlagsfelder blieben leer.
 *
 * Idempotent über `breakdownKey`: gleiche Eingaben → kein erneuter Schreibvorgang
 * (verhindert Trigger-Schleifen).
 */
import * as admin from 'firebase-admin';
import { resolveHolidayState } from './utils/holidayState';
import { FieldValue } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { formatInTimeZone } from 'date-fns-tz';
import { computeWorkHoursBreakdown, BREAKDOWN_TZ } from './utils/workHoursBreakdown';
import { parseShiftToUTC } from './utils/timeUtils';

const db = admin.firestore();

/** Felder, die nur dieser Trigger schreibt (vom GoBD-Schutz ausgenommen) */
export const BREAKDOWN_FIELDS = [
  'nightHours',
  'weekendHours',
  'saturdayHours',
  'sundayHours',
  'sundayNonHolidayHours',
  'holidayHours',
  'overtimeHours',
  'regularHours',
  'surchargeAmount',
  'breakdownKey',
  'breakdownComputedAt',
  'arbzgFlags',
] as const;

/** ArbZG-Hinweise wie in lib/domain/timesheetCalc.ts (§ 4 Pausen, § 3 Höchstarbeitszeit) */
export function arbzgFlagsFor(grossMinutes: number, breakMinutes: number): string[] {
  const work = grossMinutes - breakMinutes;
  const required = work > 9 * 60 ? 45 : work > 6 * 60 ? 30 : 0;
  const flags: string[] = [];
  if (breakMinutes < required) flags.push('BREAK_TOO_SHORT');
  if (work > 10 * 60) flags.push('OVER_10H');
  else if (work > 8 * 60) flags.push('OVER_8H');
  return flags;
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const t = (v as { toDate?: () => Date }).toDate?.();
  if (t) return t;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const computeTimesheetBreakdown = onDocumentWritten(
  { document: 'timesheets/{timesheetId}', region: 'europe-west1' },
  async event => {
    const after = event.data?.after?.data();
    if (!after) return; // gelöscht
    const { startTime, endTime } = after as { startTime?: string; endTime?: string };
    const day = toDate(after.date);
    if (!day || !startTime || !endTime || startTime === endTime) return; // laufender Dienst

    const breakMinutes = Number(after.breakMinutes) || 0;

    let holidayState: string | undefined;
    let hourlyRate = 0;
    try {
      const [companySnap, userSnap] = await Promise.all([
        after.companyId ? db.collection('companies').doc(String(after.companyId)).get() : Promise.resolve(null),
        after.userId ? db.collection('users').doc(String(after.userId)).get() : Promise.resolve(null),
      ]);
      const c = companySnap && companySnap.exists ? companySnap.data() : undefined;
      holidayState = resolveHolidayState(c);
      const rate = userSnap && userSnap.exists ? userSnap.data()?.hourlyRate : 0;
      hourlyRate = typeof rate === 'number' && rate > 0 ? rate : 0;
    } catch (error) {
      holidayState = resolveHolidayState(null);
      logger.warn('Breakdown: Firma/Person nicht lesbar – rechne mit Standard-Bundesland, ohne Lohn', { error: String(error) });
    }

    const dayKey = formatInTimeZone(day, BREAKDOWN_TZ, 'yyyy-MM-dd');
    const key = `v3|${dayKey}|${startTime}|${endTime}|${breakMinutes}|${holidayState ?? ''}|${hourlyRate}`;
    if (after.breakdownKey === key) return;

    const { startUTC, endUTC } = parseShiftToUTC(day, startTime, endTime);
    const b = computeWorkHoursBreakdown(startUTC, endUTC, breakMinutes, hourlyRate, holidayState);

    await event.data!.after.ref.update({
      nightHours: b.nightHours,
      weekendHours: b.weekendHours,
      saturdayHours: b.saturdayHours,
      sundayHours: b.sundayHours,
      sundayNonHolidayHours: b.sundayNonHolidayHours,
      holidayHours: b.holidayHours,
      overtimeHours: b.overtimeHours,
      regularHours: Math.max(0, Math.round((b.totalHours - b.overtimeHours) * 100) / 100),
      surchargeAmount: b.surchargeAmount,
      arbzgFlags: arbzgFlagsFor((endUTC.getTime() - startUTC.getTime()) / 60000, breakMinutes),
      breakdownKey: key,
      breakdownComputedAt: FieldValue.serverTimestamp(),
    });
  }
);
