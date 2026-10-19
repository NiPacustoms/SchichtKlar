/**
 * Zentrale Stundenberechnung für eine Zeiterfassung (ein Dienst).
 *
 * - Nachtdienste über Mitternacht: Ende < Beginn → Ende am Folgetag
 * - Beginn == Ende gilt als laufender Dienst (noch nicht beendet) → 0 h
 * - Pausen nach § 4 ArbZG: > 6 h Arbeit → 30 min, > 9 h → 45 min
 * - Höchstarbeitszeit § 3 ArbZG: 10 h je Tag
 *
 * Bewusst ohne Firebase/Datum-Abhängigkeiten, damit Client und Tests dieselbe
 * Logik nutzen.
 */

export type TimesheetFlag = 'BREAK_TOO_SHORT' | 'OVER_10H' | 'OVER_8H';

export interface TimesheetCalcResult {
  /** Anwesenheit Beginn→Ende in Minuten */
  grossMinutes: number;
  /** Arbeitszeit ohne Pause in Minuten */
  workMinutes: number;
  /** Arbeitszeit in Stunden, auf 2 Nachkommastellen */
  totalHours: number;
  /** Pflichtpause für diese Arbeitszeit (§ 4 ArbZG) */
  requiredBreakMinutes: number;
  /** Fehlende Pausenminuten (0 = in Ordnung) */
  breakShortfallMinutes: number;
  running: boolean;
  flags: TimesheetFlag[];
}

export class TimesheetInputError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_TIME' | 'INVALID_BREAK' | 'BREAK_EXCEEDS_DURATION'
  ) {
    super(message);
    this.name = 'TimesheetInputError';
  }
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTimeToMinutes(value: string): number {
  const m = TIME_RE.exec((value ?? '').trim());
  if (!m) throw new TimesheetInputError(`Ungültige Uhrzeit „${value}“ – erwartet HH:MM.`, 'INVALID_TIME');
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Pflichtpause nach § 4 ArbZG für eine Arbeitszeit (ohne Pause) in Minuten. */
export function requiredBreakFor(workMinutes: number): number {
  if (workMinutes > 9 * 60) return 45;
  if (workMinutes > 6 * 60) return 30;
  return 0;
}

export function calculateTimesheet(startTime: string, endTime: string, breakMinutes = 0): TimesheetCalcResult {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  const pause = Number(breakMinutes ?? 0);
  if (!Number.isFinite(pause) || pause < 0 || !Number.isInteger(pause)) {
    throw new TimesheetInputError('Die Pause muss eine ganze Zahl von Minuten ab 0 sein.', 'INVALID_BREAK');
  }

  if (start === end) {
    return { grossMinutes: 0, workMinutes: 0, totalHours: 0, requiredBreakMinutes: 0, breakShortfallMinutes: 0, running: true, flags: [] };
  }

  const gross = end > start ? end - start : end + 24 * 60 - start;
  if (pause >= gross) {
    throw new TimesheetInputError(
      `Die Pause (${pause} min) ist so lang wie oder länger als der Dienst (${gross} min).`,
      'BREAK_EXCEEDS_DURATION'
    );
  }

  const work = gross - pause;
  // Die Pflicht hängt an der Arbeitszeit ohne Pause; wer gar keine Pause macht,
  // wird an der vollen Anwesenheit gemessen.
  const required = requiredBreakFor(work);
  const shortfall = Math.max(0, required - pause);

  const flags: TimesheetFlag[] = [];
  if (shortfall > 0) flags.push('BREAK_TOO_SHORT');
  if (work > 10 * 60) flags.push('OVER_10H');
  else if (work > 8 * 60) flags.push('OVER_8H');

  return {
    grossMinutes: gross,
    workMinutes: work,
    totalHours: Math.round((work / 60) * 100) / 100,
    requiredBreakMinutes: required,
    breakShortfallMinutes: shortfall,
    running: false,
    flags,
  };
}

/** Kurze deutsche Hinweise zu den Flags, z. B. für Toasts und Prüfansichten. */
export function describeTimesheetFlags(r: TimesheetCalcResult): string[] {
  const out: string[] = [];
  if (r.flags.includes('BREAK_TOO_SHORT')) {
    out.push(`Pause zu kurz: bei ${formatMinutes(r.workMinutes)} Arbeit sind ${r.requiredBreakMinutes} min vorgeschrieben (§ 4 ArbZG).`);
  }
  if (r.flags.includes('OVER_10H')) out.push(`Mehr als 10 Stunden Arbeitszeit (§ 3 ArbZG): ${formatMinutes(r.workMinutes)}.`);
  else if (r.flags.includes('OVER_8H')) out.push(`Über 8 Stunden – nur zulässig, wenn im Ausgleichszeitraum ausgeglichen (§ 3 ArbZG).`);
  return out;
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
