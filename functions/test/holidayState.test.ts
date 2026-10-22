import { afterEach, describe, expect, it } from 'vitest';
import { resolveHolidayState } from '../src/utils/holidayState';

describe('Bundesland für Feiertage', () => {
  afterEach(() => { delete process.env.DEFAULT_HOLIDAY_STATE; });
  it('nimmt das Firmenfeld', () => expect(resolveHolidayState({ holidayState: 'by' })).toBe('BY'));
  it('akzeptiert alte Feldnamen', () => expect(resolveHolidayState({ bundesland: 'HE' })).toBe('HE'));
  it('ohne Angabe: NRW (Herten)', () => expect(resolveHolidayState(undefined)).toBe('NW'));
  it('ungültige Angabe fällt auf Standard', () => expect(resolveHolidayState({ holidayState: 'Nordrhein' })).toBe('NW'));
  it('Umgebungsvariable überschreibt den Standard', () => {
    process.env.DEFAULT_HOLIDAY_STATE = 'ni';
    expect(resolveHolidayState({})).toBe('NI');
  });
});
