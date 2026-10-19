import { describe, expect, it } from 'vitest';
import { buildLodasExport, DEFAULT_PAYROLL_SETTINGS, type PayrollExportSettings } from '../datevLodas';

const settings: PayrollExportSettings = {
  beraterNr: '1234567',
  mandantenNr: '54321',
  bsStunden: '1',
  lohnarten: { grund: '100', ueberstunden: '', nacht: '200', sonntag: '210', feiertag: '220' },
};
const people = [
  { userId: 'lea', name: 'Lea Becker', personnelNumber: '17' },
  { userId: 'murat', name: 'Murat Yılmaz', personnelNumber: '23' },
  { userId: 'neu', name: 'Neu Ohne' },
];

describe('buildLodasExport', () => {
  it('summiert je Person und Lohnart, deutsches Dezimalkomma, CRLF', () => {
    const r = buildLodasExport(
      { year: 2026, month: 10 },
      [
        { userId: 'lea', totalHours: 7.5, nightHours: 0, sundayNonHolidayHours: 7.5 },
        { userId: 'lea', totalHours: 7.25 },
        { userId: 'murat', totalHours: 9, nightHours: 6.45 },
      ],
      people,
      settings
    );
    expect(r.settingsErrors).toEqual([]);
    expect(r.file).toContain('BeraterNr=1234567\r\nMandantenNr=54321');
    expect(r.file).toContain('1;17;01.10.2026;14,75;1;100;');
    expect(r.file).toContain('1;17;01.10.2026;7,50;1;210;');
    expect(r.file).toContain('1;23;01.10.2026;9,00;1;100;');
    expect(r.file).toContain('1;23;01.10.2026;6,45;1;200;');
    expect(r.file).not.toContain(';0,00;');
    expect(r.totals).toEqual({ people: 2, hours: 23.75 });
  });

  it('Überstunden separat, wenn Lohnart gesetzt', () => {
    const r = buildLodasExport(
      { year: 2026, month: 10 },
      [{ userId: 'lea', totalHours: 10, overtimeHours: 2 }],
      people,
      { ...settings, lohnarten: { ...settings.lohnarten, ueberstunden: '150' } }
    );
    expect(r.file).toContain('1;17;01.10.2026;8,00;1;100;');
    expect(r.file).toContain('1;17;01.10.2026;2,00;1;150;');
  });

  it('meldet Personen ohne Personalnummer statt sie still wegzulassen', () => {
    const r = buildLodasExport({ year: 2026, month: 10 }, [{ userId: 'neu', totalHours: 8 }], people, settings);
    expect(r.missingPersonnelNumber.map(p => p.name)).toEqual(['Neu Ohne']);
    expect(r.file).toBeNull();
  });

  it('erzeugt ohne Berater-/Mandantennummer keine Datei', () => {
    const r = buildLodasExport({ year: 2026, month: 10 }, [{ userId: 'lea', totalHours: 8 }], people, DEFAULT_PAYROLL_SETTINGS);
    expect(r.settingsErrors.length).toBeGreaterThanOrEqual(3);
    expect(r.file).toBeNull();
  });
});
