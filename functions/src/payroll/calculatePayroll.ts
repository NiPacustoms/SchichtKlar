// Manuelle Payroll-Berechnung
// Cloud Function für manuelle Berechnung einer Payroll-Periode

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { TaxCalculationService } from './taxCalculationService';

const db = admin.firestore();

// Payroll-Regeln (2025) - Duplikat aus lib/config/payrollRules.ts
// TODO: Shared Package für gemeinsame Konfiguration
const PAYROLL_RULES = {
  defaultHourlyRate: 15.0,
  defaultMonthlyHours: 160,
  minimumWage: 12.82,
  overtimeThreshold: { daily: 8, weekly: 40 },
  overtimeMultiplier: 1.25,
  nightShiftSurchargePercent: 25,
  weekendSurchargePercent: 20,
  holidaySurchargePercent: 35,
  socialInsuranceLimits: {
    health: 5512.50,
    pension: 8050.00,
    unemployment: 8050.00,
    care: 5512.50,
  },
  socialInsuranceRates: {
    healthEmployee: 0.073,
    healthEmployer: 0.073,
    pensionEmployee: 0.093,
    pensionEmployer: 0.093,
    unemploymentEmployee: 0.012,
    unemploymentEmployer: 0.012,
    careEmployee: 0.01535,
    careEmployer: 0.01535,
  },
  accidentInsuranceRate: 0.013, // 1,3% Unfallversicherung (Berufsgenossenschaft)
  insolvencyInsuranceRate: 0.0006, // 0,06% Insolvenzgeldumlage (EntgeltSiG)
  taxBasicAllowance: 11908,
  taxSolidarityRate: 0.055,
  churchTaxRate: 0.09,
};

/**
 * Berechnet Lohnabrechnung für eine Periode
 * Callable Function für manuelle Berechnung
 */
export const calculatePayroll = functions.https.onCall(async (data, context) => {
  // Authentifizierung prüfen
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { periodId } = data;

  if (!periodId || typeof periodId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'periodId is required');
  }

  const startTime = Date.now();
  
  try {
    // Log: Berechnung gestartet
    console.log('INFO: Payroll-Berechnung gestartet', {
      periodId,
      userId: context.auth.uid,
      timestamp: new Date().toISOString(),
    });

    // Berechtigung prüfen (admin oder dispatcher)
    const user = await db.collection('users').doc(context.auth.uid).get();
    if (!user.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = user.data()!;
    const role = userData.role;
    if (role !== 'admin' && role !== 'dispatcher') {
      console.warn('WARN: Unauthorized payroll calculation attempt', {
        periodId,
        userId: context.auth.uid,
        role,
      });
      throw new functions.https.HttpsError(
        'permission-denied',
        'Nur Administratoren und Disponenten können Lohnabrechnungen berechnen'
      );
    }

    // Periode laden
    const periodDoc = await db.collection('payrollPeriods').doc(periodId).get();
    if (!periodDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payroll-Periode nicht gefunden');
    }

    const period = periodDoc.data()!;

    // Status prüfen
    if (period.status !== 'open' && period.status !== 'ready') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Periode hat Status '${period.status}' und kann nicht berechnet werden. Status muss 'open' oder 'ready' sein.`
      );
    }

    // Status auf 'calculating' setzen
    await periodDoc.ref.update({
      status: 'calculating',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const startDate = period.startDate?.toDate() || new Date(period.year, period.month - 1, 1);
    const endDate = period.endDate?.toDate() || new Date(period.year, period.month, 0);

    // Aktive Mitarbeiter laden
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
      throw new functions.https.HttpsError('not-found', 'Keine aktiven Mitarbeiter gefunden');
    }

    // PayrollSettings aus Firestore laden (falls vorhanden)
    const rules = PAYROLL_RULES;

    // Timesheets für Periode laden (NUR APPROVED!)
    const timesheetsSnapshot = await db
      .collection('timesheets')
      .where('status', '==', 'approved')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    // Timesheets nach Mitarbeiter gruppieren
    const timesheetsByUser: Record<string, any[]> = {};
    timesheetsSnapshot.docs.forEach(doc => {
      const ts = doc.data();
      const userId = ts.userId;
      if (!timesheetsByUser[userId]) {
        timesheetsByUser[userId] = [];
      }
      timesheetsByUser[userId].push(ts);
    });

    // Berechnung pro Mitarbeiter
    const payrollItems: any[] = [];
    let totalGrossSalary = 0;
    let totalNetSalary = 0;
    let totalEmployerContributions = 0;
    let totalEmployerCost = 0;
    let totalHealthInsurance = 0;
    let totalPensionInsurance = 0;
    let totalUnemploymentInsurance = 0;
    let totalCareInsurance = 0;
    let totalAccidentInsurance = 0;
    let totalInsolvencyInsurance = 0;

    for (const employee of employees) {
      try {
        const userTimesheets = timesheetsByUser[employee.id] || [];
        if (userTimesheets.length === 0) {
          console.log(`Keine approved Timesheets für Mitarbeiter ${employee.id}`);
          continue;
        }

        // Timesheets aggregieren
        const aggregated = userTimesheets.reduce(
          (acc, ts) => ({
            totalHours: acc.totalHours + (ts.totalHours || 0),
            overtimeHours: acc.overtimeHours + (ts.overtimeHours || 0),
            nightShiftHours: acc.nightShiftHours + (ts.nightHours || 0),
            weekendHours: acc.weekendHours + (ts.weekendHours || 0),
            holidayHours: acc.holidayHours + (ts.holidayHours || 0),
            bonuses: acc.bonuses + (ts.bonuses || 0),
            deductions: acc.deductions + (ts.deductions || 0),
          }),
          {
            totalHours: 0,
            overtimeHours: 0,
            nightShiftHours: 0,
            weekendHours: 0,
            holidayHours: 0,
            bonuses: 0,
            deductions: 0,
          }
        );

        // PayrollSettings aus Firestore laden (falls vorhanden)
        let payrollSettings: admin.firestore.DocumentData | null = null;
        try {
          const settingsDoc = await db.collection('payrollSettings').doc(employee.id).get();
          if (settingsDoc.exists) {
            payrollSettings = settingsDoc.data() || null;
          }
        } catch (e) {
          // Ignore errors, use defaults
        }

        const employeeData = employee as any;
        const settingsData = payrollSettings as any;

        // Lohnsätze bestimmen
        const hourlyRate =
          settingsData?.paymentFrequency === 'stündlich'
            ? settingsData.baseSalary || Number(employeeData.hourlyRate) || 0
            : Number(employeeData.hourlyRate) || 0;

        const baseSalary =
          settingsData?.paymentFrequency === 'monatlich'
            ? settingsData.baseSalary || Number(employeeData.baseSalary) || 0
            : Number(employeeData.baseSalary) || 0;

        if (hourlyRate <= 0 && baseSalary <= 0) {
          console.warn(`Mitarbeiter ${employee.id} hat keinen gültigen Lohnsatz`);
          continue;
        }

        // Mindestlohn prüfen
        const effectiveHourlyRate = hourlyRate || baseSalary / rules.defaultMonthlyHours;
        if (effectiveHourlyRate < rules.minimumWage) {
          throw new Error(
            `Mitarbeiter ${employeeData.name || employeeData.displayName || employeeData.email || employee.id}: Stundensatz ${effectiveHourlyRate.toFixed(2)}€ unterschreitet Mindestlohn ${rules.minimumWage.toFixed(2)}€`
          );
        }

        // Regular Hours berechnen
        const regularHours = Math.max(
          0,
          aggregated.totalHours -
            aggregated.overtimeHours -
            aggregated.nightShiftHours -
            aggregated.weekendHours -
            aggregated.holidayHours
        );

        // Base Salary berechnen
        const baseSalaryAmount =
          hourlyRate > 0
            ? roundAmount(regularHours * hourlyRate)
            : roundAmount(baseSalary);

        // Zuschlagsberechnungen
        const overtimeHourlyRate =
          hourlyRate > 0
            ? hourlyRate * rules.overtimeMultiplier
            : (baseSalary / rules.defaultMonthlyHours) * rules.overtimeMultiplier;
        const overtimeAmount = roundAmount(aggregated.overtimeHours * overtimeHourlyRate);

        const nightShiftHourlyRate =
          hourlyRate > 0
            ? hourlyRate * (1 + rules.nightShiftSurchargePercent / 100)
            : (baseSalary / rules.defaultMonthlyHours) * (1 + rules.nightShiftSurchargePercent / 100);
        const nightShiftAmount = roundAmount(aggregated.nightShiftHours * nightShiftHourlyRate);

        const weekendHourlyRate =
          hourlyRate > 0
            ? hourlyRate * (1 + rules.weekendSurchargePercent / 100)
            : (baseSalary / rules.defaultMonthlyHours) * (1 + rules.weekendSurchargePercent / 100);
        const weekendAmount = roundAmount(aggregated.weekendHours * weekendHourlyRate);

        const holidayHourlyRate =
          hourlyRate > 0
            ? hourlyRate * (1 + rules.holidaySurchargePercent / 100)
            : (baseSalary / rules.defaultMonthlyHours) * (1 + rules.holidaySurchargePercent / 100);
        const holidayAmount = roundAmount(aggregated.holidayHours * holidayHourlyRate);

        // Gross Salary berechnen
        const grossSalary = roundAmount(
          baseSalaryAmount +
            overtimeAmount +
            nightShiftAmount +
            weekendAmount +
            holidayAmount +
            aggregated.bonuses -
            aggregated.deductions
        );

        // Beitragsbemessungsgrenzen anwenden
        const cappedGross = {
          health: Math.min(grossSalary, rules.socialInsuranceLimits.health),
          pension: Math.min(grossSalary, rules.socialInsuranceLimits.pension),
          unemployment: Math.min(grossSalary, rules.socialInsuranceLimits.unemployment),
          care: Math.min(grossSalary, rules.socialInsuranceLimits.care),
        };

        // AN-Anteile Sozialversicherung
        const healthInsurance = roundAmount(cappedGross.health * rules.socialInsuranceRates.healthEmployee);
        const pensionInsurance = roundAmount(cappedGross.pension * rules.socialInsuranceRates.pensionEmployee);
        const unemploymentInsurance = roundAmount(
          cappedGross.unemployment * rules.socialInsuranceRates.unemploymentEmployee
        );
        const careInsurance = roundAmount(cappedGross.care * rules.socialInsuranceRates.careEmployee);
        const socialInsurance = roundAmount(
          healthInsurance + pensionInsurance + unemploymentInsurance + careInsurance
        );

        // Lohnsteuerberechnung mit BMF-Tabelle 2025 über TaxCalculationService
        // Steuerinformationen aus PayrollSettings laden
        const taxClass = (settingsData?.taxClass || 1) as 1 | 2 | 3 | 4 | 5 | 6;
        const childAllowance = settingsData?.childAllowance || 0;
        const churchTaxFlag = settingsData?.churchTax || false;
        const churchTaxState = settingsData?.churchTaxState || (employeeData as any).churchTaxState;
        
        // TaxCalculationService für BMF-konforme Berechnung verwenden
        const taxService = new TaxCalculationService();
        
        // Lohnsteuer berechnen
        const incomeTax = roundAmount(taxService.calculateIncomeTax(
          grossSalary,
          taxClass,
          childAllowance,
          true // isMonthly
        ));
        
        // Solidaritätszuschlag berechnen
        const annualGross = grossSalary * 12;
        const solidarityTax = roundAmount(taxService.calculateSolidarityTax(incomeTax, annualGross));
        
        // Kirchensteuer berechnen (nur wenn churchTaxFlag gesetzt ist)
        let churchTax = 0;
        if (churchTaxFlag && churchTaxState) {
          churchTax = roundAmount(taxService.calculateChurchTax(incomeTax, churchTaxState));
        } else if (churchTaxFlag && !churchTaxState) {
          // Fallback: Wenn Kirchensteuer aktiviert, aber kein Bundesland angegeben, verwende Standard 9%
          console.warn(`Kirchensteuer aktiviert für Mitarbeiter ${employee.id}, aber kein Bundesland angegeben. Verwende Standard 9%.`);
          churchTax = roundAmount(incomeTax * 0.09);
        }

        // Net Salary berechnen
        const netSalary = roundAmount(
          grossSalary -
            healthInsurance -
            pensionInsurance -
            unemploymentInsurance -
            careInsurance -
            incomeTax -
            solidarityTax -
            churchTax
        );

        // AG-Anteile Sozialversicherung (Lohnnebenkosten)
        const employerHealthInsurance = roundAmount(
          cappedGross.health * rules.socialInsuranceRates.healthEmployer
        );
        const employerPensionInsurance = roundAmount(
          cappedGross.pension * rules.socialInsuranceRates.pensionEmployer
        );
        const employerUnemploymentInsurance = roundAmount(
          cappedGross.unemployment * rules.socialInsuranceRates.unemploymentEmployer
        );
        const employerCareInsurance = roundAmount(
          cappedGross.care * rules.socialInsuranceRates.careEmployer
        );

        // Unfallversicherung (Berufsgenossenschaft)
        const employerAccidentInsurance = roundAmount(grossSalary * rules.accidentInsuranceRate);

        // Insolvenzgeldumlage (EntgeltSiG)
        const employerInsolvencyInsurance = roundAmount(grossSalary * rules.insolvencyInsuranceRate);

        // Gesamt Lohnnebenkosten
        const itemTotalEmployerContributions = roundAmount(
          employerHealthInsurance +
            employerPensionInsurance +
            employerUnemploymentInsurance +
            employerCareInsurance +
            employerAccidentInsurance +
            employerInsolvencyInsurance
        );

        // Gesamt AG-Kosten
        const itemTotalEmployerCost = roundAmount(grossSalary + itemTotalEmployerContributions);

        // PayrollItem erstellen
        const payrollItem = {
          periodId,
          userId: employee.id,
          employeeName: employeeData.name || employeeData.displayName || employeeData.email || employee.id,
          baseSalary: baseSalaryAmount,
          overtimeHours: roundHours(aggregated.overtimeHours),
          overtimeRate: overtimeHourlyRate,
          overtimeAmount,
          nightShiftHours: roundHours(aggregated.nightShiftHours),
          nightShiftRate: nightShiftHourlyRate,
          nightShiftAmount,
          weekendHours: roundHours(aggregated.weekendHours),
          weekendRate: weekendHourlyRate,
          weekendAmount,
          holidayHours: roundHours(aggregated.holidayHours),
          holidayRate: holidayHourlyRate,
          holidayAmount,
          bonuses: roundAmount(aggregated.bonuses),
          deductions: roundAmount(aggregated.deductions),
          grossSalary,
          socialInsurance,
          healthInsurance,
          pensionInsurance,
          unemploymentInsurance,
          incomeTax: incomeTax + solidarityTax + churchTax,
          netSalary,
          employerSocialInsurance: roundAmount(
            employerHealthInsurance +
              employerPensionInsurance +
              employerUnemploymentInsurance +
              employerCareInsurance
          ),
          employerHealthInsurance,
          employerPensionInsurance,
          employerUnemploymentInsurance,
          employerCareInsurance,
          employerAccidentInsurance,
          employerInsolvencyInsurance,
          totalEmployerContributions: itemTotalEmployerContributions,
          totalEmployerCost: itemTotalEmployerCost,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // PayrollItem in Firestore speichern
        await db.collection('payrollItems').add(payrollItem);

        payrollItems.push(payrollItem);

        // Totals aggregieren
        totalGrossSalary += grossSalary;
        totalNetSalary += netSalary;
        totalEmployerContributions += itemTotalEmployerContributions;
        totalEmployerCost += itemTotalEmployerCost;
        totalHealthInsurance += employerHealthInsurance;
        totalPensionInsurance += employerPensionInsurance;
        totalUnemploymentInsurance += employerUnemploymentInsurance;
        totalCareInsurance += employerCareInsurance;
        totalAccidentInsurance += employerAccidentInsurance;
        totalInsolvencyInsurance += employerInsolvencyInsurance;
      } catch (error) {
        console.error(`Fehler bei Berechnung für Mitarbeiter ${employee.id}:`, error);
        // Weiter mit nächstem Mitarbeiter
      }
    }

    // Periode-Status auf 'ready' setzen und Totals speichern
    await periodDoc.ref.update({
      status: 'ready',
      calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
      employeeCount: payrollItems.length,
      totalGrossSalary: roundAmount(totalGrossSalary),
      totalNetSalary: roundAmount(totalNetSalary),
      totalEmployerCost: roundAmount(totalEmployerCost),
      // Detaillierte Lohnnebenkosten-Totals (optional, für Admin-Dashboard)
      totalEmployerContributions: roundAmount(totalEmployerContributions),
      totalEmployerHealthInsurance: roundAmount(totalHealthInsurance),
      totalEmployerPensionInsurance: roundAmount(totalPensionInsurance),
      totalEmployerUnemploymentInsurance: roundAmount(totalUnemploymentInsurance),
      totalEmployerCareInsurance: roundAmount(totalCareInsurance),
      totalEmployerAccidentInsurance: roundAmount(totalAccidentInsurance),
      totalEmployerInsolvencyInsurance: roundAmount(totalInsolvencyInsurance),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const duration = Date.now() - startTime;

    // Log: Berechnung abgeschlossen
    console.log('INFO: Payroll-Berechnung abgeschlossen', {
      periodId,
      userId: context.auth.uid,
      employeeCount: payrollItems.length,
      duration: `${duration}ms`,
      totalGrossSalary: roundAmount(totalGrossSalary),
      totalEmployerCost: roundAmount(totalEmployerCost),
      timestamp: new Date().toISOString(),
    });

    // Audit-Log
    await db.collection('payrollAuditLogs').add({
      action: 'payroll_calculated',
      periodId,
      userId: context.auth.uid,
      employeeCount: payrollItems.length,
      totalGrossSalary: roundAmount(totalGrossSalary),
      totalNetSalary: roundAmount(totalNetSalary),
      totalEmployerCost: roundAmount(totalEmployerCost),
      duration,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      periodId,
      employeeCount: payrollItems.length,
      totalGrossSalary: roundAmount(totalGrossSalary),
      totalNetSalary: roundAmount(totalNetSalary),
      totalEmployerCost: roundAmount(totalEmployerCost),
      message: `Lohnabrechnung für ${payrollItems.length} Mitarbeiter erfolgreich berechnet`,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Log: Fehler
    console.error('ERROR: Fehler bei Payroll-Berechnung', {
      periodId,
      userId: context.auth?.uid || 'unknown',
      error: error.message || String(error),
      stack: error.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    // Status zurück auf 'open' setzen bei Fehler
    try {
      const periodDoc = await db.collection('payrollPeriods').doc(periodId).get();
      if (periodDoc.exists) {
        await periodDoc.ref.update({
          status: 'open',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (updateError) {
      console.error('ERROR: Fehler beim Zurücksetzen des Status:', updateError);
    }

    // Fehler in Audit-Log
    await db.collection('payrollAuditLogs').add({
      action: 'payroll_calculation_error',
      periodId,
      userId: context.auth?.uid || 'unknown',
      error: error.message || String(error),
      duration,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Fehler bei der Payroll-Berechnung'
    );
  }
});

// Helper-Funktionen
function roundAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

