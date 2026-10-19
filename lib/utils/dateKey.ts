/**
 * Kalendertag als YYYY-MM-DD in deutscher Zeit (Europe/Berlin).
 *
 * Ersetzt `date.toISOString().split('T')[0]`: das liefert den UTC-Tag und
 * damit für Termine um Mitternacht (so speichert die App Schichtdaten) und
 * für alles zwischen 0 und 2 Uhr nachts den Vortag.
 */
const FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function berlinDayKey(date: Date): string {
  return FMT.format(date);
}

/** Wie berlinDayKey, aber für optionale/ungültige Eingaben → undefined */
export function berlinDayKeyOpt(date: Date | null | undefined): string | undefined {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  return FMT.format(date);
}
