// Cloud Function: Payroll-Berechnung für eine Periode
// Callable Function für manuelle Berechnung von Lohnabrechnungen

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { PayrollCalculationService } from './payrollCalculationService';
import { getPayrollRules } from '../config/payrollRules';

const db = admin.firestore();

interface CalculatePayrollRequest {
  periodId: string;
}

interface PayrollItem {
  id: string;
  periodId: string;
  userId: string;
  employeeName: string;
  facilityId?: string;
  baseSalary: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimeAmount: number;
  nightShiftHours: number;
  nightShiftRate: number;
  nightShiftAmount: number;
  weekendHours: number;
  weekendRate: number;
  weekendAmount: number;
  holidayHours: number;
  holidayRate: number;
  holidayAmount: number;
  bonuses: number;
  deductions: number;
  grossSalary: number;
  socialInsurance: number;
  healthInsurance: number;
  pensionInsurance: number;
  unemploymentInsurance: number;
  incomeTax: number;
  netSalary: number;
  // Arbeitgeber-Kosten / Lohnnebenkosten
  employerSocialInsurance: number;
  employerHealthInsurance: number;
  employerPensionInsurance: number;
  employerUnemploymentInsurance: number;
  employerCareInsurance: number;
  employerAccidentInsurance: number;
  employerInsolvencyInsurance: number;
  totalEmployerContributions: number;
  totalEmployerCost: number;
  details?: Record<string, unknown>;
  calcLog?: Array<{ step: string; value: number; timestamp: Date }>;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

/**
 * Callable Function: Berechnet Lohnabrechnung für eine Periode
 */
export const calculatePayroll = functions.https.onCall(
  async (data: CalculatePayrollRequest, context) => {
    // 1. Authentifizierung prüfen
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Benutzer muss authentifiziert sein'
      );
    }

    const userId = context.auth.uid;

    // 2. Rolle prüfen (admin oder disponent)
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Benutzer nicht gefunden');
    }

    const userData = userDoc.data();
    const role = userData?.role;
    if (role !== 'admin' && role !== 'dispatcher') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Nur Administratoren und Disponenten können Lohnabrechnungen berechnen'
      );
    }

    // 3. Input-Validierung
    if (!data.periodId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'periodId muss angegeben werden'
      );
    }

    try {
      // 4. Periode laden
      const periodDoc = await db.collection('payrollPeriods').doc(data.periodId).get();
      if (!periodDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Periode nicht gefunden');
      }

      const periodData = periodDoc.data();
      if (!periodData) {
        throw new functions.https.HttpsError('not-found', 'Periode-Daten nicht gefunden');
      }

      // 5. Status prüfen
      const status = periodData.status;
      if (status !== 'open' && status !== 'ready') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Periode hat Status '${status}' und kann nicht berechnet werden`
        );
      }

      // 6. Status auf 'calculating' setzen
      await periodDoc.ref.update({
        status: 'calculating',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const startDate = (periodData.startDate as admin.firestore.Timestamp).toDate();
      const endDate = (periodData.endDate as admin.firestore.Timestamp).toDate();

      // 7. Aktive Mitarbeiter laden
      const employeesSnapshot = await db
        .collection('users')
        .where('active', '==', true)
        .get();

      const employees = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (employees.length === 0) {
        await periodDoc.ref.update({
          status: 'open',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw new functions.https.HttpsError(
          'not-found',
          'Keine aktiven Mitarbeiter gefunden'
        );
      }

      // 8. PayrollSettings-Service importieren
      const { payrollSettingsService } = await import('../services/payrollSettings');
      const rules = getPayrollRules();

      // 9. Berechnung pro Mitarbeiter
      const payrollItems: PayrollItem[] = [];
      let totalGrossSalary = 0;
      let totalNetSalary = 0;
      let totalEmployerContributions = 0;
      let totalEmployerCost = 0;
      let totalEmployerHealthInsurance = 0;
      let totalEmployerPensionInsurance = 0;
      let totalEmployerUnemploymentInsurance = 0;
      let totalEmployerCareInsurance = 0;
      let totalAccidentInsurance = 0;
      let totalInsolvencyInsurance = 0;

      for (const employee of employees) {
        try {
          // 9.1 Timesheets laden (nur approved)
          const timesheetsSnapshot = await db
            .collection('timesheets')
            .where('userId', '==', employee.id)
            .where('status', '==', 'approved')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();

          const timesheets = timesheetsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Array<{
            id: string;
            totalHours?: number;
            overtimeHours?: number;
            nightHours?: number;
            weekendHours?: number;
            holidayHours?: number;
            [key: string]: any;
          }>;

          if (timesheets.length === 0) {
            console.log(`Keine approved Timesheets für Mitarbeiter ${employee.id}`);
            continue;
          }

          // 9.2 Timesheets aggregieren
          let totalHours = 0;
          let overtimeHours = 0;
          let nightShiftHours = 0;
          let weekendHours = 0;
          let holidayHours = 0;

          for (const ts of timesheets) {
            totalHours += Number(ts.totalHours || 0);
            overtimeHours += Number(ts.overtimeHours || 0);
            nightShiftHours += Number(ts.nightHours || 0);
            weekendHours += Number(ts.weekendHours || 0);
            holidayHours += Number(ts.holidayHours || 0);
          }

          // 9.3 PayrollSettings laden
          let payrollSettings: any = null;
          try {
            payrollSettings = await payrollSettingsService.getByUserId(employee.id);
          } catch (e) {
            console.warn(`PayrollSettings für ${employee.id} nicht gefunden, verwende Defaults`);
          }

          // 9.4 Lohnsätze bestimmen
          const employeeData = employee as any;
          const hourlyRate =
            payrollSettings?.paymentFrequency === 'stündlich'
              ? Number(payrollSettings.baseSalary || employeeData.hourlyRate || 0)
              : Number(employeeData.hourlyRate || 0);

          const baseSalary =
            payrollSettings?.paymentFrequency === 'monatlich'
              ? Number(payrollSettings.baseSalary || employeeData.baseSalary || 0)
              : Number(employeeData.baseSalary || 0);

          // Validierung: Mindestens einer der Lohnsätze muss gesetzt sein
          if (hourlyRate <= 0 && baseSalary <= 0) {
            console.warn(
              `Mitarbeiter ${employee.id} hat weder hourlyRate noch baseSalary - überspringe`
            );
            continue;
          }

          const effectiveHourlyRate =
            hourlyRate || baseSalary / rules.defaultMonthlyHours || rules.defaultHourlyRate;

          // 9.5 Basislohn berechnen
          const regularHours = Math.max(0, totalHours - overtimeHours - nightShiftHours - weekendHours - holidayHours);
          const baseSalaryAmount =
            payrollSettings?.paymentFrequency === 'monatlich'
              ? baseSalary
              : regularHours * effectiveHourlyRate;

          // 9.6 Überstunden berechnen
          const overtimeAmount = overtimeHours * effectiveHourlyRate * rules.overtimeMultiplier;

          // 9.7 Zuschläge berechnen
          const nightShiftAmount =
            nightShiftHours *
            effectiveHourlyRate *
            (1 + (payrollSettings?.nightShiftSurcharge || rules.nightShiftSurchargePercent) / 100);

          const weekendAmount =
            weekendHours *
            effectiveHourlyRate *
            (1 + (payrollSettings?.weekendSurcharge || rules.weekendSurchargePercent) / 100);

          const holidayAmount =
            holidayHours *
            effectiveHourlyRate *
            (1 + (payrollSettings?.holidaySurcharge || rules.holidaySurchargePercent) / 100);

          // 9.8 Brutto berechnen
          const grossSalary =
            baseSalaryAmount + overtimeAmount + nightShiftAmount + weekendAmount + holidayAmount;

          // 9.9 Steuern & Sozialversicherung berechnen
          const employeeCalcData = {
            id: employee.id,
            name: employeeData.displayName || employeeData.name || employeeData.email || employee.id,
            email: employeeData.email || '',
            grossSalary,
            hourlyRate: effectiveHourlyRate,
            workingHours: totalHours,
            taxClass: (payrollSettings?.taxClass || employeeData.taxClass || 1) as 1 | 2 | 3 | 4 | 5 | 6,
            churchTax: payrollSettings?.churchTax || employeeData.churchTax || false,
            children: payrollSettings?.childAllowance || employeeData.children || 0,
            healthInsurance: (payrollSettings?.healthInsurance || 'gesetzlich') as 'gesetzlich' | 'privat',
            healthInsuranceRate: payrollSettings?.healthInsuranceRate,
            pensionInsurance: payrollSettings?.pensionInsurance !== false,
            unemploymentInsurance: payrollSettings?.unemploymentInsurance !== false,
            careInsurance: payrollSettings?.careInsurance !== false,
          };

          const period = {
            year: periodData.year,
            month: periodData.month,
            daysInMonth: new Date(periodData.year, periodData.month, 0).getDate(),
            workingDays: 22, // Vereinfacht
          };

          const calculation = PayrollCalculationService.calculatePayroll(employeeCalcData, period);

          // 9.10 Lohnnebenkosten berechnen (AG-Anteile)
          const employerHealthInsurance = Math.min(
            grossSalary,
            rules.socialInsuranceLimits.health
          ) * rules.socialInsuranceRates.healthEmployer;

          const employerPensionInsurance = Math.min(
            grossSalary,
            rules.socialInsuranceLimits.pension
          ) * rules.socialInsuranceRates.pensionEmployer;

          const employerUnemploymentInsurance = Math.min(
            grossSalary,
            rules.socialInsuranceLimits.unemployment
          ) * rules.socialInsuranceRates.unemploymentEmployer;

          const employerCareInsurance = Math.min(
            grossSalary,
            rules.socialInsuranceLimits.care
          ) * rules.socialInsuranceRates.careEmployer;

          // Unfallversicherung (Berufsgenossenschaft, ~1,3% vom Brutto)
          const employerAccidentInsurance = grossSalary * rules.accidentInsuranceRate;

          // Insolvenzgeldumlage (0,06% vom Brutto)
          const employerInsolvencyInsurance = grossSalary * rules.insolvencyInsuranceRate;

          // Gesamt Lohnnebenkosten
          const totalEmployerContributionsForEmployee =
            employerHealthInsurance +
            employerPensionInsurance +
            employerUnemploymentInsurance +
            employerCareInsurance +
            employerAccidentInsurance +
            employerInsolvencyInsurance;

          // Gesamt AG-Kosten
          const totalEmployerCostForEmployee = grossSalary + totalEmployerContributionsForEmployee;

          // 9.11 PayrollItem erstellen
          const payrollItem: PayrollItem = {
            id: '',
            periodId: data.periodId,
            userId: employee.id,
            employeeName: employeeData.name,
            baseSalary: baseSalaryAmount,
            overtimeHours,
            overtimeRate: effectiveHourlyRate * rules.overtimeMultiplier,
            overtimeAmount,
            nightShiftHours,
            nightShiftRate: effectiveHourlyRate * (1 + (payrollSettings?.nightShiftSurcharge || rules.nightShiftSurchargePercent) / 100),
            nightShiftAmount,
            weekendHours,
            weekendRate: effectiveHourlyRate * (1 + (payrollSettings?.weekendSurcharge || rules.weekendSurchargePercent) / 100),
            weekendAmount,
            holidayHours,
            holidayRate: effectiveHourlyRate * (1 + (payrollSettings?.holidaySurcharge || rules.holidaySurchargePercent) / 100),
            holidayAmount,
            bonuses: 0,
            deductions: 0,
            grossSalary,
            socialInsurance: calculation.socialInsuranceTotal,
            healthInsurance: calculation.healthInsurance,
            pensionInsurance: calculation.pensionInsurance,
            unemploymentInsurance: calculation.unemploymentInsurance,
            incomeTax: calculation.incomeTax,
            netSalary: calculation.netSalary,
            employerSocialInsurance:
              employerHealthInsurance +
              employerPensionInsurance +
              employerUnemploymentInsurance +
              employerCareInsurance,
            employerHealthInsurance,
            employerPensionInsurance,
            employerUnemploymentInsurance,
            employerCareInsurance,
            employerAccidentInsurance,
            employerInsolvencyInsurance,
            totalEmployerContributions: totalEmployerContributionsForEmployee,
            totalEmployerCost: totalEmployerCostForEmployee,
            calcLog: [
              { step: 'Basislohn', value: baseSalaryAmount, timestamp: new Date() },
              { step: 'Überstunden', value: overtimeAmount, timestamp: new Date() },
              { step: 'Nachtzuschlag', value: nightShiftAmount, timestamp: new Date() },
              { step: 'Wochenendzuschlag', value: weekendAmount, timestamp: new Date() },
              { step: 'Feiertagszuschlag', value: holidayAmount, timestamp: new Date() },
              { step: 'Brutto', value: grossSalary, timestamp: new Date() },
              { step: 'Netto', value: calculation.netSalary, timestamp: new Date() },
            ],
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
          };

          // 9.12 PayrollItem in Firestore speichern
          const itemRef = await db.collection('payrollItems').add(payrollItem);
          payrollItem.id = itemRef.id;

          payrollItems.push(payrollItem);

          // 9.13 Totals aggregieren
          totalGrossSalary += grossSalary;
          totalNetSalary += calculation.netSalary;
          totalEmployerContributions += totalEmployerContributionsForEmployee;
          totalEmployerCost += totalEmployerCostForEmployee;
          totalEmployerHealthInsurance += employerHealthInsurance;
          totalEmployerPensionInsurance += employerPensionInsurance;
          totalEmployerUnemploymentInsurance += employerUnemploymentInsurance;
          totalEmployerCareInsurance += employerCareInsurance;
          totalAccidentInsurance += employerAccidentInsurance;
          totalInsolvencyInsurance += employerInsolvencyInsurance;
        } catch (error) {
          console.error(`Fehler bei Berechnung für Mitarbeiter ${employee.id}:`, error);
          // Weiter mit nächstem Mitarbeiter
        }
      }

      // 10. Status aktualisieren
      await periodDoc.ref.update({
        status: 'ready',
        calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        employeeCount: payrollItems.length,
        totalGrossSalary,
        totalNetSalary,
        totalEmployerCost,
        // Detaillierte Lohnnebenkosten-Totals
        totalEmployerContributions,
        totalEmployerHealthInsurance,
        totalEmployerPensionInsurance,
        totalEmployerUnemploymentInsurance,
        totalEmployerCareInsurance,
        totalAccidentInsurance,
        totalInsolvencyInsurance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 11. Audit-Log
      await db.collection('payrollAuditLogs').add({
        action: 'calculate_payroll',
        resourceType: 'payroll_period',
        resourceId: data.periodId,
        userId,
        userName: userData?.displayName || userData?.email || userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          employeeCount: payrollItems.length,
          totalGrossSalary,
          totalNetSalary,
          totalEmployerCost,
        },
      });

      return {
        success: true,
        periodId: data.periodId,
        employeeCount: payrollItems.length,
        totalGrossSalary,
        totalNetSalary,
        totalEmployerCost,
        message: `Lohnabrechnung für ${payrollItems.length} Mitarbeiter erfolgreich berechnet`,
      };
    } catch (error) {
      // Bei Fehler: Status zurück auf 'open'
      try {
        await db.collection('payrollPeriods').doc(data.periodId).update({
          status: 'open',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        console.error('Fehler beim Zurücksetzen des Status:', updateError);
      }

      // Fehler loggen
      console.error('Fehler bei Payroll-Berechnung:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        `Berechnung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      );
    }
  }
);

