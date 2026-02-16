// Automatische monatliche Lohnabrechnung
// Cloud Function für automatische Berechnung aller Mitarbeiter

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { PayrollCalculationService, EmployeeData, PayrollPeriod } from './payrollCalculationService';
import { PayrollPDFService } from './payrollPDFService';
import { DATEVExportService } from './datevExportService';

const db = admin.firestore();

/**
 * Automatische monatliche Lohnabrechnung
 * Läuft jeden 1. des Monats um 2 Uhr morgens
 */
export const calculateMonthlyPayroll = functions.pubsub
  .schedule('0 2 1 * *') // Jeden 1. des Monats um 2 Uhr
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    
    try {
      // Berechnet automatisch Gehälter für vorherigen Monat
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = lastMonth.getFullYear();
      const month = lastMonth.getMonth() + 1;
      
      
      // Alle aktiven Mitarbeiter laden
      const employees = await getActiveEmployees();
      
      const pdfService = PayrollPDFService;
      
      const calculations: any[] = [];
      const employeesData: any[] = [];
      
      // Für jeden Mitarbeiter Lohnabrechnung berechnen
      for (const employee of employees) {
        try {
          // Mitarbeiterdaten für Berechnung vorbereiten
          const employeeData: EmployeeData = {
            id: employee.id,
            name: employee.name || 'Unbekannt',
            email: employee.email || '',
            grossSalary: employee.grossSalary || 0,
            hourlyRate: employee.hourlyRate,
            workingHours: employee.workingHours,
            taxClass: employee.taxClass || 1,
            churchTax: employee.churchTax || false,
            children: employee.children || 0,
            healthInsurance: employee.healthInsurance || 'gesetzlich',
            healthInsuranceRate: employee.healthInsuranceRate,
            pensionInsurance: employee.pensionInsurance !== false,
            unemploymentInsurance: employee.unemploymentInsurance !== false,
            careInsurance: employee.careInsurance !== false,
          };

          const period: PayrollPeriod = {
            year,
            month,
            daysInMonth: new Date(year, month, 0).getDate(),
            workingDays: 22, // Vereinfacht: 22 Arbeitstage
          };
          
          const calculation = PayrollCalculationService.calculatePayroll(employeeData, period);
          
          // Berechnung in Firestore speichern
          const calculationRef = db.collection('payrollCalculations').doc();
          await calculationRef.set({
            ...calculation,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          calculations.push(calculation);
          employeesData.push(employee);
          
          
        } catch (error) {
          console.error(`Error calculating payroll for employee ${employee.id}:`, error);
          
          // Fehler in Audit-Log protokollieren
          await logAuditEvent({
            action: 'payroll_calculation_error',
            employeeId: employee.id,
            error: (error as Error).message,
            timestamp: new Date(),
          });
        }
      }
      
      // PDFs für alle Mitarbeiter generieren
      if (calculations.length > 0) {
        
        const company = await getCompanyData();
        const pdfUrls = await pdfService.generateBatchPayslips(
          calculations as any,
          employeesData as any,
          company as any
        );

        for (let i = 0; i < calculations.length; i++) {
          const calculation = calculations[i] as any;
          const pdfUrl = pdfUrls[i];
          if (!pdfUrl) continue;
          await db.collection('payrollCalculations').doc(calculation.id).update({
            pdfUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
      
      // DATEV-Export generieren
      if (calculations.length > 0) {
        
        const company = await getCompanyData();
        const datevUrl = await DATEVExportService.exportToDATEV({
          calculations: calculations as any,
          employees: employeesData as any,
          company: {
            name: company.name || 'JobFlow GmbH',
            taxId: company.taxId || '',
            socialSecurityNumber: company.socialSecurityNumber || '',
          },
          period: { year, month },
        });
        
        // Abrechnungsperiode erstellen/aktualisieren
        const periodId = `${year}-${String(month).padStart(2, '0')}`;
        await db.collection('payrollPeriods').doc(periodId).set({
          id: periodId,
          year,
          month,
          startDate: new Date(year, month - 1, 1),
          endDate: new Date(year, month, 0),
          status: 'ready',
          calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
          employeeCount: calculations.length,
          totalGrossSalary: calculations.reduce((sum, calc) => sum + calc.grossSalary, 0),
          totalNetSalary: calculations.reduce((sum, calc) => sum + calc.netSalary, 0),
          totalEmployerCost: calculations.reduce((sum, calc) => sum + calc.totalEmployerCost, 0),
          datevExportUrl: datevUrl,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      
      // Erfolgreiche Berechnung protokollieren
      await logAuditEvent({
        action: 'monthly_payroll_calculation_completed',
        year,
        month,
        employeeCount: calculations.length,
        totalGrossSalary: calculations.reduce((sum, calc) => sum + calc.grossSalary, 0),
        timestamp: new Date(),
      });
      
      
      return {
        success: true,
        year,
        month,
        employeeCount: calculations.length,
        message: `Lohnabrechnung für ${calculations.length} Mitarbeiter erfolgreich berechnet`,
      };
      
    } catch (error) {
      console.error('Error in monthly payroll calculation:', error);
      
      // Fehler in Audit-Log protokollieren
      await logAuditEvent({
        action: 'monthly_payroll_calculation_error',
        error: (error as Error).message,
        timestamp: new Date(),
      });
      
      throw new functions.https.HttpsError(
        'internal',
        'Fehler bei der automatischen Lohnabrechnung'
      );
    }
  });

/**
 * Lädt alle aktiven Mitarbeiter
 */
async function getActiveEmployees(): Promise<any[]> {
  const employeesSnapshot = await db
    .collection('users')
    .where('active', '==', true)
    .where('role', '==', 'nurse')
    .get();
  
  return employeesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Lädt Firmendaten
 */
async function getCompanyData(): Promise<any> {
  const companyDoc = await db.collection('systemSettings').doc('main').get();
  
  if (companyDoc.exists) {
    return companyDoc.data();
  }
  
  // Fallback-Daten
  return {
    name: 'JobFlow GmbH',
    address: 'Musterstraße 123, 12345 Musterstadt',
    phone: '+49 123 456789',
    email: 'info@jobflow.de',
    datevClientNumber: '',
    datevConsultantNumber: '',
  };
}

/**
 * Lädt PDF in Firebase Storage hoch
 */
// Entfernt: Upload erfolgt direkt in Services, nicht mehr lokal

/**
 * Lädt DATEV-Export in Firebase Storage hoch
 */
// Entfernt: Export/Upload wird vollständig vom DATEV-Service übernommen

/**
 * Protokolliert Audit-Events
 */
async function logAuditEvent(event: any): Promise<void> {
  await db.collection('payrollAuditLogs').add({
    ...event,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}
