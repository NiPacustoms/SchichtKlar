/**
 * DATEV LODAS – ASCII-Import der Bewegungsdaten (Stunden je Lohnart).
 *
 * Aufbau (Satzart u_lod_bwd_buchung_standard):
 *   [Allgemein]        Ziel, Version, Berater- und Mandantennummer
 *   [Satzbeschreibung] 1;u_lod_bwd_buchung_standard;pnr#bwd;abrechnung_zeitraum#bwd;bs_wert_butab#bwd;bs_nr#bwd;la_eigene#bwd;
 *   [Bewegungsdaten]   1;<Personalnr>;<01.MM.JJJJ>;<Wert>;<Bearbeitungsschlüssel>;<Lohnart>;
 *
 * Lohnarten und Bearbeitungsschlüssel legt das Steuerbüro fest – sie sind
 * deshalb einstellbar. Vor dem ersten Echtlauf eine Testdatei mit dem
 * Steuerbüro abstimmen.
 */

export interface PayrollExportSettings {
  beraterNr: string;
  mandantenNr: string;
  /** Bearbeitungsschlüssel für Stundenwerte */
  bsStunden: string;
  lohnarten: {
    /** Grundlohn-Stunden (alle geleisteten Stunden, ggf. ohne Überstunden) */
    grund: string;
    /** optional: Überstunden separat; leer = in Grundstunden enthalten */
    ueberstunden?: string;
    /** Zuschlagsstunden – leer = nicht exportieren */
    nacht?: string;
    sonntag?: string;
    feiertag?: string;
  };
}

export const DEFAULT_PAYROLL_SETTINGS: PayrollExportSettings = {
  beraterNr: '',
  mandantenNr: '',
  bsStunden: '1',
  lohnarten: { grund: '', ueberstunden: '', nacht: '', sonntag: '', feiertag: '' },
};

/** Freigegebene Zeiten eines Monats, wie sie in den Export eingehen */
export interface PayrollSheet {
  userId: string;
  totalHours: number;
  overtimeHours?: number;
  nightHours?: number;
  /** Sonntagsstunden ohne Feiertage (Feiertag ersetzt Sonntag) */
  sundayNonHolidayHours?: number;
  holidayHours?: number;
}

export interface PayrollPerson {
  userId: string;
  name: string;
  personnelNumber?: string;
}

export interface PayrollLine {
  personnelNumber: string;
  name: string;
  kind: keyof PayrollExportSettings['lohnarten'];
  lohnart: string;
  hours: number;
}

export interface PayrollExportResult {
  lines: PayrollLine[];
  /** Personen mit freigegebenen Stunden, aber ohne Personalnummer */
  missingPersonnelNumber: PayrollPerson[];
  /** Fehlende Pflicht-Einstellungen */
  settingsErrors: string[];
  file: string | null;
  totals: { people: number; hours: number };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => round2(n).toFixed(2).replace('.', ',');
const digits = (s: string | undefined) => (s ?? '').trim();

export function validatePayrollSettings(s: PayrollExportSettings): string[] {
  const errors: string[] = [];
  if (!/^\d{1,7}$/.test(digits(s.beraterNr))) errors.push('Beraternummer fehlt (vom Steuerbüro).');
  if (!/^\d{1,5}$/.test(digits(s.mandantenNr))) errors.push('Mandantennummer fehlt (vom Steuerbüro).');
  if (!/^\d{1,2}$/.test(digits(s.bsStunden))) errors.push('Bearbeitungsschlüssel für Stunden fehlt.');
  if (!/^\d{1,4}$/.test(digits(s.lohnarten.grund))) errors.push('Lohnart für Grundstunden fehlt.');
  for (const k of ['ueberstunden', 'nacht', 'sonntag', 'feiertag'] as const) {
    const v = digits(s.lohnarten[k]);
    if (v && !/^\d{1,4}$/.test(v)) errors.push(`Lohnart „${k}“ muss eine Zahl (1–4 Stellen) sein.`);
  }
  return errors;
}

/**
 * Baut die Importdatei für einen Abrechnungsmonat. Personen ohne
 * Personalnummer werden nicht exportiert, sondern gemeldet.
 */
export function buildLodasExport(
  month: { year: number; month: number }, // month 1–12
  sheets: PayrollSheet[],
  people: PayrollPerson[],
  settings: PayrollExportSettings
): PayrollExportResult {
  const settingsErrors = validatePayrollSettings(settings);
  const byId = new Map(people.map(p => [p.userId, p]));
  const sums = new Map<string, { total: number; ot: number; night: number; sun: number; hol: number }>();
  for (const s of sheets) {
    const cur = sums.get(s.userId) ?? { total: 0, ot: 0, night: 0, sun: 0, hol: 0 };
    cur.total += s.totalHours || 0;
    cur.ot += s.overtimeHours || 0;
    cur.night += s.nightHours || 0;
    cur.sun += s.sundayNonHolidayHours || 0;
    cur.hol += s.holidayHours || 0;
    sums.set(s.userId, cur);
  }

  const la = settings.lohnarten;
  const lines: PayrollLine[] = [];
  const missing: PayrollPerson[] = [];
  const sorted = [...sums.entries()].sort(([a], [b]) =>
    (byId.get(a)?.name ?? a).localeCompare(byId.get(b)?.name ?? b, 'de')
  );
  for (const [userId, v] of sorted) {
    const person = byId.get(userId) ?? { userId, name: 'Unbekannt' };
    const pnr = digits(person.personnelNumber);
    if (!/^\d{1,5}$/.test(pnr)) {
      missing.push(person);
      continue;
    }
    const push = (kind: PayrollLine['kind'], lohnart: string | undefined, hours: number) => {
      if (!digits(lohnart) || round2(hours) <= 0) return;
      lines.push({ personnelNumber: pnr, name: person.name, kind, lohnart: digits(lohnart), hours: round2(hours) });
    };
    const separateOt = !!digits(la.ueberstunden);
    push('grund', la.grund, separateOt ? v.total - v.ot : v.total);
    if (separateOt) push('ueberstunden', la.ueberstunden, v.ot);
    push('nacht', la.nacht, v.night);
    push('sonntag', la.sonntag, v.sun);
    push('feiertag', la.feiertag, v.hol);
  }

  const period = `01.${String(month.month).padStart(2, '0')}.${month.year}`;
  const file =
    settingsErrors.length || !lines.length
      ? null
      : [
          '[Allgemein]',
          'Ziel=LODAS',
          'Version_SST=1.0',
          `BeraterNr=${digits(settings.beraterNr)}`,
          `MandantenNr=${digits(settings.mandantenNr)}`,
          '',
          '[Satzbeschreibung]',
          '1;u_lod_bwd_buchung_standard;pnr#bwd;abrechnung_zeitraum#bwd;bs_wert_butab#bwd;bs_nr#bwd;la_eigene#bwd;',
          '',
          '[Bewegungsdaten]',
          ...lines.map(l => `1;${l.personnelNumber};${period};${fmt(l.hours)};${digits(settings.bsStunden)};${l.lohnart};`),
          '',
        ].join('\r\n');

  const grundKinds = new Set(['grund', 'ueberstunden']);
  return {
    lines,
    missingPersonnelNumber: missing,
    settingsErrors,
    file,
    totals: {
      people: new Set(lines.map(l => l.personnelNumber)).size,
      hours: round2(lines.filter(l => grundKinds.has(l.kind)).reduce((s, l) => s + l.hours, 0)),
    },
  };
}
