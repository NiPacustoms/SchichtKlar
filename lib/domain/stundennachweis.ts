/**
 * Monatlicher Stundennachweis – digitales Gegenstück zum Papierbogen
 * „Arbeitszeiterfassung / Stunden-Nachweis“ (Datum, Beginn, Ende, Pause,
 * Dauer, Bemerkungen; Summe; Unterschrift Arbeitnehmer „erfasst“
 * und Arbeitgeber „anerkannt“).
 *
 * Reine Logik ohne Firebase: Zeilen bauen, summieren, Fingerabdruck für
 * die Unterschrift (Änderungen nach der Unterschrift werden erkannt).
 *
 * Datenmodell timesheetStatements/{companyId}_{userId}_{YYYY-MM}:
 *   companyId, userId, month,
 *   employeeSignature (PNG-Daten-URL), employeeSignedName, employeeSignedAt,
 *   signedFingerprint, signedTotalHours,
 *   employerSignature, employerSignedName, employerSignedAt, employerSignedBy
 */

export const MILOG_HINT =
  'Hinweis zu § 17 Mindestlohngesetz (MiLoG): Beginn, Ende und Dauer der täglichen Arbeitszeit sind spätestens bis zum Ablauf des siebten auf den Tag der Arbeitsleistung folgenden Kalendertages aufzuzeichnen und mindestens zwei Jahre aufzubewahren.';

export interface StatementSheet {
  id: string;
  dayKey: string; // YYYY-MM-DD (Berlin)
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  facilityName?: string;
  station?: string;
  facilitySignerName?: string;
  nightHours?: number;
  sundayNonHolidayHours?: number;
  holidayHours?: number;
  overtimeHours?: number;
  notes?: string;
}

export interface StatementRow {
  dayKey: string;
  begin: string;
  end: string;
  /** Pause in Stunden (wie auf dem Bogen) */
  pauseHours: number | null;
  hours: number | null;
  remark: string;
  status?: StatementSheet['status'];
  facilityName?: string;
  sheetId?: string;
}

export interface StatementTotals {
  hours: number;
  approvedHours: number;
  openHours: number;
  overtimeHours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  workDays: number;
  byFacility: { name: string; hours: number }[];
}

export interface MonthlyStatement {
  month: string; // YYYY-MM
  rows: StatementRow[];
  totals: StatementTotals;
  /** Alle Arbeitszeilen von der Disposition freigegeben */
  allApproved: boolean;
  hasDrafts: boolean;
  fingerprint: string;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('de-DE', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function monthRangeKeys(month: string): { fromKey: string; toKey: string } {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { fromKey: `${month}-01`, toKey: `${month}-${String(last).padStart(2, '0')}` };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Stabiler Fingerabdruck der Arbeitszeilen (FNV-1a, 32 Bit, hex) */
export function statementFingerprint(rows: StatementRow[]): string {
  const s = rows
    .filter(r => r.sheetId)
    .map(r => `${r.dayKey}|${r.begin}|${r.end}|${r.pauseHours}|${r.hours}`)
    .sort()
    .join(';');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const fmtH = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Baut den Monatsnachweis aus den erfassten Zeiten. Abgelehnte Zeiten zählen nicht. */
export function buildMonthlyStatement(month: string, sheets: StatementSheet[]): MonthlyStatement {
  const { fromKey, toKey } = monthRangeKeys(month);
  const inMonth = sheets.filter(s => s.status !== 'rejected' && s.dayKey >= fromKey && s.dayKey <= toKey);

  const rows: StatementRow[] = inMonth.map(s => {
    const extras = [
      s.nightHours ? `Nacht ${fmtH(s.nightHours)} h` : '',
      s.sundayNonHolidayHours ? 'Sonntag' : '',
      s.holidayHours ? 'Feiertag' : '',
      s.overtimeHours ? `Mehrarbeit ${fmtH(s.overtimeHours)} h` : '',
    ].filter(Boolean);
    const place = [s.facilityName, s.station].filter(Boolean).join(' · ');
    const confirmed = s.facilitySignerName ? `bestätigt: ${s.facilitySignerName}` : '';
    return {
      dayKey: s.dayKey,
      begin: s.startTime,
      end: s.endTime,
      pauseHours: r2((s.breakMinutes || 0) / 60),
      hours: r2(s.totalHours || 0),
      remark: [place, extras.join(', '), confirmed].filter(Boolean).join(' · '),
      status: s.status,
      facilityName: s.facilityName,
      sheetId: s.id,
    };
  });

  rows.sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.begin.localeCompare(b.begin));

  const facilities = new Map<string, number>();
  for (const s of inMonth) {
    const name = s.facilityName || 'Ohne Einrichtung';
    facilities.set(name, (facilities.get(name) ?? 0) + (s.totalHours || 0));
  }
  const sum = (f: (s: StatementSheet) => number | undefined, list = inMonth) => r2(list.reduce((n, s) => n + (f(s) || 0), 0));
  const approved = inMonth.filter(s => s.status === 'approved');

  const totals: StatementTotals = {
    hours: sum(s => s.totalHours),
    approvedHours: sum(s => s.totalHours, approved),
    openHours: r2(sum(s => s.totalHours) - sum(s => s.totalHours, approved)),
    overtimeHours: sum(s => s.overtimeHours),
    nightHours: sum(s => s.nightHours),
    sundayHours: sum(s => s.sundayNonHolidayHours),
    holidayHours: sum(s => s.holidayHours),
    workDays: new Set(inMonth.map(s => s.dayKey)).size,
    byFacility: [...facilities.entries()].map(([name, hours]) => ({ name, hours: r2(hours) })).sort((a, b) => b.hours - a.hours),
  };

  return {
    month,
    rows,
    totals,
    allApproved: inMonth.length > 0 && inMonth.every(s => s.status === 'approved'),
    hasDrafts: inMonth.some(s => s.status === 'draft'),
    fingerprint: statementFingerprint(rows),
  };
}

export type StatementSignState = 'open' | 'employee-signed' | 'acknowledged' | 'changed';

export interface StatementSignatures {
  employeeSignedAt?: Date | null;
  signedFingerprint?: string | null;
  employerSignedAt?: Date | null;
}

/** Status der Unterschriften – „changed“, wenn Zeiten nach der Unterschrift geändert wurden */
export function statementSignState(statement: MonthlyStatement, sig?: StatementSignatures | null): StatementSignState {
  if (!sig?.employeeSignedAt) return 'open';
  if (sig.signedFingerprint && sig.signedFingerprint !== statement.fingerprint) return 'changed';
  return sig.employerSignedAt ? 'acknowledged' : 'employee-signed';
}

export function statementDocId(companyId: string, userId: string, month: string) {
  return `${companyId}_${userId}_${month}`;
}
