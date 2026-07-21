/**
 * Sammel-PDF: Mehrere Einsatzmitteilungen mit zugeordneter Zeiterfassung
 * zu einem PDF zusammenführen (Drucken / Abspeichern).
 */
import { assignmentService } from './assignments';
import { shiftService } from './shifts';
import { timesheetService } from './timesheets';
import { userService } from './users';
import { facilityService } from './facilities';
import { logger } from '@/lib/logging';

export interface AssignmentForCollection {
  id: string;
  userId: string;
  pdfUrl: string;
}

export interface CollectionPdfOptions {
  /** Assignments mit pdfUrl (Einsatzmitteilung vorhanden) */
  assignments: AssignmentForCollection[];
  title?: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Erstellt ein Sammel-PDF: Für jeden Einsatz zuerst eine Seite
 * "Erfasste Zeit zu dieser Einsatzmitteilung", dann die Einsatzmitteilung.
 * So bleibt die Zeiterfassung der jeweiligen Einsatzmitteilung zugeordnet.
 */
export async function buildAssignmentCollectionPdf(
  options: CollectionPdfOptions
): Promise<Uint8Array> {
  const { assignments } = options;
  if (assignments.length === 0) {
    throw new Error('Keine Einsätze mit Einsatzmitteilung ausgewählt.');
  }

  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const mergedPdf = await PDFDocument.create();
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  const lineHeight = 16;

  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    let shiftDate: Date | null = null;
    let employeeName = '–';
    let facilityName = '–';
    let timesheet: { startTime: string; endTime: string; totalHours: number; date: Date } | null = null;

    try {
      const assignment = await assignmentService.getById(a.id);
      if (!assignment) continue;
      const shift = await shiftService.getById(assignment.shiftId);
      if (shift) {
        shiftDate =
          typeof shift.date === 'string' ? new Date(shift.date) : (shift.date as Date);
        const user = await userService.getById(assignment.userId);
        if (user) employeeName = user.displayName || user.email || '–';
        if (shift.facilityId) {
          const facility = await facilityService.getById(shift.facilityId);
          if (facility) facilityName = facility.name || '–';
        }
        const startOfDay = new Date(shiftDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(shiftDate);
        endOfDay.setHours(23, 59, 59, 999);
        const sheets = await timesheetService.getByUserAndDateRange(
          assignment.userId,
          startOfDay,
          endOfDay
        );
        if (sheets.length > 0) {
          const ts = sheets[0];
          const d = ts.date instanceof Date ? ts.date : new Date(ts.date);
          timesheet = {
            startTime: ts.startTime || '–',
            endTime: ts.endTime || '–',
            totalHours: ts.totalHours ?? 0,
            date: d,
          };
        }
      }
    } catch (e) {
      logger.error('Fehler beim Laden der Daten für Assignment ' + a.id, e);
    }

    // Seite "Erfasste Zeit zu dieser Einsatzmitteilung"
    const timesheetPage = mergedPdf.addPage([595, 842]);
    let y = 800;
    timesheetPage.drawText('Erfasste Zeit zu dieser Einsatzmitteilung', {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    timesheetPage.drawText(`Mitarbeiter: ${employeeName}`, {
      x: margin,
      y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
    timesheetPage.drawText(`Einsatzort: ${facilityName}`, {
      x: margin,
      y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
    timesheetPage.drawText(
      `Einsatzdatum: ${shiftDate ? formatDate(shiftDate) : '–'}`,
      { x: margin, y, size: 11, font, color: rgb(0, 0, 0) }
    );
    y -= lineHeight * 1.5;

    if (timesheet) {
      timesheetPage.drawText('Erfasste Zeiten (Schichtende):', {
        x: margin,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
      timesheetPage.drawText(
        `Von ${timesheet.startTime} bis ${timesheet.endTime}, Gesamt: ${timesheet.totalHours.toFixed(2)} h`,
        { x: margin, y, size: 11, font, color: rgb(0, 0, 0) }
      );
    } else {
      timesheetPage.drawText('Erfasste Zeiten: Keine Zeiterfassung für diesen Tag vorhanden.', {
        x: margin,
        y,
        size: 11,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    y -= lineHeight * 2;
    timesheetPage.drawText('—— Nachfolgend: Einsatzmitteilung ——', {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Einsatzmitteilung-PDF anhängen
    try {
      const res = await fetch(a.pdfUrl, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const pdfBytes = await res.arrayBuffer();
      const srcPdf = await PDFDocument.load(pdfBytes);
      const pageCount = srcPdf.getPageCount();
      const copiedPages = await mergedPdf.copyPages(srcPdf, Array.from({ length: pageCount }, (_, k) => k));
      copiedPages.forEach(p => mergedPdf.addPage(p));
    } catch (e) {
      logger.error('Fehler beim Laden der Einsatzmitteilung ' + a.pdfUrl, e);
      const fallbackPage = mergedPdf.addPage([595, 842]);
      fallbackPage.drawText('Einsatzmitteilung konnte nicht geladen werden.', {
        x: margin,
        y: 800,
        size: 11,
        font,
        color: rgb(0.6, 0, 0),
      });
      fallbackPage.drawText(`URL: ${a.pdfUrl}`, {
        x: margin,
        y: 780,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
  }

  return mergedPdf.save();
}

/**
 * Löst den Download des Sammel-PDFs aus (im Browser).
 */
export function downloadCollectionPdf(bytes: Uint8Array, fileName?: string): void {
  const name = fileName || `Einsatzmitteilungen_Sammlung_${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
