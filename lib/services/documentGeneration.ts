import type { jsPDF } from 'jspdf';
import type { UserOptions } from 'jspdf-autotable';
import { Timesheet, timesheetService } from './timesheets';
import { Assignment, assignmentService } from './assignments';
import { shiftService, type Shift } from './shifts';
import { facilityService } from './facilities';
import type { Facility } from '@/lib/types/facility';
import { userService } from './users';
import { firebaseStorageService } from './firebaseStorage';
import { logger } from '@/lib/logging';
import { getAppLogoUrl } from '@/lib/config/logo';
import {
  DOC_COLORS,
  DEFAULT_COMPANY_INFO,
  loadLogo,
  drawLetterhead,
  applyLegalFooter,
  type CompanyLegalInfo,
} from './documentLayout';

/**
 * jsPDF-Instanz, ergänzt um die von jspdf-autotable gesetzte
 * `lastAutoTable`-Eigenschaft (die Plugin-Typen augmentieren jsPDF in v5 nicht).
 */
type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

/** Signatur des Default-Exports von jspdf-autotable. */
type AutoTableFn = (doc: jsPDF, options: UserOptions) => void;

export type DocumentType = 
  | 'timesheet-report'      // Zeiterfassungsbericht
  | 'assignment-confirmation' // Einsatzbestätigung
  | 'shift-summary'         // Schichtzusammenfassung
  | 'monthly-report'        // Monatsbericht
  | 'custom-report'          // Benutzerdefinierter Bericht
  | 'assignment-notification' // Einsatzmitteilung nach § 11 Absatz 2 Satz 4 AÜG
  | 'assignment-signatures'   // Assignment mit allen Signaturen
  | 'admin-report';          // Admin-Bericht (High-End-PDF mit Firmenlogo)

export interface DocumentGenerationOptions {
  type: DocumentType;
  title?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  assignmentId?: string;
  timesheetIds?: string[];
  includeSignatures?: boolean;
  customData?: Record<string, unknown>;
  /** Pflichtangaben des Verleihers für Briefkopf & rechtssichere Fußzeile. */
  companyLegalInfo?: CompanyLegalInfo;
  /** Für Admin-Bericht-Export: Logo, Firmenname, Titel, Zeitraum */
  adminReportData?: {
    reportTitle: string;
    period: string;
    reportType: string;
    branding: {
      companyName?: string;
      companyLogo?: string;
    };
  };
  // Für Einsatzmitteilung nach § 11 AÜG
  assignmentNotificationData?: {
    employeeName: string;
    facilityName: string;
    facilityAddress?: string;
    stationName?: string;
    shiftTimes: string;
    /** Erstellungsdatum der Einsatzmitteilung (oben rechts) */
    assignmentCreationDate: Date;
    /** Einsatzdatum / Schichtdatum (oben rechts) */
    assignmentDate: Date;
    /** Datum der Unterschrift / Ausstellung (z. B. heute) */
    date: Date;
    isDeclined: boolean;
    signatureDataUrl?: string; // Base64 – bei Annahme und Ablehnung
    declineReason?: string;
    shiftType?: string;
    contactPerson?: string;
    branding?: {
      companyName?: string;
      companyLogo?: string; // URL zum Logo
    };
  };
}

export interface GeneratedDocument {
  url: string;
  fileName: string;
  fileSize: number;
  createdAt: Date;
}

class DocumentGenerationService {
  /**
   * Generiert ein PDF-Dokument basierend auf dem Typ und den Optionen
   */
  async generateDocument(options: DocumentGenerationOptions): Promise<GeneratedDocument> {
    const { default: jsPDF } = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default;
    
    const doc = new jsPDF() as JsPDFWithAutoTable;
    let pdfBlob: Blob;

    switch (options.type) {
      case 'timesheet-report':
        pdfBlob = await this.generateTimesheetReport(doc, autoTable, options);
        break;
      case 'assignment-confirmation':
        pdfBlob = await this.generateAssignmentConfirmation(doc, autoTable, options);
        break;
      case 'shift-summary':
        pdfBlob = await this.generateShiftSummary(doc, autoTable, options);
        break;
      case 'monthly-report':
        pdfBlob = await this.generateMonthlyReport(doc, autoTable, options);
        break;
      case 'custom-report':
        pdfBlob = await this.generateCustomReport(doc, autoTable, options);
        break;
      case 'assignment-notification':
        pdfBlob = await this.generateAssignmentNotification(doc, autoTable, options);
        break;
      case 'assignment-signatures':
        pdfBlob = await this.generateAssignmentSignatures(doc, autoTable, options);
        break;
      case 'admin-report':
        pdfBlob = await this.generateAdminReport(doc, autoTable, options);
        break;
      default:
        throw new Error(`Unbekannter Dokumenttyp: ${options.type}`);
    }

    // PDF in Firebase Storage hochladen
    const fileName = this.generateFileName(options);
    
    // Validiere PDF-Blob
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error('Fehler beim Generieren des PDF-Dokuments');
    }
    
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    try {
      const upload = await firebaseStorageService.uploadFile(
        file,
        `documents/generated/${fileName}`,
        {
          kind: 'generated-document',
          documentType: options.type,
          generatedAt: new Date().toISOString(),
        }
      );

      if (!upload?.url) {
        throw new Error('Fehler beim Hochladen des generierten Dokuments - keine URL erhalten');
      }

      return {
        url: upload.url,
        fileName,
        fileSize: pdfBlob.size,
        createdAt: new Date(),
      };
    } catch (uploadError) {
      logger.error('Upload-Fehler', uploadError instanceof Error ? uploadError : new Error(String(uploadError)));
      throw new Error(`Fehler beim Hochladen: ${uploadError instanceof Error ? uploadError.message : 'Unbekannter Fehler'}`);
    }
  }

  /**
   * Führt die Pflichtangaben des Verleihers aus den übergebenen Optionen und dem
   * Branding zu einer vollständigen CompanyLegalInfo zusammen (Fallback: Defaults).
   */
  private resolveCompanyInfo(
    options: DocumentGenerationOptions,
    brandingFallback?: { companyName?: string; companyLogo?: string }
  ): CompanyLegalInfo {
    const provided = options.companyLegalInfo;
    return {
      ...DEFAULT_COMPANY_INFO,
      ...provided,
      companyName:
        provided?.companyName ||
        brandingFallback?.companyName ||
        DEFAULT_COMPANY_INFO.companyName,
      companyLogo: provided?.companyLogo || brandingFallback?.companyLogo,
    };
  }

  /** Hilfsfunktion: Zahl als deutsche Stunden-Angabe (z. B. "8,50"). */
  private fmtHours(value: number): string {
    return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Generiert einen Stundennachweis / Tätigkeitsnachweis im Branchenstandard der
   * Arbeitnehmerüberlassung (Verleiher / Entleiher / Leiharbeitnehmer).
   *
   * Rechtsgrundlage der Arbeitszeitaufzeichnung: § 16 Abs. 2 ArbZG, § 17 MiLoG
   * sowie BAG-Beschluss v. 13.09.2022 (1 ABR 22/21). Aufbewahrung: 2 Jahre.
   */
  private async generateTimesheetReport(
    doc: JsPDFWithAutoTable,
    autoTable: AutoTableFn,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    const margin = 18;
    const pageWidth = doc.internal.pageSize.getWidth();
    const company = this.resolveCompanyInfo(options);

    // Briefkopf (Logo + Verleiher-Absender + Akzentlinie)
    const logo = await loadLogo(company.companyLogo);
    let y = drawLetterhead(doc, company, logo, margin);

    // —— Titel ——
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...DOC_COLORS.text);
    doc.text('Stundennachweis / Tätigkeitsnachweis', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...DOC_COLORS.muted);
    doc.text('Arbeitnehmerüberlassung gem. AÜG · Arbeitszeitaufzeichnung nach § 16 Abs. 2 ArbZG / § 17 MiLoG', margin, y);
    y += 10;

    // Lade Mitarbeiter- und Zeiterfassungs-Daten
    let employee = null as Awaited<ReturnType<typeof userService.getById>>;
    if (options.userId) {
      try {
        employee = await userService.getById(options.userId);
      } catch (error) {
        logger.error('Fehler beim Laden des Mitarbeiters', error instanceof Error ? error : new Error(String(error)));
      }
    }

    let timesheets: Timesheet[] = [];
    if (options.dateRange && options.userId) {
      try {
        const startDate = new Date(options.dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(options.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        timesheets = await timesheetService.getTimesheetsByDateRange(startDate, endDate, options.userId);
      } catch (error) {
        logger.error('Fehler beim Laden der Zeiterfassungen', error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Entleiher (Einsatzbetrieb) bestimmen: eindeutig oder mehrere
    const facilityIds = Array.from(
      new Set(timesheets.map(ts => ts.facilityId).filter((id): id is string => !!id))
    );
    let entleiher: Facility | null = null;
    if (facilityIds.length === 1) {
      try {
        entleiher = await facilityService.getById(facilityIds[0]);
      } catch (error) {
        logger.error('Fehler beim Laden des Entleihers', error instanceof Error ? error : new Error(String(error)));
      }
    }
    const multipleFacilities = facilityIds.length > 1;

    // —— Info-Block: Mitarbeiter (links) | Entleiher (rechts) ——
    const colGap = 6;
    const colWidth = (pageWidth - margin * 2 - colGap) / 2;
    const rightX = margin + colWidth + colGap;
    const blockTop = y;

    const drawInfoBlock = (
      x: number,
      heading: string,
      rows: [string, string][]
    ): number => {
      let by = blockTop;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DOC_COLORS.accent);
      doc.text(heading, x, by);
      by += 5;
      doc.setTextColor(...DOC_COLORS.text);
      rows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(label, x, by);
        doc.setFont('helvetica', 'normal');
        const valueLines = doc.splitTextToSize(value || '–', colWidth - 32);
        doc.text(valueLines, x + 32, by);
        by += Math.max(5, valueLines.length * 4.6);
      });
      return by;
    };

    const employeeName = employee?.displayName || '–';
    const employeeQualification =
      employee?.jobTitle ||
      (employee?.qualifications && employee.qualifications.length > 0
        ? employee.qualifications.join(', ')
        : '–');

    const entleiherName = multipleFacilities
      ? 'mehrere Einrichtungen – siehe Tabelle'
      : entleiher?.name || '–';
    const entleiherAddress = multipleFacilities ? '' : entleiher?.address || '';
    const stations = Array.from(
      new Set(timesheets.map(ts => ts.station).filter((s): s is string => !!s))
    );

    const leftEnd = drawInfoBlock(margin, 'Mitarbeiter (Leiharbeitnehmer)', [
      ['Name:', employeeName],
      ['Tätigkeit:', employeeQualification],
    ]);
    const rightRows: [string, string][] = [['Einrichtung:', entleiherName]];
    if (entleiherAddress) rightRows.push(['Anschrift:', entleiherAddress]);
    if (stations.length > 0) rightRows.push(['Station:', stations.join(', ')]);
    const rightEnd = drawInfoBlock(rightX, 'Entleiher (Einsatzbetrieb)', rightRows);

    y = Math.max(leftEnd, rightEnd) + 4;

    // Zeitraum
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...DOC_COLORS.text);
    if (options.dateRange) {
      doc.text(
        `Abrechnungszeitraum: ${options.dateRange.start.toLocaleDateString('de-DE')} – ${options.dateRange.end.toLocaleDateString('de-DE')}`,
        margin,
        y
      );
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DOC_COLORS.muted);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, pageWidth - margin, y, { align: 'right' });
    y += 8;
    doc.setTextColor(...DOC_COLORS.text);

    // —— Tabelle der Einsätze ——
    const head = multipleFacilities
      ? [['Datum', 'Einrichtung', 'Beginn', 'Ende', 'Pause', 'Std.', 'dav. Nacht', 'dav. So/Ft', 'Status']]
      : [['Datum', 'Beginn', 'Ende', 'Pause', 'Std.', 'dav. Nacht', 'dav. So/Ft', 'Status']];

    const body = timesheets.length > 0
      ? timesheets.map(ts => {
          const soFt = (ts.weekendHours || 0) + (ts.holidayHours || 0);
          const baseRow = [
            ts.date ? new Date(ts.date).toLocaleDateString('de-DE') : '-',
            ts.startTime || '-',
            ts.endTime || '-',
            `${ts.breakMinutes || 0} Min`,
            this.fmtHours(ts.totalHours || 0),
            this.fmtHours(ts.nightHours || 0),
            this.fmtHours(soFt),
            this.getStatusLabel(ts.status || 'pending'),
          ];
          return multipleFacilities
            ? [baseRow[0], ts.station || ts.facilityId || '-', ...baseRow.slice(1)]
            : baseRow;
        })
      : [multipleFacilities
          ? ['Keine Daten verfügbar', '', '', '', '', '', '', '', '']
          : ['Keine Daten verfügbar', '', '', '', '', '', '', '']];

    autoTable(doc, {
      head,
      body,
      startY: y,
      styles: { fontSize: 8.5, cellPadding: 2, textColor: DOC_COLORS.text },
      headStyles: { fillColor: DOC_COLORS.accent, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: DOC_COLORS.zebra },
      theme: 'grid',
      margin: { left: margin, right: margin },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 8;

    // —— Zusammenfassung ——
    if (timesheets.length > 0) {
      const totalHours = timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
      const nightHours = timesheets.reduce((sum, ts) => sum + (ts.nightHours || 0), 0);
      const soFtHours = timesheets.reduce((sum, ts) => sum + (ts.weekendHours || 0) + (ts.holidayHours || 0), 0);
      const approvedHours = timesheets
        .filter(ts => ts.status === 'approved')
        .reduce((sum, ts) => sum + (ts.totalHours || 0), 0);

      if (y > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        y = 24;
      }

      const sumX = pageWidth - margin - 70;
      doc.setDrawColor(...DOC_COLORS.line);
      doc.setLineWidth(0.3);
      doc.line(sumX, y, pageWidth - margin, y);
      y += 5;
      const sumRow = (label: string, value: string, bold = false) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(9);
        doc.text(label, sumX, y);
        doc.text(value, pageWidth - margin, y, { align: 'right' });
        y += 5.5;
      };
      sumRow('Gesamtstunden:', `${this.fmtHours(totalHours)} h`, true);
      sumRow('davon Nachtstunden:', `${this.fmtHours(nightHours)} h`);
      sumRow('davon Sonn-/Feiertag:', `${this.fmtHours(soFtHours)} h`);
      sumRow('genehmigte Stunden:', `${this.fmtHours(approvedHours)} h`);
      y += 6;
    }

    // —— Doppel-Unterschrift (Mitarbeiter / Entleiher) ——
    if (y > doc.internal.pageSize.getHeight() - 55) {
      doc.addPage();
      y = 24;
    }
    y += 6;
    const sigWidth = (pageWidth - margin * 2 - 16) / 2;
    const sigLineY = y + 16;
    doc.setDrawColor(...DOC_COLORS.text);
    doc.setLineWidth(0.3);
    doc.line(margin, sigLineY, margin + sigWidth, sigLineY);
    doc.line(margin + sigWidth + 16, sigLineY, margin + sigWidth * 2 + 16, sigLineY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...DOC_COLORS.muted);
    doc.text('Datum, Unterschrift Mitarbeiter/in', margin, sigLineY + 5);
    doc.text('Datum, Unterschrift / Stempel Entleiher', margin + sigWidth + 16, sigLineY + 5);
    y = sigLineY + 12;

    // Rechtlicher Hinweis
    doc.setFontSize(7.5);
    doc.setTextColor(...DOC_COLORS.muted);
    const legalNote = doc.splitTextToSize(
      'Mit seiner Unterschrift bestätigt der Entleiher die Richtigkeit der erfassten Arbeitszeiten. Aufzeichnung und Aufbewahrung gemäß § 16 Abs. 2 ArbZG und § 17 MiLoG (Aufbewahrungsfrist: mindestens 2 Jahre).',
      pageWidth - margin * 2
    );
    doc.text(legalNote, margin, y);

    // Rechtssichere Fußzeile auf allen Seiten
    applyLegalFooter(doc, company, margin);
    return doc.output('blob');
  }

  /**
   * Generiert eine Einsatzbestätigung
   */
  private async generateAssignmentConfirmation(
    doc: JsPDFWithAutoTable,
    autoTable: AutoTableFn,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    const margin = 14;
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Einsatzbestätigung', margin, y);
    
    y += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Lade Assignment-Daten
    let assignment: Assignment | null = null;
    let shift: Shift | null = null;
    let facility: Facility | null = null;
    
    if (options.assignmentId) {
      try {
        assignment = await assignmentService.getById(options.assignmentId);
        
        // Lade Schicht-Daten wenn Assignment vorhanden
        if (assignment?.shiftId) {
          try {
            shift = await shiftService.getById(assignment.shiftId);
            
            // Lade Einrichtungs-Daten wenn Schicht vorhanden
            if (shift?.facilityId) {
              try {
                facility = await facilityService.getById(shift.facilityId);
              } catch (error) {
                logger.error('Fehler beim Laden der Einrichtung', error instanceof Error ? error : new Error(String(error)));
              }
            }
          } catch (error) {
            logger.error('Fehler beim Laden der Schicht', error instanceof Error ? error : new Error(String(error)));
          }
        }
      } catch (error) {
        logger.error('Fehler beim Laden des Einsatzes', error instanceof Error ? error : new Error(String(error)));
      }
    }

    const assignmentData = [
      ['Einsatz-ID', options.assignmentId || '-'],
      ['Datum', assignment?.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE')],
      ['Status', this.getAssignmentStatusLabel(assignment?.status || 'pending')],
      ['Einrichtung', facility?.name || shift?.facilityId || '-'],
      ['Schicht', shift ? `${shift.startTime} - ${shift.endTime}` : '-'],
      ['Schichttyp', 'Schicht'],
      ['Abgeschlossen am', assignment?.completedAt ? new Date(assignment.completedAt).toLocaleDateString('de-DE') : '-'],
    ];

    assignmentData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), margin + 80, y);
      y += 10;
    });

    if (assignment?.notes) {
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Notizen:', margin, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      try {
        const notesLines = doc.splitTextToSize(assignment.notes, 170);
        if (Array.isArray(notesLines)) {
          notesLines.forEach((line: string) => {
            if (y > 250) { // Neue Seite wenn nötig
              doc.addPage();
              y = 20;
            }
            doc.text(line, margin, y);
            y += 6;
          });
        } else {
          doc.text(String(assignment.notes).substring(0, 100), margin, y);
        }
      } catch (error) {
        // Fallback wenn splitTextToSize fehlschlägt
        const truncatedNotes = String(assignment.notes).substring(0, 200);
        doc.text(truncatedNotes, margin, y);
        y += 8;
      }
    }

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Unterschriften:', margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Mitarbeiter: _________________________', margin, y);
    y += 10;
    doc.text('Einrichtung: _________________________', margin, y);

    return doc.output('blob');
  }

  /**
   * Generiert eine Schichtzusammenfassung
   */
  private async generateShiftSummary(
    doc: JsPDFWithAutoTable,
    autoTable: AutoTableFn,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    const margin = 14;
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Schichtzusammenfassung', margin, y);
    
    y += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const reportDate = options.dateRange?.start || new Date();
    doc.text(`Datum: ${reportDate.toLocaleDateString('de-DE')}`, margin, y);
    y += 15;

    // Lade Timesheet-Daten für den Tag
    let timesheets: Timesheet[] = [];
    if (options.dateRange && options.userId) {
      try {
        // Stelle sicher, dass die Daten korrekt normalisiert sind
        const startDate = new Date(options.dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(options.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        
        timesheets = await timesheetService.getTimesheetsByDateRange(
          startDate,
          endDate,
          options.userId
        );
      } catch (error) {
        logger.error('Fehler beim Laden der Schichtdaten', error instanceof Error ? error : new Error(String(error)));
        // Weiter mit leerem Array
      }
    }

    // Erstelle Tabellendaten
    const tableData = timesheets.length > 0
      ? timesheets.map(ts => [
          ts.date ? new Date(ts.date).toLocaleDateString('de-DE') : '-',
          `${ts.startTime || '-'} - ${ts.endTime || '-'}`,
          `${ts.totalHours?.toFixed(2) || '0,00'}`,
          this.getStatusLabel(ts.status || 'pending'),
        ])
      : [
          ['Keine Schichtdaten verfügbar', '', '', ''],
        ];

    autoTable(doc, {
      head: [['Datum', 'Schicht', 'Stunden', 'Status']],
      body: tableData,
      startY: y,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
      theme: 'striped',
    });

    return doc.output('blob');
  }

  /**
   * Generiert einen Monatsbericht
   */
  private async generateMonthlyReport(
    doc: JsPDFWithAutoTable,
    autoTable: AutoTableFn,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    const margin = 14;
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Monatsbericht', margin, y);
    
    y += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const reportDate = options.dateRange?.start || new Date();
    const month = reportDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    doc.text(`Monat: ${month}`, margin, y);
    y += 15;

    // Lade Timesheet-Daten für den Monat
    let timesheets: Timesheet[] = [];
    if (options.dateRange && options.userId) {
      try {
        // Stelle sicher, dass die Daten korrekt normalisiert sind
        const startDate = new Date(options.dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(options.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        
        timesheets = await timesheetService.getTimesheetsByDateRange(
          startDate,
          endDate,
          options.userId
        );
      } catch (error) {
        logger.error('Fehler beim Laden der Monatsdaten', error instanceof Error ? error : new Error(String(error)));
        // Weiter mit leerem Array
      }
    }

    // Berechne Statistiken
    const totalHours = timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
    const overtimeHours = timesheets.reduce((sum, ts) => sum + (ts.overtimeHours || 0), 0);
    const nightHours = timesheets.reduce((sum, ts) => sum + (ts.nightHours || 0), 0);
    const assignmentCount = timesheets.length;

    // Statistiken
    const stats = [
      ['Gesamtstunden', totalHours.toFixed(2)],
      ['Einsätze', String(assignmentCount)],
      ['Überstunden', overtimeHours.toFixed(2)],
      ['Nachtstunden', nightHours.toFixed(2)],
    ];

    stats.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 80, y);
      y += 10;
    });

    y += 10;
    
    // Detaillierte Tabelle mit echten Daten
    const tableData = timesheets.length > 0
      ? timesheets.map(ts => [
          ts.date ? new Date(ts.date).toLocaleDateString('de-DE') : '-',
          `${ts.totalHours?.toFixed(2) || '0,00'}`,
          '1', // Ein Einsatz pro Timesheet
          `${ts.totalHours?.toFixed(2) || '0,00'}`,
        ])
      : [
          ['Keine Daten verfügbar', '', '', ''],
        ];

    // Limit auf 50 Einträge pro Seite, bei mehr automatisch neue Seiten
    const maxEntriesPerPage = 50;
    const entriesToShow = tableData.slice(0, maxEntriesPerPage);
    
    autoTable(doc, {
      head: [['Datum', 'Stunden', 'Einsätze', 'Durchschnitt']],
      body: entriesToShow,
      startY: y,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
      theme: 'striped',
    });
    
    // Wenn mehr Einträge vorhanden sind, Hinweis hinzufügen
    if (tableData.length > maxEntriesPerPage) {
      const finalY = doc.lastAutoTable?.finalY || y + (entriesToShow.length * 10) + 20;
      y = finalY + 10;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text(`Hinweis: Es werden nur die ersten ${maxEntriesPerPage} von ${tableData.length} Einträgen angezeigt.`, margin, y);
    }

    return doc.output('blob');
  }

  /**
   * Generiert einen benutzerdefinierten Bericht
   */
  private async generateCustomReport(
    doc: JsPDFWithAutoTable,
    autoTable: AutoTableFn,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    const margin = 14;
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title || 'Benutzerdefinierter Bericht', margin, y);
    
    y += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, margin, y);
    y += 15;

    // Benutzerdefinierte Daten
    if (options.customData) {
      Object.entries(options.customData).forEach(([key, value]) => {
        // Prüfe ob neue Seite nötig
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${key}:`, margin, y);
        doc.setFont('helvetica', 'normal');
        
        // Handle lange Texte
        try {
          const valueStr = String(value || '');
          if (valueStr.length > 100) {
            // Text umbrechen
            const lines = doc.splitTextToSize(valueStr, 170);
            if (Array.isArray(lines)) {
              lines.forEach((line: string) => {
                if (y > 250) {
                  doc.addPage();
                  y = 20;
                }
                doc.text(line, margin + 80, y);
                y += 6;
              });
            } else {
              doc.text(valueStr.substring(0, 100), margin + 80, y);
              y += 10;
            }
          } else {
            doc.text(valueStr, margin + 80, y);
            y += 10;
          }
        } catch (error) {
          // Fallback für komplexe Objekte
          doc.text(JSON.stringify(value).substring(0, 100), margin + 80, y);
          y += 10;
        }
      });
    } else {
      // Wenn keine customData vorhanden, zeige Hinweis
      doc.setFont('helvetica', 'italic');
      doc.text('Keine benutzerdefinierten Daten vorhanden', margin, y);
      y += 10;
    }

    return doc.output('blob');
  }

  /**
   * Generiert einen professionellen Admin-Bericht (High-End-PDF) mit Firmenlogo.
   * Nutzt das vom Admin gepflegte Branding (Einstellungen).
   */
  private async generateAdminReport(
    doc: JsPDFWithAutoTable,
    _autoTable: AutoTableFn,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    if (!options.adminReportData) {
      throw new Error('adminReportData ist erforderlich für Admin-Bericht');
    }

    const data = options.adminReportData;
    const margin = 18;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 22;

    // —— Logo (vom Admin gepflegt) ——
    const logoPath = getAppLogoUrl(data.branding?.companyLogo);
    const logoUrl =
      logoPath.startsWith('http') ? logoPath : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${logoPath}`;
    try {
      const logoResponse = await fetch(logoUrl);
      if (!logoResponse.ok) throw new Error(`Logo: ${logoResponse.status}`);
      const logoBlob = await logoResponse.blob();
      const logoDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(logoBlob);
      });

      const logoMaxWidth = 48;
      const logoMaxHeight = 28;
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = logoDataUrl;
      });
      let logoW = img.width;
      let logoH = img.height;
      const ratio = Math.min(logoMaxWidth / logoW, logoMaxHeight / logoH);
      logoW = logoW * ratio;
      logoH = logoH * ratio;
      const logoX = pageWidth - margin - logoW;
      doc.addImage(logoDataUrl, 'PNG', logoX, y, logoW, logoH);
    } catch (err) {
      logger.error('Logo für Admin-Bericht nicht geladen', err instanceof Error ? err : new Error(String(err)));
    }

    // —— Firmenname (links, unterhalb Logo-Zone) ——
    const companyName = data.branding?.companyName || 'JobFlow';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(companyName, margin, y + 8);
    y += 22;

    // Dezente Trennlinie
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    // —— Berichtstitel ——
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 30, 30);
    doc.text(data.reportTitle, margin, y);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const periodLabel = this.getReportPeriodLabel(data.period);
    doc.text(`Zeitraum: ${periodLabel}`, margin, y);
    y += 8;
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, y);
    y += 18;

    // Kurzer Hinweis (professionell)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const reportTypeLabel = this.getReportTypeLabel(data.reportType);
    doc.text(`Berichtstyp: ${reportTypeLabel}`, margin, y);
    y += 10;
    doc.text('Dieses Dokument wurde automatisch von JobFlow erstellt.', margin, y);

    // Footer-Zeile unten
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `${companyName} · ${new Date().toLocaleDateString('de-DE')}`,
      margin,
      pageHeight - 12
    );
    doc.text(
      'Vertraulich',
      pageWidth - margin - doc.getTextWidth('Vertraulich'),
      pageHeight - 12
    );

    return doc.output('blob');
  }

  private getReportPeriodLabel(period: string): string {
    const map: Record<string, string> = {
      'current-month': 'Aktueller Monat',
      'last-month': 'Vormonat',
      'current-quarter': 'Aktuelles Quartal',
      'current-year': 'Aktuelles Jahr',
      'custom': 'Individuell',
    };
    return map[period] || period;
  }

  private getReportTypeLabel(reportType: string): string {
    const map: Record<string, string> = {
      timesheet: 'Zeitkonten',
      allowances: 'Zuschläge',
      shifts: 'Schichten',
      summary: 'Zusammenfassung / Mitarbeiter-Statistik',
    };
    return map[reportType] || reportType;
  }

  /**
   * Generiert eine Einsatzmitteilung nach § 11 Absatz 2 Satz 4 AÜG.
   * Enthält: Erstellungsdatum und Einsatzdatum oben rechts, Einsatzort, AufAbruf GmbH,
   * Status (Angenommen/Abgelehnt), Unterschrift bei Annahme und Ablehnung.
   */
  private async generateAssignmentNotification(
    doc: JsPDFWithAutoTable,
    autoTable: AutoTableFn,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    if (!options.assignmentNotificationData) {
      throw new Error('assignmentNotificationData ist erforderlich für Einsatzmitteilung');
    }

    const data = options.assignmentNotificationData;
    const margin = 18;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    const company = this.resolveCompanyInfo(options, data.branding);
    const companyName = company.companyName;

    const formatDate = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const creationDateStr = formatDate(data.assignmentCreationDate);
    const assignmentDateStr = formatDate(data.assignmentDate);

    // Briefkopf (Logo + Verleiher-Absender + Akzentlinie)
    const logo = await loadLogo(company.companyLogo);
    let y = drawLetterhead(doc, company, logo, margin);

    // Erstellungsdatum oben rechts
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DOC_COLORS.muted);
    doc.text(`Erstellt am: ${creationDateStr}`, pageWidth - margin, y, { align: 'right' });
    doc.setTextColor(...DOC_COLORS.text);

    // Titel
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DOC_COLORS.accent);
    doc.text('Einsatzmitteilung', margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DOC_COLORS.muted);
    doc.text('gemäß § 11 Absatz 2 Satz 4 AÜG', margin, y);
    y += 11;
    doc.setTextColor(...DOC_COLORS.text);

    // Status-Badge: EINSATZ ANGENOMMEN / ABGELEHNT
    const statusLabel = data.isDeclined ? 'EINSATZ ABGELEHNT' : 'EINSATZ ANGENOMMEN';
    const statusColor: [number, number, number] = data.isDeclined ? [183, 28, 28] : [27, 94, 32];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const badgeW = doc.getTextWidth(statusLabel) + 8;
    doc.setFillColor(...statusColor);
    doc.roundedRect(margin, y - 5, badgeW, 8, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(statusLabel, margin + 4, y);
    doc.setTextColor(...DOC_COLORS.text);
    y += 13;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Mitarbeiter:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.employeeName, margin + 45, y);
    y += 10;

    // Hinweistext: Zeitarbeitnehmer für Verleiher
    doc.text(`Hiermit setze ich Sie in Kenntnis, dass Sie als Zeitarbeitnehmer für die ${companyName} tätig werden.`, margin, y);
    y += 10;

    // Einsatzort
    doc.setFont('helvetica', 'bold');
    doc.text('Einsatzort:', margin, y);
    doc.setFont('helvetica', 'normal');
    const facilityText = [data.facilityName, data.stationName, data.facilityAddress].filter(Boolean).join(', ');
    doc.text(facilityText || '–', margin + 45, y);
    y += 8;

    // Schichtart
    if (data.shiftType) {
      doc.setFont('helvetica', 'bold');
      doc.text('Schichtart:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.shiftType, margin + 45, y);
      y += 8;
    }

    // Ansprechpartner
    if (data.contactPerson) {
      doc.setFont('helvetica', 'bold');
      doc.text('Ansprechpartner:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.contactPerson, margin + 45, y);
      y += 8;
    }

    // Einsatzzeiten als Tabelle (Datum | Zeiten)
    doc.setFont('helvetica', 'bold');
    doc.text('Einsatzzeiten:', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
      startY: y,
      head: [['Datum', 'Zeiten']],
      body: [[assignmentDateStr, data.shiftTimes]],
      margin: { left: margin },
      theme: 'plain',
      headStyles: { fontStyle: 'bold' },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 10;

    // Zeiterfassungs- und Arbeitsschutz-Hinweise (bei Annahme nur diese; bei Ablehnung danach noch Ablehnungsblock)
    doc.setFontSize(10);
    const hintText1 = `Die Einsatzzeit wird über die App erfasst. Bitte lassen Sie die Zeiterfassung vom Berechtigten am Einsatzort in der App digital unterschreiben. Die erfassten Zeiten werden automatisch an die ${companyName} Zentrale übermittelt.`;
    const hintLines1 = doc.splitTextToSize(hintText1, contentWidth);
    hintLines1.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });
    y += 4;
    const hintText2 = 'Bitte denken Sie an entsprechende Arbeitsschutzkleidung (Kasack, festes Schuhwerk) und achten die Hygienevorschriften sowie den zur Verfügung gestellten Hautschutzplan.';
    const hintLines2 = doc.splitTextToSize(hintText2, contentWidth);
    hintLines2.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });
    y += 6;

    // Nur bei Ablehnung: zusätzlicher Abschnitt „Ablehnung der angeforderten Dienste“
    if (data.isDeclined) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Ablehnung der angeforderten Dienste', margin, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      const declineLines = doc.splitTextToSize(
        `Hiermit lehne ich den angeforderten Dienst am ${assignmentDateStr} ab. Mir ist bewusst, dass mir diese Zeit von meiner vertraglich vereinbarten Betriebszeit in Abzug gebracht wird.`,
        contentWidth
      );
      declineLines.forEach((line: string) => {
        doc.text(line, margin, y);
        y += 6;
      });
      y += 8;
      if (data.declineReason) {
        doc.setFont('helvetica', 'bold');
        doc.text('Begründung:', margin, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        const reasonLines = doc.splitTextToSize(data.declineReason, contentWidth);
        reasonLines.forEach((line: string) => {
          doc.text(line, margin, y);
          y += 6;
        });
        y += 6;
      }
    }

    // Unterschriftsbereich
    y += 14;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const signatureY = y + 18;
    doc.line(margin, signatureY, margin + 100, signatureY);
    y = signatureY + 8;
    doc.text('Datum / Unterschrift Mitarbeiter/in', margin, y);

    // Unterschrift einfügen bei Annahme und Ablehnung, wenn vorhanden
    if (data.signatureDataUrl) {
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = data.signatureDataUrl!;
        });
        const maxWidth = 80;
        const maxHeight = 30;
        let imgWidth = img.width;
        let imgHeight = img.height;
        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        imgWidth = imgWidth * ratio;
        imgHeight = imgHeight * ratio;
        doc.addImage(data.signatureDataUrl, 'PNG', margin, signatureY - imgHeight - 2, imgWidth, imgHeight);
      } catch (error) {
        logger.error('Fehler beim Einfügen der Unterschrift', error instanceof Error ? error : new Error(String(error)));
        doc.text('[Unterschrift vorhanden]', margin, signatureY - 5);
      }
    }

    y += 14;
    doc.text(`Datum: ${formatDate(data.date)}`, margin, y);

    // Rechtssichere Fußzeile auf allen Seiten
    applyLegalFooter(doc, company, margin);
    return doc.output('blob');
  }

  /**
   * Generiert ein PDF mit allen Signaturen für ein Assignment
   * Enthält: Employee Signature (bei Ablehnung), Relieving Personnel Signatures, Facility Signatures
   */
  private async generateAssignmentSignatures(
    doc: JsPDFWithAutoTable,
    _autoTable: AutoTableFn,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    if (!options.assignmentId) {
      throw new Error('assignmentId ist erforderlich für Assignment-Signaturen-PDF');
    }

    const assignment = await assignmentService.getById(options.assignmentId);
    if (!assignment) {
      throw new Error('Assignment nicht gefunden');
    }

    const shift = await shiftService.getById(assignment.shiftId);
    if (!shift) {
      throw new Error('Shift nicht gefunden');
    }

    const facility = shift.facilityId ? await facilityService.getById(shift.facilityId) : null;
    const employee = await userService.getById(assignment.userId);

    const margin = 14;
    let y = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Zeiterfassung mit Unterschriften', margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Assignment-ID: ${assignment.id}`, margin, y);
    y += 8;

    // Assignment-Informationen
    doc.setFont('helvetica', 'bold');
    doc.text('Einsatzinformationen:', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');

    if (employee) {
      doc.text(`Mitarbeiter: ${employee.displayName}`, margin, y);
      y += 6;
    }

    if (facility) {
      doc.text(`Einrichtung: ${facility.name}`, margin, y);
      y += 6;
    }

    if (shift) {
      const shiftDate = typeof shift.date === 'string' ? new Date(shift.date) : (shift.date as Date);
      doc.text(`Datum: ${shiftDate.toLocaleDateString('de-DE')}`, margin, y);
      y += 6;
      doc.text(`Zeiten: ${shift.startTime} - ${shift.endTime}`, margin, y);
      y += 6;
    }

    y += 10;

    // Employee Signature (bei Ablehnung)
    if (assignment.employeeSignatureUrl) {
      doc.setFont('helvetica', 'bold');
      doc.text('Mitarbeiter-Unterschrift (Ablehnung):', margin, y);
      y += 8;

      try {
        const signatureResponse = await fetch(assignment.employeeSignatureUrl);
        const signatureBlob = await signatureResponse.blob();
        const signatureDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(signatureBlob);
        });

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = signatureDataUrl;
        });

        const maxWidth = 100;
        const maxHeight = 40;
        let imgWidth = img.width;
        let imgHeight = img.height;
        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        imgWidth = imgWidth * ratio;
        imgHeight = imgHeight * ratio;

        doc.addImage(signatureDataUrl, 'PNG', margin, y, imgWidth, imgHeight);
        y += imgHeight + 5;

        if (assignment.employeeSignedAt) {
          doc.setFontSize(10);
          const signedAt = assignment.employeeSignedAt instanceof Date ? assignment.employeeSignedAt : new Date(assignment.employeeSignedAt);
          doc.text(`Unterschrieben am: ${signedAt.toLocaleDateString('de-DE')} ${signedAt.toLocaleTimeString('de-DE')}`, margin, y);
          y += 6;
        }
        doc.setFontSize(12);
      } catch (error) {
        logger.error('Fehler beim Laden der Mitarbeiter-Unterschrift', error instanceof Error ? error : new Error(String(error)));
        doc.text('[Unterschrift konnte nicht geladen werden]', margin, y);
        y += 8;
      }

      y += 10;
    }

    // Relieving Personnel Signatures
    if (assignment.relievingSignatures && assignment.relievingSignatures.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Unterschriften durch ablösendes Personal:', margin, y);
      y += 8;

      for (const sig of assignment.relievingSignatures) {
        // Prüfe ob neue Seite benötigt wird
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Datum: ${sig.date}`, margin, y);
        y += 6;
        doc.text(`Unterschrieben von: ${sig.signerName}${sig.signerRole ? ` (${sig.signerRole})` : ''}`, margin, y);
        y += 6;

        if (sig.verifiedTimes) {
          doc.setFontSize(10);
          doc.text(`Verifizierte Zeiten: ${sig.verifiedTimes.startTime} - ${sig.verifiedTimes.endTime}`, margin, y);
          y += 5;
          doc.text(`Pausen: ${sig.verifiedTimes.breakMinutes} Min, Gesamt: ${sig.verifiedTimes.totalHours}h`, margin, y);
          y += 5;
          doc.setFontSize(11);
        }

        try {
          const signatureResponse = await fetch(sig.signatureUrl);
          const signatureBlob = await signatureResponse.blob();
          const signatureDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(signatureBlob);
          });

          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = signatureDataUrl;
          });

          const maxWidth = 100;
          const maxHeight = 40;
          let imgWidth = img.width;
          let imgHeight = img.height;
          const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
          imgWidth = imgWidth * ratio;
          imgHeight = imgHeight * ratio;

          doc.addImage(signatureDataUrl, 'PNG', margin, y, imgWidth, imgHeight);
          y += imgHeight + 5;

          doc.setFontSize(10);
          const signedAt = sig.signedAt instanceof Date ? sig.signedAt : new Date(sig.signedAt);
          doc.text(`Unterschrieben am: ${signedAt.toLocaleDateString('de-DE')} ${signedAt.toLocaleTimeString('de-DE')}`, margin, y);
          y += 8;
          doc.setFontSize(12);
        } catch (error) {
          logger.error('Fehler beim Laden der Unterschrift', error instanceof Error ? error : new Error(String(error)));
          doc.text('[Unterschrift konnte nicht geladen werden]', margin, y);
          y += 8;
        }

        y += 10;
      }
    }

    // Facility Signatures (von Timesheets)
    if (options.timesheetIds && options.timesheetIds.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Unterschriften durch Einrichtung:', margin, y);
      y += 8;

      for (const timesheetId of options.timesheetIds) {
        const timesheet = await timesheetService.getById(timesheetId);
        if (timesheet && timesheet.facilitySignatureUrl) {
          // Prüfe ob neue Seite benötigt wird
          if (y > 250) {
            doc.addPage();
            y = 20;
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          const tsDate = timesheet.date instanceof Date ? timesheet.date : new Date(timesheet.date);
          doc.text(`Datum: ${tsDate.toLocaleDateString('de-DE')}`, margin, y);
          y += 6;
          doc.text(`Zeiten: ${timesheet.startTime} - ${timesheet.endTime}`, margin, y);
          y += 6;
          doc.text(`Gesamtstunden: ${timesheet.totalHours}h`, margin, y);
          y += 6;

          if (timesheet.facilitySignerName) {
            doc.text(`Unterschrieben von: ${timesheet.facilitySignerName}`, margin, y);
            y += 6;
          }

          try {
            const signatureResponse = await fetch(timesheet.facilitySignatureUrl);
            const signatureBlob = await signatureResponse.blob();
            const signatureDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(signatureBlob);
            });

            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = reject;
              img.src = signatureDataUrl;
            });

            const maxWidth = 100;
            const maxHeight = 40;
            let imgWidth = img.width;
            let imgHeight = img.height;
            const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
            imgWidth = imgWidth * ratio;
            imgHeight = imgHeight * ratio;

            doc.addImage(signatureDataUrl, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 5;

            if (timesheet.facilitySignedAt) {
              doc.setFontSize(10);
              const facilitySignedAt = timesheet.facilitySignedAt instanceof Date ? timesheet.facilitySignedAt : new Date(timesheet.facilitySignedAt);
              doc.text(`Unterschrieben am: ${facilitySignedAt.toLocaleDateString('de-DE')} ${facilitySignedAt.toLocaleTimeString('de-DE')}`, margin, y);
              y += 8;
            }
            doc.setFontSize(12);
          } catch (error) {
            logger.error('Fehler beim Laden der Einrichtungs-Unterschrift', error instanceof Error ? error : new Error(String(error)));
            doc.text('[Unterschrift konnte nicht geladen werden]', margin, y);
            y += 8;
          }

          y += 10;
        }
      }
    }

    // Footer
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}`, margin, y);

    return doc.output('blob');
  }

  /**
   * Generiert einen Dateinamen für das Dokument
   */
  private generateFileName(options: DocumentGenerationOptions): string {
    const date = new Date().toISOString().split('T')[0];
    const typeMap: Record<DocumentType, string> = {
      'timesheet-report': 'Zeiterfassungsbericht',
      'assignment-confirmation': 'Einsatzbestätigung',
      'shift-summary': 'Schichtzusammenfassung',
      'monthly-report': 'Monatsbericht',
      'custom-report': 'Bericht',
      'assignment-notification': 'Einsatzmitteilung',
      'assignment-signatures': 'Zeiterfassung_Unterschriften',
      'admin-report': 'Bericht',
    };
    
    const typeName = typeMap[options.type] || 'Dokument';
    return `${typeName}_${date}.pdf`;
  }

  /**
   * Konvertiert Timesheet-Status zu Label
   */
  private getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Ausstehend',
      'submitted': 'Eingereicht',
      'approved': 'Genehmigt',
      'rejected': 'Abgelehnt',
    };
    return statusMap[status] || status;
  }

  /**
   * Konvertiert Assignment-Status zu Label
   */
  private getAssignmentStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'requested': 'Angefragt',
      'accepted': 'Angenommen',
      'declined': 'Abgelehnt',
      'assigned': 'Zugewiesen',
      'completed': 'Abgeschlossen',
      'pending-signature': 'Wartet auf Unterschrift',
      'pending': 'Ausstehend',
      'done': 'Erledigt',
    };
    return statusMap[status] || status;
  }
}

export const documentGenerationService = new DocumentGenerationService();

