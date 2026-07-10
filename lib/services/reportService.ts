import { 
  collection, 
  query, 
  getDocs, 
  orderBy
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

// Firestore document interfaces
interface TimesheetDoc {
  id: string;
  userId: string;
  userName?: string;
  startDate: string | Date;
  totalHours?: number;
  regularHours?: number;
  overtimeHours?: number;
  nightHours?: number;
  weekendHours?: number;
  holidayHours?: number;
  surchargeAmount?: number;
}

interface AssignmentDoc {
  id: string;
  assignedTo?: { id: string; displayName?: string };
  startDate: string | Date;
  status?: string;
}

interface ShiftDoc {
  id: string;
  facilityId: string;
  facilityName?: string;
  startDate: string | Date;
  status?: string;
}
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  facilityId?: string;
  userId?: string;
  status?: string;
}

export interface TimeAccountReport {
  userId: string;
  userName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  weekendHours: number;
  holidayHours: number;
  surchargeAmount: number;
}

export interface SurchargeReport {
  userId: string;
  userName: string;
  nightSurcharge: number;
  weekendSurcharge: number;
  holidaySurcharge: number;
  totalSurcharge: number;
  totalHours: number;
}

export interface EmployeeStatistics {
  userId: string;
  userName: string;
  totalShifts: number;
  totalHours: number;
  averageHoursPerShift: number;
  availabilityRate: number;
  lastActive: Date;
}

export interface ShiftUtilizationReport {
  facilityId: string;
  facilityName: string;
  totalShifts: number;
  filledShifts: number;
  utilizationRate: number;
  openShifts: number;
  cancelledShifts: number;
}

class ReportService {
  // Zeitkonten-Report generieren
  async generateTimeAccountReport(filters: ReportFilters = {}): Promise<TimeAccountReport[]> {
    try {
      // Timesheets abrufen
      const timesheetsQuery = query(
        collection(getDb(), 'timesheets'),
        orderBy('startDate', 'desc')
      );
      
      const timesheetsSnapshot = await getDocs(timesheetsQuery);
      const timesheets = timesheetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimesheetDoc[];

      // Nach Filtern filtern
      let filteredTimesheets = timesheets;
      
      if (filters.startDate) {
        filteredTimesheets = filteredTimesheets.filter(ts => 
          new Date(ts.startDate) >= filters.startDate!
        );
      }
      
      if (filters.endDate) {
        filteredTimesheets = filteredTimesheets.filter(ts => 
          new Date(ts.startDate) <= filters.endDate!
        );
      }
      
      if (filters.userId) {
        filteredTimesheets = filteredTimesheets.filter(ts => 
          ts.userId === filters.userId
        );
      }

      // Nach User gruppieren und aggregieren
      const userStats = new Map<string, TimeAccountReport>();

      filteredTimesheets.forEach(timesheet => {
        const userId = timesheet.userId;
        
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            userId,
            userName: timesheet.userName || 'Unbekannt',
            totalHours: 0,
            regularHours: 0,
            overtimeHours: 0,
            nightHours: 0,
            weekendHours: 0,
            holidayHours: 0,
            surchargeAmount: 0,
          });
        }

        const stats = userStats.get(userId)!;
        const hours = timesheet.totalHours || 0;
        
        stats.totalHours += hours;
        stats.regularHours += timesheet.regularHours || 0;
        stats.overtimeHours += timesheet.overtimeHours || 0;
        stats.nightHours += timesheet.nightHours || 0;
        stats.weekendHours += timesheet.weekendHours || 0;
        stats.holidayHours += timesheet.holidayHours || 0;
        stats.surchargeAmount += timesheet.surchargeAmount || 0;
      });

      return Array.from(userStats.values());
    } catch (_error) {
      throw new Error('Failed to generate time account report');
    }
  }

  // Zuschläge-Report generieren
  async generateSurchargeReport(filters: ReportFilters = {}): Promise<SurchargeReport[]> {
    try {
      const timeAccountReport = await this.generateTimeAccountReport(filters);
      
      return timeAccountReport.map(user => ({
        userId: user.userId,
        userName: user.userName,
        nightSurcharge: user.nightHours * 2.5, // Beispiel: 2.50€ pro Stunde
        weekendSurcharge: user.weekendHours * 1.5, // Beispiel: 1.50€ pro Stunde
        holidaySurcharge: user.holidayHours * 3.0, // Beispiel: 3.00€ pro Stunde
        totalSurcharge: user.surchargeAmount,
        totalHours: user.totalHours,
      }));
    } catch (_error) {
      throw new Error('Failed to generate surcharge report');
    }
  }

  // Mitarbeiter-Statistik generieren
  async generateEmployeeStatistics(filters: ReportFilters = {}): Promise<EmployeeStatistics[]> {
    try {
      // Assignments abrufen
      const assignmentsQuery = query(
        collection(getDb(), 'assignments'),
        orderBy('startDate', 'desc')
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignments = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AssignmentDoc[];

      // Nach Filtern filtern
      let filteredAssignments = assignments;
      
      if (filters.startDate) {
        filteredAssignments = filteredAssignments.filter(a => 
          new Date(a.startDate) >= filters.startDate!
        );
      }
      
      if (filters.endDate) {
        filteredAssignments = filteredAssignments.filter(a => 
          new Date(a.startDate) <= filters.endDate!
        );
      }
      
      if (filters.userId) {
        filteredAssignments = filteredAssignments.filter(a => 
          a.assignedTo?.id === filters.userId
        );
      }

      // Nach User gruppieren und aggregieren
      const userStats = new Map<string, EmployeeStatistics>();

      filteredAssignments.forEach(assignment => {
        const userId = assignment.assignedTo?.id;
        if (!userId) return;
        
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            userId,
            userName: assignment.assignedTo?.displayName || 'Unbekannt',
            totalShifts: 0,
            totalHours: 0,
            averageHoursPerShift: 0,
            availabilityRate: 0,
            lastActive: new Date(assignment.startDate),
          });
        }

        const stats = userStats.get(userId)!;
        stats.totalShifts++;
        
        // Stunden berechnen (Beispiel: 8 Stunden pro Schicht)
        const shiftHours = 8;
        stats.totalHours += shiftHours;
        stats.averageHoursPerShift = stats.totalHours / stats.totalShifts;
        
        // Verfügbarkeitsrate berechnen (vereinfacht)
        stats.availabilityRate = assignment.status === 'accepted' ? 100 : 0;
      });

      return Array.from(userStats.values());
    } catch (_error) {
      throw new Error('Failed to generate employee statistics');
    }
  }

  // Schicht-Auslastung generieren
  async generateShiftUtilizationReport(filters: ReportFilters = {}): Promise<ShiftUtilizationReport[]> {
    try {
      // Shifts abrufen
      const shiftsQuery = query(
        collection(getDb(), 'shifts'),
        orderBy('startDate', 'desc')
      );
      
      const shiftsSnapshot = await getDocs(shiftsQuery);
      const shifts = shiftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShiftDoc[];

      // Nach Filtern filtern
      let filteredShifts = shifts;
      
      if (filters.startDate) {
        filteredShifts = filteredShifts.filter(s => 
          new Date(s.startDate) >= filters.startDate!
        );
      }
      
      if (filters.endDate) {
        filteredShifts = filteredShifts.filter(s => 
          new Date(s.startDate) <= filters.endDate!
        );
      }
      
      if (filters.facilityId) {
        filteredShifts = filteredShifts.filter(s => 
          s.facilityId === filters.facilityId
        );
      }

      // Nach Facility gruppieren und aggregieren
      const facilityStats = new Map<string, ShiftUtilizationReport>();

      filteredShifts.forEach(shift => {
        const facilityId = shift.facilityId;
        
        if (!facilityStats.has(facilityId)) {
          facilityStats.set(facilityId, {
            facilityId,
            facilityName: shift.facilityName || 'Unbekannt',
            totalShifts: 0,
            filledShifts: 0,
            utilizationRate: 0,
            openShifts: 0,
            cancelledShifts: 0,
          });
        }

        const stats = facilityStats.get(facilityId)!;
        stats.totalShifts++;
        
        if (shift.status === 'filled') {
          stats.filledShifts++;
        } else if (shift.status === 'open') {
          stats.openShifts++;
        } else if (shift.status === 'cancelled') {
          stats.cancelledShifts++;
        }
        
        stats.utilizationRate = (stats.filledShifts / stats.totalShifts) * 100;
      });

      return Array.from(facilityStats.values());
    } catch (_error) {
      throw new Error('Failed to generate shift utilization report');
    }
  }

  // PDF-Export für Zeitkonten-Report
  async exportTimeAccountReportPDF(data: TimeAccountReport[], filename: string = 'zeitkonten-report.pdf'): Promise<void> {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Zeitkonten-Übersicht', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 14, 30);
    
    // Tabelle
    const tableData = data.map(item => [
      item.userName,
      item.totalHours.toFixed(1),
      item.regularHours.toFixed(1),
      item.overtimeHours.toFixed(1),
      item.nightHours.toFixed(1),
      item.weekendHours.toFixed(1),
      `€${item.surchargeAmount.toFixed(2)}`
    ]);

    (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
      head: [['Mitarbeiter', 'Gesamt', 'Regulär', 'Überstunden', 'Nacht', 'Wochenende', 'Zuschläge']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    doc.save(filename);
  }

  // Excel-Export für Zuschläge-Report
  async exportSurchargeReportExcel(data: SurchargeReport[], filename: string = 'zuschlaenge-report.xlsx'): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Zuschläge-Report');
    
    worksheet.columns = [
      { header: 'Mitarbeiter', key: 'Mitarbeiter', width: 25 },
      { header: 'Nachtzuschlag (€)', key: 'Nachtzuschlag', width: 18 },
      { header: 'Wochenendzuschlag (€)', key: 'Wochenendzuschlag', width: 20 },
      { header: 'Feiertagszuschlag (€)', key: 'Feiertagszuschlag', width: 20 },
      { header: 'Gesamtzuschlag (€)', key: 'Gesamtzuschlag', width: 18 },
      { header: 'Gesamtstunden', key: 'Gesamtstunden', width: 15 },
    ];
    
    worksheet.addRows(data.map(item => ({
      'Mitarbeiter': item.userName,
      'Nachtzuschlag': item.nightSurcharge.toFixed(2),
      'Wochenendzuschlag': item.weekendSurcharge.toFixed(2),
      'Feiertagszuschlag': item.holidaySurcharge.toFixed(2),
      'Gesamtzuschlag': item.totalSurcharge.toFixed(2),
      'Gesamtstunden': item.totalHours.toFixed(1)
    })));
    
    // Styling für Header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // PDF-Export für Mitarbeiter-Statistik
  async exportEmployeeStatisticsPDF(data: EmployeeStatistics[], filename: string = 'mitarbeiter-statistik.pdf'): Promise<void> {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Mitarbeiter-Statistik', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 14, 30);
    
    // Tabelle
    const tableData = data.map(item => [
      item.userName,
      item.totalShifts.toString(),
      item.totalHours.toFixed(1),
      item.averageHoursPerShift.toFixed(1),
      `${item.availabilityRate.toFixed(1)}%`,
      item.lastActive.toLocaleDateString('de-DE')
    ]);

    (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
      head: [['Mitarbeiter', 'Schichten', 'Gesamtstunden', 'Ø Stunden/Schicht', 'Verfügbarkeit', 'Letzte Aktivität']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    doc.save(filename);
  }

  // Excel-Export für Schicht-Auslastung
  async exportShiftUtilizationExcel(data: ShiftUtilizationReport[], filename: string = 'schicht-auslastung.xlsx'): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Schicht-Auslastung');
    
    worksheet.columns = [
      { header: 'Einrichtung', key: 'Einrichtung', width: 25 },
      { header: 'Gesamte Schichten', key: 'GesamteSchichten', width: 18 },
      { header: 'Besetzte Schichten', key: 'BesetzteSchichten', width: 18 },
      { header: 'Offene Schichten', key: 'OffeneSchichten', width: 18 },
      { header: 'Stornierte Schichten', key: 'StornierteSchichten', width: 20 },
      { header: 'Auslastung (%)', key: 'Auslastung', width: 15 },
    ];
    
    worksheet.addRows(data.map(item => ({
      'Einrichtung': item.facilityName,
      'GesamteSchichten': item.totalShifts,
      'BesetzteSchichten': item.filledShifts,
      'OffeneSchichten': item.openShifts,
      'StornierteSchichten': item.cancelledShifts,
      'Auslastung': item.utilizationRate.toFixed(1)
    })));
    
    // Styling für Header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Alle Berichte als PDF exportieren
  async exportAllReportsPDF(
    _timeAccountData: TimeAccountReport[],
    _surchargeData: SurchargeReport[],
    _employeeData: EmployeeStatistics[],
    _utilizationData: ShiftUtilizationReport[],
    filename: string = 'alle-berichte.pdf'
  ): Promise<void> {
    const doc = new jsPDF();
    
    // Zeitkonten-Report
    doc.setFontSize(20);
    doc.text('Zeitkonten-Übersicht', 14, 22);
    
    const timeTableData = _timeAccountData.map(item => [
      item.userName,
      item.totalHours.toFixed(1),
      item.regularHours.toFixed(1),
      item.overtimeHours.toFixed(1),
      `€${item.surchargeAmount.toFixed(2)}`
    ]);

    (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
      head: [['Mitarbeiter', 'Gesamt', 'Regulär', 'Überstunden', 'Zuschläge']],
      body: timeTableData,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Neue Seite für Zuschläge
    doc.addPage();
    doc.setFontSize(20);
    doc.text('Zuschläge-Report', 14, 22);
    
    const surchargeTableData = _surchargeData.map(item => [
      item.userName,
      `€${item.nightSurcharge.toFixed(2)}`,
      `€${item.weekendSurcharge.toFixed(2)}`,
      `€${item.holidaySurcharge.toFixed(2)}`,
      `€${item.totalSurcharge.toFixed(2)}`
    ]);

    (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
      head: [['Mitarbeiter', 'Nachtzuschlag', 'Wochenendzuschlag', 'Feiertagszuschlag', 'Gesamt']],
      body: surchargeTableData,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Neue Seite für Mitarbeiter-Statistik
    doc.addPage();
    doc.setFontSize(20);
    doc.text('Mitarbeiter-Statistik', 14, 22);
    
    const employeeTableData = _employeeData.map(item => [
      item.userName,
      item.totalShifts.toString(),
      item.totalHours.toFixed(1),
      item.averageHoursPerShift.toFixed(1),
      `${item.availabilityRate.toFixed(1)}%`
    ]);

    (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
      head: [['Mitarbeiter', 'Schichten', 'Gesamtstunden', 'Ø Stunden/Schicht', 'Verfügbarkeit']],
      body: employeeTableData,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Neue Seite für Schicht-Auslastung
    doc.addPage();
    doc.setFontSize(20);
    doc.text('Schicht-Auslastung', 14, 22);
    
    const utilizationTableData = _utilizationData.map(item => [
      item.facilityName,
      item.totalShifts.toString(),
      item.filledShifts.toString(),
      item.openShifts.toString(),
      `${item.utilizationRate.toFixed(1)}%`
    ]);

    (doc as unknown as { autoTable: (options: unknown) => void }).autoTable({
      head: [['Einrichtung', 'Gesamt', 'Besetzt', 'Offen', 'Auslastung']],
      body: utilizationTableData,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    doc.save(filename);
  }
}

export const reportService = new ReportService();
