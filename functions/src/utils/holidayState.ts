/**
 * Bundesland für regionale Feiertage (z. B. NW: Fronleichnam, Allerheiligen).
 * Reihenfolge: Firmenfeld holidayState/state/bundesland → Umgebungsvariable
 * DEFAULT_HOLIDAY_STATE → „NW“ (AufAbruf GmbH, Herten).
 */
export const DEFAULT_HOLIDAY_STATE = 'NW';

const valid = (v: unknown): string | undefined =>
  typeof v === 'string' && /^[A-Za-z]{2}$/.test(v.trim()) ? v.trim().toUpperCase() : undefined;

export function resolveHolidayState(company?: Record<string, unknown> | null): string {
  return (
    valid(company?.holidayState) ??
    valid(company?.state) ??
    valid(company?.bundesland) ??
    valid(process.env.DEFAULT_HOLIDAY_STATE) ??
    DEFAULT_HOLIDAY_STATE
  );
}
