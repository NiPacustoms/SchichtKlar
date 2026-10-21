/**
 * PDF „Arbeitszeiterfassung / Stunden-Nachweis“ im AufAbruf-Design.
 * Digitales Gegenstück zum Papierbogen: Kopfdaten (Firma, Mitarbeiter/in,
 * Zeitraum, Personal-Nr./Funktion), Tagestabelle, Summen, Unterschriften
 * „erfasst“ (Arbeitnehmer/in) und „anerkannt“ (Arbeitgeber), MiLoG-Hinweis.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  COMPANY_FOOTER_HEIGHT,
  PDF_COLORS,
  PDF_MARGIN,
  brandedTableOptions,
  drawCompanyFooter,
  drawLetterhead,
  type CompanyFooterInfo,
} from './brandedPdf';
import {
  MILOG_HINT,
  monthLabel,
  statementSignState,
  type MonthlyStatement,
} from '@/lib/domain/stundennachweis';
import type { StatementSignatureDoc } from '@/lib/services/timesheetStatements';

export interface StatementPdfInput {
  statement: MonthlyStatement;
  signatures: StatementSignatureDoc | null;
  employeeName: string;
  personnelNumber?: string;
  functionLabel?: string;
  companyName: string;
  /** Ort für „Ort, Datum“ (Firmensitz) */
  place?: string;
}

const PAGE_W = 210;
const PAGE_H = 297;
/** Höhe des Hinweisblocks über der Firmen-Fußzeile (mm) */
const HINT_BLOCK = 16;
const WEEKDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const num = (n: number | null | undefined) =>
  n == null ? '' : n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dayLabel = (k: string) => {
  const [y, m, d] = k.split('-');
  return `${WEEKDAY[new Date(`${k}T12:00:00Z`).getUTCDay()]} ${d}.${m}.${y.slice(2)}`;
};
const deDate = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' });

/** Formularfeld wie auf dem Papierbogen: kleine Beschriftung, Wert, Linie */
function field(doc: any, x: number, y: number, w: number, label: string, value: string) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_COLORS.ink);
  doc.text(value || '–', x, y, { maxWidth: w - 2 });
  doc.setDrawColor(...PDF_COLORS.grayLight);
  doc.setLineWidth(0.3);
  doc.line(x, y + 1.8, x + w - 4, y + 1.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_COLORS.gray);
  doc.text(label, x, y + 5.2);
}

function ensureSpace(doc: any, y: number, needed: number): number {
  if (y + needed <= PAGE_H - COMPANY_FOOTER_HEIGHT - HINT_BLOCK) return y;
  doc.addPage();
  return 22;
}

async function renderStatement(doc: any, autoTable: any, input: StatementPdfInput) {
  const m = PDF_MARGIN;
  const contentW = PAGE_W - 2 * m;
  const { statement: s, signatures: sig } = input;
  const state = statementSignState(s, sig);

  let y = await drawLetterhead(doc, {
    title: 'Arbeitszeiterfassung / Stunden-Nachweis',
    subtitle: `${monthLabel(s.month)} · ${input.employeeName}`,
    companyName: input.companyName,
    metaLines: [
      `Erstellt am ${deDate(new Date())}`,
      state === 'acknowledged' ? 'Anerkannt' : state === 'employee-signed' ? 'Vom Mitarbeiter bestätigt' : state === 'changed' ? 'Geändert nach Unterschrift' : 'Noch nicht unterschrieben',
    ],
  });

  // ——— Kopfdaten (2 × 2 Felder wie auf dem Bogen) ———
  const colW = contentW / 2;
  y += 2;
  field(doc, m, y, colW, 'Firma', input.companyName);
  field(doc, m + colW, y, colW, 'Zeitraum (Monat/Jahr)', monthLabel(s.month));
  y += 12;
  field(doc, m, y, colW, 'Name des Mitarbeiters / der Mitarbeiterin', input.employeeName);
  field(doc, m + colW, y, colW, 'Personal-Nr. / Funktion', [input.personnelNumber, input.functionLabel].filter(Boolean).join(' · '));
  y += 12;

  // ——— Tagestabelle ———
  const body = s.rows.length
    ? s.rows.map(r => [
        dayLabel(r.dayKey),
        r.begin,
        r.end,
        num(r.pauseHours),
        num(r.hours),
        r.remark + (r.status && r.status !== 'approved' ? ' · noch nicht freigegeben' : ''),
      ])
    : [[{ content: 'Keine Arbeitszeiten in diesem Monat erfasst.', colSpan: 6, styles: { textColor: PDF_COLORS.gray, halign: 'center' } }]];
  autoTable(doc, {
    ...brandedTableOptions([3, 4]),
    startY: y,
    head: [['Datum', 'Beginn', 'Ende', 'Pause (Std.)', 'Dauer (Std.)', 'Sonstige Angaben / Bemerkungen']],
    body,
    styles: { ...(brandedTableOptions().styles as object), fontSize: 8.6, cellPadding: { top: 2, bottom: 2, left: 2.2, right: 2.2 } },
    headStyles: { ...(brandedTableOptions().headStyles as object), fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 14 },
      2: { cellWidth: 14 },
      3: { cellWidth: 16, halign: 'right' },
      4: { cellWidth: 17, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 'auto', textColor: PDF_COLORS.gray },
    },
    margin: { left: m, right: m, bottom: COMPANY_FOOTER_HEIGHT + HINT_BLOCK + 2, top: 20 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ——— Summen (rechts, wie unten auf dem Bogen) ———
  const t = s.totals;
  const sumRows: [string, string, boolean][] = [
    ['Summe', `${num(t.hours)} Std.`, true],
    ['davon freigegeben (abrechenbar)', `${num(t.approvedHours)} Std.`, false],
  ];
  if (t.openHours > 0) sumRows.push(['noch nicht freigegeben', `${num(t.openHours)} Std.`, false]);
  if (t.overtimeHours > 0) sumRows.push(['Überstunden / Mehrarbeit', `${num(t.overtimeHours)} Std.`, false]);
  const surcharge = [
    t.nightHours ? `Nacht ${num(t.nightHours)}` : '',
    t.sundayHours ? `Sonntag ${num(t.sundayHours)}` : '',
    t.holidayHours ? `Feiertag ${num(t.holidayHours)}` : '',
  ].filter(Boolean);
  if (surcharge.length) sumRows.push(['Zuschlagsstunden', surcharge.join(' · '), false]);

  y = ensureSpace(doc, y, sumRows.length * 5.6 + 4);
  const boxX = m + contentW * 0.42;
  const boxW = contentW * 0.58;
  doc.setDrawColor(...PDF_COLORS.grayLight);
  doc.setLineWidth(0.3);
  sumRows.forEach(([label, value, strong], i) => {
    const yy = y + i * 5.6;
    if (strong) {
      doc.setFillColor(...PDF_COLORS.tealSoft);
      doc.rect(boxX, yy - 4, boxW, 5.6, 'F');
    }
    doc.setFont('helvetica', strong ? 'bold' : 'normal');
    doc.setFontSize(strong ? 10 : 9);
    doc.setTextColor(...(strong ? PDF_COLORS.tealDark : PDF_COLORS.gray));
    doc.text(label, boxX + 2.5, yy);
    doc.setTextColor(...PDF_COLORS.ink);
    doc.text(value, boxX + boxW - 2.5, yy, { align: 'right' });
    doc.line(boxX, yy + 1.6, boxX + boxW, yy + 1.6);
  });
  // Stunden je Einsatzort links daneben
  if (t.byFacility.length > 1) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.tealDark);
    doc.text('NACH EINSATZORT', m, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    t.byFacility.slice(0, 6).forEach((f, i) => {
      doc.setTextColor(...PDF_COLORS.gray);
      doc.text(doc.splitTextToSize(f.name, contentW * 0.3)[0], m, y + 5 + i * 4.6);
      doc.setTextColor(...PDF_COLORS.ink);
      doc.text(`${num(f.hours)} Std.`, m + contentW * 0.39, y + 5 + i * 4.6, { align: 'right' });
    });
  }
  y += Math.max(sumRows.length * 5.6, t.byFacility.length > 1 ? 5 + Math.min(6, t.byFacility.length) * 4.6 : 0) + 2;

  if (state === 'changed') {
    y = ensureSpace(doc, y, 10);
    doc.setFillColor(...PDF_COLORS.redSoft);
    doc.rect(m, y - 4.5, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.red);
    doc.text('Zeiten wurden nach der Unterschrift geändert – erneute Bestätigung erforderlich.', m + 2.5, y);
    y += 9;
  }

  // ——— Unterschriften: Ort, Datum · Arbeitnehmer/in (erfasst) · Arbeitgeber (anerkannt) ———
  // Platz für Unterschriften + Hinweisblock (fest über der Fußzeile)
  if (y + 30 > PAGE_H - COMPANY_FOOTER_HEIGHT - HINT_BLOCK) {
    doc.addPage();
    y = 22;
  }
  const sigTop = y + 2;
  const lineY = sigTop + 18;
  const cw = contentW / 3;
  const drawSig = (x: number, label: string, img?: string, name?: string, at?: Date | null) => {
    if (img) {
      try {
        doc.addImage(img, 'PNG', x, sigTop, cw - 10, 16, `sig-${img.length}-${img.slice(-24)}`, 'FAST');
      } catch {
        /* defektes Bild → nur Name */
      }
    }
    doc.setDrawColor(...PDF_COLORS.ink);
    doc.setLineWidth(0.3);
    doc.line(x, lineY, x + cw - 6, lineY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...PDF_COLORS.gray);
    doc.text(label, x, lineY + 4);
    if (name) {
      doc.setTextColor(...PDF_COLORS.ink);
      doc.text(`${name}${at ? ` · ${deDate(at)}` : ''}`, x, lineY + 8);
    }
  };
  // Ort, Datum
  const placeDate = sig?.employeeSignedAt ? `${input.place || ''}${input.place ? ', ' : ''}${deDate(sig.employeeSignedAt)}` : '';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_COLORS.ink);
  if (placeDate) doc.text(placeDate, m, lineY - 2);
  doc.setDrawColor(...PDF_COLORS.ink);
  doc.line(m, lineY, m + cw - 6, lineY);
  doc.setFontSize(7.8);
  doc.setTextColor(...PDF_COLORS.gray);
  doc.text('Ort, Datum', m, lineY + 4);
  const empValid = state === 'employee-signed' || state === 'acknowledged';
  drawSig(m + cw, 'Unterschrift Arbeitnehmer/in (erfasst)', empValid ? sig?.employeeSignature : undefined, empValid ? sig?.employeeSignedName : undefined, empValid ? sig?.employeeSignedAt : null);
  drawSig(m + 2 * cw, 'Unterschrift Arbeitgeber (anerkannt)', sig?.employerSignature, sig?.employerSignedName, sig?.employerSignedAt);

  // ——— Legende + MiLoG-Hinweis (wie unten auf dem Bogen, fest über der Fußzeile) ———
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...PDF_COLORS.gray);
  const hint = [
    ...doc.splitTextToSize('Die Bestätigung des Einsatzortes ist je Tag vermerkt („bestätigt: Name“).', contentW),
    ...doc.splitTextToSize(MILOG_HINT, contentW),
  ];
  let hy = PAGE_H - COMPANY_FOOTER_HEIGHT - HINT_BLOCK + 4;
  for (const line of hint) {
    doc.text(line, m, hy);
    hy += 3.2;
  }
  doc.setTextColor(...PDF_COLORS.ink);
}

async function newDoc() {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  return { doc: new (jsPDF as any)({ unit: 'mm', format: 'a4' }), autoTable };
}

/** Ein Nachweis als PDF */
export async function generateStatementPdf(input: StatementPdfInput, footer: CompanyFooterInfo): Promise<Blob> {
  const { doc, autoTable } = await newDoc();
  await renderStatement(doc, autoTable, input);
  drawCompanyFooter(doc, footer);
  return doc.output('blob');
}

/** Mehrere Nachweise in einer Datei (z. B. alle Mitarbeitenden eines Monats fürs Lohnbüro) */
export async function generateStatementsPdf(inputs: StatementPdfInput[], footer: CompanyFooterInfo): Promise<Blob> {
  const { doc, autoTable } = await newDoc();
  for (let i = 0; i < inputs.length; i++) {
    if (i > 0) doc.addPage();
    await renderStatement(doc, autoTable, inputs[i]);
  }
  drawCompanyFooter(doc, footer);
  return doc.output('blob');
}

export function statementFileName(month: string, employeeName?: string) {
  const safe = (employeeName ?? 'alle').normalize('NFD').replace(/[^\w-]+/g, '_').replace(/_+/g, '_');
  return `Stundennachweis_${month}_${safe}.pdf`;
}
