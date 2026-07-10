/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timesheet, timesheetService } from './timesheets';
import { Assignment, assignmentService } from './assignments';
import { shiftService } from './shifts';
import { facilityService } from './facilities';
import { userService } from './users';
import { firebaseStorageService } from './firebaseStorage';
import { logger } from '@/lib/logging';
import { getAppLogoUrl } from '@/lib/config/logo';
import {
  PDF_MARGIN,
  brandedTableOptions,
  drawFooters,
  drawLetterhead,
  kvLine,
  sectionTitle,
  signatureLine,
} from '@/lib/services/pdf/brandedPdf';

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
    
    const doc = new (jsPDF as any)();
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
   * Generiert einen Zeiterfassungsbericht
   */
  private async generateTimesheetReport(
    doc: any,
    autoTable: any,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    const margin = PDF_MARGIN;
    let y = await drawLetterhead(doc, {
      title: 'Zeiterfassungsbericht',
      subtitle: options.dateRange
        ? `Zeitraum: ${options.dateRange.start.toLocaleDateString('de-DE')} – ${options.dateRange.end.toLocaleDateString('de-DE')}`
        : undefined,
    });

    // Lade echte Timesheet-Daten
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
        logger.error('Fehler beim Laden der Zeiterfassungen', error instanceof Error ? error : new Error(String(error)));
        // Weiter mit leerem Array
      }
    }

    // Erstelle Tabellendaten
    const tableData = timesheets.length > 0
      ? timesheets.map(ts => [
          ts.date ? new Date(ts.date).toLocaleDateString('de-DE') : '-',
          ts.startTime || '-',
          ts.endTime || '-',
          `${ts.breakMinutes || 0} Min`,
          `${ts.totalHours?.toFixed(2) || '0,00'}`,
          this.getStatusLabel(ts.status || 'pending'),
        ])
      : [
          ['Keine Daten verfügbar', '', '', '', '', ''],
        ];

    // Limit auf 100 Einträge pro Seite für Zeiterfassungsberichte
    const maxEntriesPerPage = 100;
    const entriesToShow = tableData.slice(0, maxEntriesPerPage);
    
    autoTable(doc, {
      head: [['Datum', 'Start', 'Ende', 'Pause', 'Stunden', 'Status']],
      body: entriesToShow,
      startY: y,
      ...brandedTableOptions([3, 4]),
    });
    
    // Wenn mehr Einträge vorhanden sind, Hinweis hinzufügen
    if (tableData.length > maxEntriesPerPage) {
      const finalY = (doc as any).lastAutoTable?.finalY || y + (entriesToShow.length * 10) + 20;
      y = finalY + 10;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text(`Hinweis: Es werden nur die ersten ${maxEntriesPerPage} von ${tableData.length} Einträgen angezeigt.`, margin, y);
      y += 10;
    }

    // Zusammenfassung
    if (timesheets.length > 0) {
      const totalHours = timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
      const approvedHours = timesheets
        .filter(ts => ts.status === 'approved')
        .reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
      
      // Ermittle die Y-Position nach der Tabelle
      const displayedEntries = Math.min(timesheets.length, 100);
      const finalY = (doc as any).lastAutoTable?.finalY || y + (displayedEntries * 10) + 20;
      y = finalY + 15;
      
      y = sectionTitle(doc, y, 'Zusammenfassung');
      y = kvLine(doc, y, 'Gesamtstunden', `${totalHours.toFixed(2)} h`);
      y = kvLine(doc, y, 'Genehmigte Stunden', `${approvedHours.toFixed(2)} h`);
    }

    drawFooters(doc);
    return doc.output('blob');
  }

  /**
   * Generiert eine Einsatzbestätigung
   */
  private async generateAssignmentConfirmation(
    doc: any,
    autoTable: any,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    const margin = PDF_MARGIN;
    let y = await drawLetterhead(doc, { title: 'Einsatzbestätigung' });

    // Lade Assignment-Daten
    let assignment: Assignment | null = null;
    let shift: any = null;
    let facility: any = null;
    
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

    y = sectionTitle(doc, y, 'Einsatzdaten');
    assignmentData.forEach(([label, value]) => {
      y = kvLine(doc, y, String(label), String(value));
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
      } catch (_error) {
        // Fallback wenn splitTextToSize fehlschlägt
        const truncatedNotes = String(assignment.notes).substring(0, 200);
        doc.text(truncatedNotes, margin, y);
        y += 8;
      }
    }

    y += 14;
    y = sectionTitle(doc, y, 'Unterschriften');
    y += 12;
    y = signatureLine(doc, y, 'Datum / Unterschrift Mitarbeiter/in');
    y += 10;
    y = signatureLine(doc, y, 'Datum / Unterschrift Einrichtung');

    drawFooters(doc);
    return doc.output('blob');
  }

  /**
   * Generiert eine Schichtzusammenfassung
   */
  private async generateShiftSummary(
    doc: any,
    autoTable: any,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    const reportDate = options.dateRange?.start || new Date();
    const y = await drawLetterhead(doc, {
      title: 'Schichtzusammenfassung',
      subtitle: `Datum: ${reportDate.toLocaleDateString('de-DE')}`,
    });

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
      ...brandedTableOptions([2]),
    });

    drawFooters(doc);
    return doc.output('blob');
  }

  /**
   * Generiert einen Monatsbericht
   */
  private async generateMonthlyReport(
    doc: any,
    autoTable: any,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    const margin = PDF_MARGIN;
    const reportDate = options.dateRange?.start || new Date();
    const month = reportDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    let y = await drawLetterhead(doc, { title: 'Monatsbericht', subtitle: month });

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

    y = sectionTitle(doc, y, 'Kennzahlen');
    stats.forEach(([label, value]) => {
      y = kvLine(doc, y, label, value);
    });

    y += 6;
    
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
      ...brandedTableOptions([1, 2, 3]),
    });
    
    // Wenn mehr Einträge vorhanden sind, Hinweis hinzufügen
    if (tableData.length > maxEntriesPerPage) {
      const finalY = (doc as any).lastAutoTable?.finalY || y + (entriesToShow.length * 10) + 20;
      y = finalY + 10;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text(`Hinweis: Es werden nur die ersten ${maxEntriesPerPage} von ${tableData.length} Einträgen angezeigt.`, margin, y);
    }

    drawFooters(doc);
    return doc.output('blob');
  }

  /**
   * Generiert einen benutzerdefinierten Bericht
   */
  private async generateCustomReport(
    doc: any,
    autoTable: any,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    const margin = PDF_MARGIN;
    let y = await drawLetterhead(doc, { title: options.title || 'Benutzerdefinierter Bericht' });
    doc.setFontSize(10);

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
        } catch (_error) {
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

    drawFooters(doc);
    return doc.output('blob');
  }

  /**
   * Generiert einen professionellen Admin-Bericht (High-End-PDF) mit Firmenlogo.
   * Nutzt das vom Admin gepflegte Branding (Einstellungen).
   */
  private async generateAdminReport(
    doc: any,
    _autoTable: any,
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
    const companyName = data.branding?.companyName || 'Schichtklar';
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
    doc.text('Dieses Dokument wurde automatisch von Schichtklar erstellt.', margin, y);

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
    doc: any,
    autoTable: any,
    options: DocumentGenerationOptions
  ): Promise<Blob> {
    if (!options.assignmentNotificationData) {
      throw new Error('assignmentNotificationData ist erforderlich für Einsatzmitteilung');
    }

    const data = options.assignmentNotificationData;
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    const formatDate = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const creationDateStr = formatDate(data.assignmentCreationDate);
    const assignmentDateStr = formatDate(data.assignmentDate);

    // Oben rechts: Erstellungsdatum und Einsatzdatum (ordentlich)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const rightX = pageWidth - margin;
    doc.text(`Erstellt am: ${creationDateStr}`, rightX, y, { align: 'right' });
    y += 6;
    doc.text(`Einsatzdatum: ${assignmentDateStr}`, rightX, y, { align: 'right' });
    y += 14;

    // Titel links
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Einsatzmitteilung nach § 11 Absatz 2 Satz 4 AÜG', margin, y);
    y += 10;

    const companyName = data.branding?.companyName || 'AufAbruf GmbH';
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(companyName, margin, y);
    y += 8;

    // Status: EINSATZ ANGENOMMEN / EINSATZ ABGELEHNT (deutlich sichtbar)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(data.isDeclined ? 'EINSATZ ABGELEHNT' : 'EINSATZ ANGENOMMEN', margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setFont('helvetica', 'bold');
    doc.text('Mitarbeiter:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.employeeName, margin + 45, y);
    y += 10;

    // Hinweistext: Zeitarbeitnehmer für AufAbruf GmbH
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
    y = (doc as any).lastAutoTable.finalY + 10;

    // Zeiterfassungs- und Arbeitsschutz-Hinweise (bei Annahme nur diese; bei Ablehnung danach noch Ablehnungsblock)
    doc.setFontSize(10);
    const hintText1 = `Die Einsatzzeit wird über die App erfasst. Bitte lassen Sie die Zeiterfassung vom Berechtigten am Einsatzort in der App digital unterschreiben. Die erfassten Zeiten werden automatisch an die ${companyName} Zentrale übermittelt.`;
    const hintLines1 = doc.splitTextToSize(hintText1, 180);
    hintLines1.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });
    y += 4;
    const hintText2 = 'Bitte denken Sie an entsprechende Arbeitsschutzkleidung (Kasack, festes Schuhwerk) und achten die Hygienevorschriften sowie den zur Verfügung gestellten Hautschutzplan.';
    const hintLines2 = doc.splitTextToSize(hintText2, 180);
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
        180
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
        const reasonLines = doc.splitTextToSize(data.declineReason, 180);
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

    return doc.output('blob');
  }

  /**
   * Generiert ein PDF mit allen Signaturen für ein Assignment
   * Enthält: Employee Signature (bei Ablehnung), Relieving Personnel Signatures, Facility Signatures
   */
  private async generateAssignmentSignatures(
    doc: any,
    _autoTable: any,
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

    const margin = PDF_MARGIN;
    let y = await drawLetterhead(doc, {
      title: 'Zeiterfassung mit Unterschriften',
      subtitle: `Einsatz ${assignment.id}`,
    });

    y = sectionTitle(doc, y, 'Einsatzinformationen');
    if (employee) {
      y = kvLine(doc, y, 'Mitarbeiter/in', employee.displayName);
    }
    if (facility) {
      y = kvLine(doc, y, 'Einrichtung', facility.name);
    }
    if (shift) {
      const shiftDate = typeof shift.date === 'string' ? new Date(shift.date) : (shift.date as Date);
      y = kvLine(doc, y, 'Datum', shiftDate.toLocaleDateString('de-DE'));
      y = kvLine(doc, y, 'Zeiten', `${shift.startTime} – ${shift.endTime}`);
    }

    y += 6;

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

