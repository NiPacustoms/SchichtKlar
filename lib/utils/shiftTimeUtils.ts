import { addDays, format } from 'date-fns';

const DEFAULT_TZ = 'Europe/Berlin';

/**
 * Konvertiert "Datum + Uhrzeit in Zeitzone" zu UTC Date.
 * Nur für Europe/Berlin getestet; nutzt Intl.
 */
function zonedTimeToUtc(dateTimeStr: string, tz: string): Date {
  const [datePart, timePart] = dateTimeStr.split('T');
  if (!datePart || !timePart) return new Date(NaN);
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, min] = timePart.slice(0, 5).split(':').map(Number);
  if ([y, m, d, h, min].some(Number.isNaN)) return new Date(NaN);

  const g = new Date(Date.UTC(y, m - 1, d, h, min));
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(g);
  const get = (k: string) => parts.find((p) => p.type === k)?.value ?? '0';
  const fH = parseInt(get('hour'), 10);
  const fMin = parseInt(get('minute'), 10);
  const offsetMin = (fH * 60 + fMin) - (h * 60 + min);
  return new Date(g.getTime() - offsetMin * 60 * 1000);
}

/**
 * Konvertiert eine Schicht-Zeit in UTC Timestamps
 * @param date Schichtdatum
 * @param start Startzeit (HH:mm)
 * @param end Endzeit (HH:mm)
 * @param tz Zeitzone (default: Europe/Berlin)
 */
export function parseShiftToUTC(
  date: Date,
  start: string,
  end: string,
  tz: string = DEFAULT_TZ
): { startUTC: Date; endUTC: Date; isOvernight: boolean } {
  const startDateTime = `${format(date, 'yyyy-MM-dd')}T${start}:00`;
  const endDateTime = `${format(date, 'yyyy-MM-dd')}T${end}:00`;
  const isOvernight = end < start;

  const startUTC = zonedTimeToUtc(startDateTime, tz);
  let endUTC = zonedTimeToUtc(endDateTime, tz);

  if (isOvernight) {
    endUTC = zonedTimeToUtc(`${format(addDays(date, 1), 'yyyy-MM-dd')}T${end}:00`, tz);
  }

  return { startUTC, endUTC, isOvernight };
}

/**
 * Prüft ob zwei Zeitintervalle überlappen
 */
export function checkOverlap(
  interval1: { start: Date; end: Date },
  interval2: { start: Date; end: Date }
): boolean {
  const overlapStart = new Date(Math.max(interval1.start.getTime(), interval2.start.getTime()));
  const overlapEnd = new Date(Math.min(interval1.end.getTime(), interval2.end.getTime()));
  return overlapStart < overlapEnd;
}

/** Standard: Zeiterfassung darf ab X Minuten vor Schichtbeginn gestartet werden */
export const TIME_TRACKING_ALLOWED_MINUTES_BEFORE_START = 15;

/** Standard: Zeiterfassung darf nicht nach Schichtende gestartet werden (0 = exakt Ende, >0 = Grace-Minuten danach) */
export const TIME_TRACKING_ALLOWED_MINUTES_AFTER_END = 0;

export interface TimeTrackingWindowResult {
  allowed: boolean;
  reason?: 'too_early' | 'too_late' | 'ok';
  scheduledStart: Date;
  scheduledEnd: Date;
  windowStart: Date; // ab wann Start erlaubt (z. B. 15 min vor scheduledStart)
  windowEnd: Date;
}

/**
 * Prüft, ob die Zeiterfassung zum aktuellen Zeitpunkt im erlaubten Fenster liegt.
 * Erlaubt: ab X Minuten vor vereinbarter Startzeit bis (Schichtende + optional Grace).
 *
 * @param now aktueller Zeitpunkt (z. B. new Date())
 * @param shiftDate Schichtdatum
 * @param startTime Startzeit "HH:mm"
 * @param endTime Endzeit "HH:mm"
 * @param tz Zeitzone (z. B. shift.tz oder "Europe/Berlin")
 * @param minutesBeforeStart Minuten vor Start, ab denen Start erlaubt ist (Default 15)
 * @param minutesAfterEnd Grace-Minuten nach Ende, in denen Start noch erlaubt ist (Default 0)
 */
export function getTimeTrackingWindow(
  now: Date,
  shiftDate: Date,
  startTime: string,
  endTime: string,
  tz: string = DEFAULT_TZ,
  minutesBeforeStart: number = TIME_TRACKING_ALLOWED_MINUTES_BEFORE_START,
  minutesAfterEnd: number = TIME_TRACKING_ALLOWED_MINUTES_AFTER_END
): TimeTrackingWindowResult {
  const { startUTC, endUTC } = parseShiftToUTC(shiftDate, startTime, endTime, tz);
  const windowStart = new Date(startUTC.getTime() - minutesBeforeStart * 60 * 1000);
  const windowEnd = new Date(endUTC.getTime() + minutesAfterEnd * 60 * 1000);

  const nowMs = now.getTime();
  if (nowMs < windowStart.getTime()) {
    return {
      allowed: false,
      reason: 'too_early',
      scheduledStart: startUTC,
      scheduledEnd: endUTC,
      windowStart,
      windowEnd,
    };
  }
  if (nowMs > windowEnd.getTime()) {
    return {
      allowed: false,
      reason: 'too_late',
      scheduledStart: startUTC,
      scheduledEnd: endUTC,
      windowStart,
      windowEnd,
    };
  }
  return {
    allowed: true,
    reason: 'ok',
    scheduledStart: startUTC,
    scheduledEnd: endUTC,
    windowStart,
    windowEnd,
  };
}
