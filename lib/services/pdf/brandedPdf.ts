/**
 * Gemeinsames PDF-Design für alle in der App erzeugten Dokumente.
 *
 * Gestaltungsprinzipien (analog zum App-Design „Clean & Flat"):
 * - Briefkopf: Logo links, Meta-Angaben rechts, Titelzeile, Teal-Linie
 * - Typografie: klare Hierarchie (18/11/9.5), Grau für Sekundäres
 * - Tabellen: Teal-Kopf, Zebra-Streifen, Zahlen rechtsbündig
 * - Fußzeile: Haarlinie, Produktname links, Seitenzahl rechts
 *
 * Alle Maße in mm (jsPDF-Standardeinheit, A4 210×297).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PDF_COLORS = {
  teal: [15, 118, 110] as [number, number, number],
  tealDark: [17, 94, 89] as [number, number, number],
  ink: [28, 25, 23] as [number, number, number],
  gray: [120, 113, 108] as [number, number, number],
  grayLight: [214, 211, 209] as [number, number, number],
  rowAlt: [250, 250, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export const PDF_MARGIN = 16;
const PAGE_W = 210;
const PAGE_H = 297;

let cachedLogo: string | null | undefined;

/** Logo als Daten-URL laden (Browser); schlägt fehl → null (Text-Fallback im Briefkopf). */
async function loadLogoDataUrl(): Promise<string | null> {
  if (cachedLogo !== undefined) return cachedLogo;
  try {
    const res = await fetch('/logo-default.png');
    if (!res.ok) throw new Error(String(res.status));
    const buf = new Uint8Array(await res.arrayBuffer());
    // Base64 ohne FileReader (funktioniert in Browser und Test-Umgebung)
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    cachedLogo = `data:image/png;base64,${btoa(binary)}`;
  } catch {
    cachedLogo = null;
  }
  return cachedLogo;
}

export interface LetterheadOptions {
  /** Dokumenttitel (z. B. „Zeiterfassungsbericht") */
  title: string;
  /** Untertitel (z. B. Zeitraum oder Mitarbeiter) */
  subtitle?: string;
  /** Rechtsbündige Meta-Zeilen (Standard: „Erstellt am …") */
  metaLines?: string[];
  /** Firmenname unter dem Logo-Fallback / rechts im Kopf */
  companyName?: string;
  /** Eigenes Logo (Daten-URL); Standard: App-Logo */
  logoDataUrl?: string | null;
}

/**
 * Zeichnet den Briefkopf und liefert die Y-Position, an der der Inhalt beginnt.
 */
export async function drawLetterhead(doc: any, opts: LetterheadOptions): Promise<number> {
  const m = PDF_MARGIN;
  const logo = opts.logoDataUrl !== undefined ? opts.logoDataUrl : await loadLogoDataUrl();

  // Logo (Seitenverhältnis der Wortmarke ~3.9:1) oder Text-Fallback
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', m, 12, 42, 10.5);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...PDF_COLORS.ink);
      doc.text(opts.companyName || 'Schichtklar', m, 19);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...PDF_COLORS.ink);
    doc.text(opts.companyName || 'Schichtklar', m, 19);
  }

  // Meta-Block rechts
  const meta = opts.metaLines ?? [`Erstellt am ${new Date().toLocaleDateString('de-DE')}`];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.gray);
  let my = 15;
  for (const line of meta) {
    doc.text(line, PAGE_W - m, my, { align: 'right' });
    my += 4.5;
  }

  // Titel + Untertitel
  let y = 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...PDF_COLORS.ink);
  doc.text(opts.title, m, y);
  y += 6.5;
  if (opts.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...PDF_COLORS.gray);
    doc.text(opts.subtitle, m, y);
    y += 5;
  }

  // Teal-Linie unter dem Kopf
  y += 2;
  doc.setDrawColor(...PDF_COLORS.teal);
  doc.setLineWidth(0.8);
  doc.line(m, y, PAGE_W - m, y);

  doc.setTextColor(...PDF_COLORS.ink);
  return y + 8;
}

/**
 * Fußzeile auf allen Seiten: Haarlinie, Produkt links, Seitenzahl rechts.
 * Nach dem Inhalt (direkt vor doc.output) aufrufen.
 */
export function drawFooters(doc: any, leftText = 'Schichtklar · Digitale Schichtplanung'): void {
  const m = PDF_MARGIN;
  const pages: number = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...PDF_COLORS.grayLight);
    doc.setLineWidth(0.3);
    doc.line(m, PAGE_H - 14, PAGE_W - m, PAGE_H - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.gray);
    doc.text(leftText, m, PAGE_H - 9);
    doc.text(`Seite ${i} von ${pages}`, PAGE_W - m, PAGE_H - 9, { align: 'right' });
  }
  doc.setTextColor(...PDF_COLORS.ink);
}

/** Abschnittsüberschrift (klein, versal, Teal) – gibt neue Y-Position zurück */
export function sectionTitle(doc: any, y: number, text: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.tealDark);
  doc.text(text.toUpperCase(), PDF_MARGIN, y);
  doc.setTextColor(...PDF_COLORS.ink);
  return y + 6;
}

/** Label-Wert-Zeile – gibt neue Y-Position zurück */
export function kvLine(doc: any, y: number, label: string, value: string, labelWidth = 48): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.gray);
  doc.text(label, PDF_MARGIN, y);
  doc.setTextColor(...PDF_COLORS.ink);
  doc.text(String(value ?? '–'), PDF_MARGIN + labelWidth, y);
  return y + 6;
}

/** Unterschriftslinie mit Beschriftung – gibt neue Y-Position zurück */
export function signatureLine(doc: any, y: number, label: string, width = 70): number {
  doc.setDrawColor(...PDF_COLORS.grayLight);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGIN, y, PDF_MARGIN + width, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.gray);
  doc.text(label, PDF_MARGIN, y + 4.5);
  doc.setTextColor(...PDF_COLORS.ink);
  return y + 12;
}

/**
 * Einheitliche autoTable-Optionen.
 * @param rightCols Spaltenindizes, die rechtsbündig gesetzt werden (Zahlen)
 */
export function brandedTableOptions(rightCols: number[] = []): Record<string, unknown> {
  const columnStyles: Record<number, { halign: 'right' }> = {};
  for (const c of rightCols) columnStyles[c] = { halign: 'right' };
  return {
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: { top: 2.6, bottom: 2.6, left: 3, right: 3 },
      textColor: PDF_COLORS.ink,
      lineColor: PDF_COLORS.grayLight,
      lineWidth: 0,
    },
    headStyles: {
      fillColor: PDF_COLORS.teal,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: PDF_COLORS.rowAlt },
    columnStyles,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
  };
}
