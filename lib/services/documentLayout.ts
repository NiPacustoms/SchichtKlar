/**
 * Gemeinsame Layout-Bausteine für generierte PDF-Dokumente.
 *
 * Ziel: Ein einheitliches, an DIN 5008 angelehntes Erscheinungsbild mit dezentem
 * Logo/Farbakzent sowie eine rechtssichere Fußzeile mit den Pflichtangaben für
 * Geschäftsbriefe (§ 35a GmbHG) und – für Zeitarbeitsfirmen – dem Hinweis auf die
 * Erlaubnis zur Arbeitnehmerüberlassung (§ 1 AÜG).
 */
import type { jsPDF } from 'jspdf';
import { logger } from '@/lib/logging';
import { getAppLogoUrl } from '@/lib/config/logo';

/** RGB-Tripel für jsPDF-Farben. */
type RGB = [number, number, number];

/** Dezente, professionelle Farbpalette für alle Dokumente. */
export const DOC_COLORS = {
  /** Akzent-/Markenfarbe (Überschriften, Linien, Tabellenköpfe). */
  accent: [31, 78, 121] as RGB,
  /** Dunkles Textgrau für Fließtext/Überschriften. */
  text: [33, 37, 41] as RGB,
  /** Sekundäres Grau für Hilfstexte. */
  muted: [108, 117, 125] as RGB,
  /** Helles Grau für Trennlinien. */
  line: [206, 212, 218] as RGB,
  /** Sehr helles Grau für Tabellen-Zebrastreifen. */
  zebra: [245, 247, 250] as RGB,
};

/**
 * Pflicht- und Standardangaben des Verleihers (Zeitarbeitsfirma) für Briefkopf
 * und Fußzeile. Felder, die nicht gesetzt sind, werden in der Ausgabe ausgelassen.
 */
export interface CompanyLegalInfo {
  /** Firmenname inkl. Rechtsform, z. B. "AufAbruf GmbH". */
  companyName: string;
  /** Logo-URL oder Data-URL (optional). */
  companyLogo?: string;
  // Anschrift & Kontakt
  street?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  web?: string;
  // Pflichtangaben nach § 35a GmbHG
  registerCourt?: string; // Registergericht, z. B. "Amtsgericht München"
  registerNumber?: string; // z. B. "HRB 123456"
  managingDirectors?: string; // Geschäftsführer
  vatId?: string; // USt-IdNr.
  // Arbeitnehmerüberlassung
  auegPermit?: string; // Hinweis auf Erlaubnis nach § 1 AÜG (Behörde/Datum)
}

/** Sinnvolle Vorbelegung; fehlende Pflichtangaben als Platzhalter sichtbar. */
export const DEFAULT_COMPANY_INFO: CompanyLegalInfo = {
  companyName: 'AufAbruf GmbH',
  auegPermit: 'Erlaubnis zur Arbeitnehmerüberlassung gem. § 1 AÜG erteilt',
};

/** Geladenes Logo inkl. Originalmaße zur seitenverhältnistreuen Skalierung. */
export interface LoadedLogo {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Lädt ein Logo (URL oder Data-URL) und konvertiert es in eine Data-URL.
 * Gibt null zurück, wenn kein Logo geladen werden kann (Dokument bleibt valide).
 */
export async function loadLogo(logoUrl?: string): Promise<LoadedLogo | null> {
  if (typeof window === 'undefined') return null;
  try {
    const resolved = getAppLogoUrl(logoUrl);
    const absolute = resolved.startsWith('http')
      ? resolved
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${resolved}`;

    const response = await fetch(absolute);
    if (!response.ok) throw new Error(`Logo HTTP ${response.status}`);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = dataUrl;
    });

    return { dataUrl, width: img.width, height: img.height };
  } catch (err) {
    logger.error('Logo konnte nicht geladen werden', err instanceof Error ? err : new Error(String(err)));
    return null;
  }
}

/**
 * Zeichnet einen einheitlichen Briefkopf (Logo rechts, Absenderzeile links,
 * Akzentlinie) und gibt die Y-Position für den Inhaltsbeginn zurück.
 */
export function drawLetterhead(
  doc: jsPDF,
  company: CompanyLegalInfo,
  logo: LoadedLogo | null,
  margin = 18
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const top = 16;

  // Logo rechts oben (seitenverhältnistreu)
  if (logo) {
    const maxW = 46;
    const maxH = 24;
    const ratio = Math.min(maxW / logo.width, maxH / logo.height);
    const w = logo.width * ratio;
    const h = logo.height * ratio;
    try {
      doc.addImage(logo.dataUrl, 'PNG', pageWidth - margin - w, top, w, h);
    } catch (err) {
      logger.error('Logo konnte nicht eingefügt werden', err instanceof Error ? err : new Error(String(err)));
    }
  }

  // Firmenname links
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...DOC_COLORS.accent);
  doc.text(company.companyName, margin, top + 8);

  // DIN-5008-Absenderzeile (klein, unter dem Namen)
  const senderParts = [
    [company.street, [company.postalCode, company.city].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', '),
  ].filter(Boolean);
  if (senderParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...DOC_COLORS.muted);
    doc.text(senderParts.join(' · '), margin, top + 14);
  }

  // Akzent-Trennlinie
  const ruleY = top + 20;
  doc.setDrawColor(...DOC_COLORS.accent);
  doc.setLineWidth(0.8);
  doc.line(margin, ruleY, pageWidth - margin, ruleY);

  // Textfarbe für nachfolgenden Inhalt zurücksetzen
  doc.setTextColor(...DOC_COLORS.text);
  return ruleY + 10;
}

/**
 * Zeichnet die rechtssichere Fußzeile (Pflichtangaben nach § 35a GmbHG, AÜG-Hinweis)
 * auf der aktuellen Seite – verteilt auf drei Spalten – inkl. Seitenzahl.
 */
function drawFooterOnCurrentPage(
  doc: jsPDF,
  company: CompanyLegalInfo,
  pageNumber: number,
  pageCount: number,
  margin = 18
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerTop = pageHeight - 28;

  doc.setDrawColor(...DOC_COLORS.line);
  doc.setLineWidth(0.3);
  doc.line(margin, footerTop, pageWidth - margin, footerTop);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...DOC_COLORS.muted);

  const colWidth = (pageWidth - margin * 2) / 3;
  const lineH = 3.2;

  const col1: string[] = [company.companyName];
  if (company.street) col1.push(company.street);
  const cityLine = [company.postalCode, company.city].filter(Boolean).join(' ');
  if (cityLine) col1.push(cityLine);

  const col2: string[] = [];
  if (company.registerCourt || company.registerNumber) {
    col2.push([company.registerCourt, company.registerNumber].filter(Boolean).join(' · '));
  }
  if (company.managingDirectors) col2.push(`Geschäftsführer: ${company.managingDirectors}`);
  if (company.vatId) col2.push(`USt-IdNr.: ${company.vatId}`);

  const col3: string[] = [];
  if (company.phone) col3.push(`Tel.: ${company.phone}`);
  if (company.email) col3.push(company.email);
  if (company.web) col3.push(company.web);

  const drawCol = (lines: string[], x: number) => {
    lines.forEach((line, i) => {
      doc.text(line, x, footerTop + 5 + i * lineH);
    });
  };
  drawCol(col1, margin);
  drawCol(col2, margin + colWidth);
  drawCol(col3, margin + colWidth * 2);

  // AÜG-Hinweis (volle Breite, unter den Spalten)
  if (company.auegPermit) {
    const maxLines = Math.max(col1.length, col2.length, col3.length);
    doc.text(company.auegPermit, margin, footerTop + 5 + maxLines * lineH + 1.5);
  }

  // Seitenzahl rechts
  doc.setFontSize(7);
  doc.text(`Seite ${pageNumber} von ${pageCount}`, pageWidth - margin, pageHeight - 8, {
    align: 'right',
  });

  doc.setTextColor(...DOC_COLORS.text);
}

/**
 * Wendet die rechtssichere Fußzeile auf ALLE Seiten des Dokuments an.
 * Muss als letzter Schritt vor `doc.output()` aufgerufen werden.
 */
export function applyLegalFooter(doc: jsPDF, company: CompanyLegalInfo, margin = 18): void {
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    drawFooterOnCurrentPage(doc, company, p, pageCount, margin);
  }
}
