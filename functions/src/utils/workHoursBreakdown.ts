/**
 * Stunden-Breakdown einer Schicht: Nacht-, Samstags-, Sonntags- und
 * Feiertagsstunden plus Zuschlagsberechnung.
 *
 * Alle Kalender- und Uhrzeitgrenzen werden in deutscher Zeit (Europe/Berlin)
 * bestimmt – unabhängig von der Zeitzone des Servers (Cloud Functions = UTC).
 *
 * Definitionen (dokumentiert in docs/QA_REPORT.md):
 * - Nachtstunden: Arbeit zwischen 23:00 und 06:00 (§2 Abs. 3 ArbZG)
 * - Wochenendstunden: Arbeit an Samstagen und Sonntagen (Reporting-Bucket)
 * - Feiertagsstunden: gesetzliche Feiertage bundesweit + optional Bundesland
 * - Überstunden: Netto-Arbeitszeit über 8 h/Tag (§3 ArbZG Regelarbeitszeit)
 * - Zuschlagssätze (steuerfrei-üblich nach §3b EStG):
 *   Nacht 25 %, Sonntag 50 %, Feiertag 125 % – Feiertag ersetzt Sonntag
 *   (keine Kumulierung Sonntag+Feiertag); Nacht kumuliert zusätzlich.
 *   Samstag: kein gesetzlicher Zuschlag.
 *
 * Pausen werden proportional über die Schichtdauer verteilt abgezogen.
 * Reine Funktion – keine Firebase-Abhängigkeiten (separat testbar).
 */
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export const BREAKDOWN_TZ = 'Europe/Berlin';

export const SURCHARGE_RATES = {
  night: 0.25,
  sunday: 0.5,
  holiday: 1.25,
} as const;

export interface WorkHoursBreakdown {
  totalHours: number;
  nightHours: number;
  saturdayHours: number;
  sundayHours: number;
  /** Samstag + Sonntag (Reporting-Feld `weekendHours`) */
  weekendHours: number;
  holidayHours: number;
  overtimeHours: number;
  /** Zuschlag in €, 0 wenn kein Stundenlohn bekannt */
  surchargeAmount: number;
}

/** Kalendertag als YYYY-MM-DD aus UTC-Bestandteilen (zeitzonenfrei gerechnet) */
function keyUTC(y: number, m0: number, d: number): string {
  const dt = new Date(Date.UTC(y, m0, d));
  return dt.toISOString().slice(0, 10);
}

/** Gauß'sche Osterformel → [Monat (0-basiert), Tag] */
function easter(year: number): [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month, day];
}

const holidayCache = new Map<string, Set<string>>();

/**
 * Gesetzliche Feiertage als YYYY-MM-DD. Ohne Bundesland nur die bundesweiten,
 * mit Bundesland (z. B. 'NW') zusätzlich die regionalen.
 */
export function getHolidayKeys(year: number, state?: string): Set<string> {
  const st = (state || '').toUpperCase();
  const cacheKey = `${year}:${st}`;
  const cached = holidayCache.get(cacheKey);
  if (cached) return cached;
  const [em, ed] = easter(year);
  const e = (offset: number) => keyUTC(year, em, ed + offset);
  const keys = new Set<string>([
    keyUTC(year, 0, 1), // Neujahr
    e(-2), // Karfreitag
    e(1), // Ostermontag
    keyUTC(year, 4, 1), // Tag der Arbeit
    e(39), // Christi Himmelfahrt
    e(50), // Pfingstmontag
    keyUTC(year, 9, 3), // Tag der Deutschen Einheit
    keyUTC(year, 11, 25), // 1. Weihnachtsfeiertag
    keyUTC(year, 11, 26), // 2. Weihnachtsfeiertag
  ]);
  if (st) {
    if (['BW', 'BY', 'ST'].includes(st)) keys.add(keyUTC(year, 0, 6)); // Heilige Drei Könige
    if (['BE'].includes(st) && year >= 2019) keys.add(keyUTC(year, 2, 8)); // Frauentag
    if (['MV'].includes(st) && year >= 2023) keys.add(keyUTC(year, 2, 8));
    if (['BW', 'BY', 'HE', 'NW', 'RP', 'SL'].includes(st)) keys.add(e(60)); // Fronleichnam
    if (['BY', 'SL'].includes(st)) keys.add(keyUTC(year, 7, 15)); // Mariä Himmelfahrt
    if (st === 'TH' && year >= 2019) keys.add(keyUTC(year, 8, 20)); // Weltkindertag
    if (['BB', 'HB', 'HH', 'MV', 'NI', 'SH', 'SN', 'ST', 'TH'].includes(st)) keys.add(keyUTC(year, 9, 31)); // Reformationstag
    if (['BW', 'BY', 'NW', 'RP', 'SL'].includes(st)) keys.add(keyUTC(year, 10, 1)); // Allerheiligen
    if (st === 'SN') {
      // Buß- und Bettag: Mittwoch strikt vor dem 23.11.
      const dow = new Date(Date.UTC(year, 10, 23)).getUTCDay();
      const back = ((dow + 4) % 7) || 7;
      keys.add(keyUTC(year, 10, 23 - back));
    }
  }
  holidayCache.set(cacheKey, keys);
  return keys;
}

/** @deprecated – bundesweite Feiertage; nutze getHolidayKeys(year, state) */
export function getNationalHolidayKeys(year: number): Set<string> {
  return getHolidayKeys(year);
}

function overlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  return Math.max(0, (Math.min(aEnd, bEnd) - Math.max(aStart, bStart)) / 60000);
}

/** Zeitpunkt „Tag key, Uhrzeit hh:mm“ in deutscher Zeit als UTC-Millisekunden */
function berlinAt(key: string, hhmm: string): number {
  return fromZonedTime(`${key}T${hhmm}:00`, BREAKDOWN_TZ).getTime();
}

function nextKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return keyUTC(y, m - 1, d + 1);
}

/**
 * Zerlegt eine Schicht (Start → Ende als echte Zeitpunkte, Ende > Start)
 * in Stunden-Buckets und berechnet den Zuschlag.
 *
 * @param start        Schichtbeginn (Zeitpunkt)
 * @param end          Schichtende (Zeitpunkt, nach start)
 * @param breakMinutes Pausenminuten (proportional abgezogen)
 * @param hourlyRate   Stundenlohn in €; 0/undefined → surchargeAmount 0
 * @param state        Bundesland-Kürzel für regionale Feiertage (z. B. 'NW')
 */
export function computeWorkHoursBreakdown(
  start: Date,
  end: Date,
  breakMinutes: number,
  hourlyRate?: number,
  state?: string
): WorkHoursBreakdown {
  const s = start.getTime();
  const en = end.getTime();
  const grossMinutes = (en - s) / 60000;
  if (!(grossMinutes > 0)) {
    return { totalHours: 0, nightHours: 0, saturdayHours: 0, sundayHours: 0, weekendHours: 0, holidayHours: 0, overtimeHours: 0, surchargeAmount: 0 };
  }

  const breakM = Math.min(Math.max(breakMinutes || 0, 0), grossMinutes);
  const netFactor = (grossMinutes - breakM) / grossMinutes; // Pause proportional

  let nightM = 0;
  let saturdayM = 0;
  let sundayM = 0;
  let holidayM = 0;
  let sundayNonHolidayM = 0;

  // Kalendertage in deutscher Zeit durchlaufen (Nachtschicht = 2 Tage)
  let key = formatInTimeZone(start, BREAKDOWN_TZ, 'yyyy-MM-dd');
  for (let guard = 0; guard < 4; guard++) {
    const dayStart = berlinAt(key, '00:00');
    if (dayStart >= en) break;
    const nKey = nextKey(key);
    const dayEnd = berlinAt(nKey, '00:00'); // berücksichtigt Sommer-/Winterzeit
    const dayMinutes = overlapMinutes(s, en, dayStart, dayEnd);
    if (dayMinutes > 0) {
      const isoDow = Number(formatInTimeZone(new Date(dayStart), BREAKDOWN_TZ, 'i')); // 1=Mo … 7=So
      const isHoliday = getHolidayKeys(Number(key.slice(0, 4)), state).has(key);
      if (isHoliday) holidayM += dayMinutes;
      if (isoDow === 6) saturdayM += dayMinutes;
      if (isoDow === 7) {
        sundayM += dayMinutes;
        if (!isHoliday) sundayNonHolidayM += dayMinutes;
      }
      // Nachtfenster dieses Kalendertags: 00:00–06:00 und 23:00–24:00
      nightM += overlapMinutes(s, en, dayStart, berlinAt(key, '06:00'));
      nightM += overlapMinutes(s, en, berlinAt(key, '23:00'), dayEnd);
    }
    key = nKey;
  }

  const toH = (m: number) => Math.round(((m * netFactor) / 60) * 100) / 100;
  const totalHours = Math.round(((grossMinutes - breakM) / 60) * 100) / 100;
  const nightHours = toH(nightM);
  const saturdayHours = toH(saturdayM);
  const sundayHours = toH(sundayM);
  const holidayHours = toH(holidayM);
  const overtimeHours = Math.max(0, Math.round((totalHours - 8) * 100) / 100);

  let surchargeAmount = 0;
  if (hourlyRate && hourlyRate > 0) {
    const sundayOnlyHours = toH(sundayNonHolidayM);
    surchargeAmount =
      nightHours * hourlyRate * SURCHARGE_RATES.night +
      sundayOnlyHours * hourlyRate * SURCHARGE_RATES.sunday +
      holidayHours * hourlyRate * SURCHARGE_RATES.holiday;
    surchargeAmount = Math.round(surchargeAmount * 100) / 100;
  }

  return {
    totalHours,
    nightHours,
    saturdayHours,
    sundayHours,
    weekendHours: Math.round((saturdayHours + sundayHours) * 100) / 100,
    holidayHours,
    overtimeHours,
    surchargeAmount,
  };
}
