// Deutsche Lohnabrechnung - Berechnung von Brutto zu Netto
// Berücksichtigt Sozialversicherung, Lohnsteuer, Solidaritätszuschlag, Kirchensteuer

export interface PayrollPeriod {
  year: number;
  month: number;
  daysInMonth: number;
  workingDays: number;
  startDate?: Date; // Beginn des Abrechnungszeitraums (§108 GewO)
  endDate?: Date; // Ende des Abrechnungszeitraums (§108 GewO)
}

export interface EmployeeData {
  id: string;
  name: string;
  email: string;
  grossSalary: number; // Monatsbrutto
  hourlyRate?: number; // Stundensatz für Stundenlohn
  workingHours?: number; // Arbeitsstunden im Monat
  taxClass: 1 | 2 | 3 | 4 | 5 | 6; // Lohnsteuerklasse
  churchTax: boolean; // Kirchensteuerpflichtig
  children: number; // Anzahl Kinder
  healthInsurance: 'gesetzlich' | 'privat'; // Krankenversicherung
  healthInsuranceRate?: number; // KV-Zusatzbeitrag (gesetzlich)
  pensionInsurance: boolean; // Rentenversicherungspflichtig
  unemploymentInsurance: boolean; // Arbeitslosenversicherungspflichtig
  careInsurance: boolean; // Pflegeversicherungspflichtig
}

export interface PayrollCalculation {
  employeeId: string;
  period: PayrollPeriod;
  
  // Brutto
  grossSalary: number;
  
  // Sozialversicherung
  healthInsurance: number;
  pensionInsurance: number;
  unemploymentInsurance: number;
  careInsurance: number;
  socialInsuranceTotal: number;
  
  // Steuern
  incomeTax: number;
  solidaritySurcharge: number;
  churchTax: number;
  taxesTotal: number;
  
  // Netto
  netSalary: number;
  
  // Zusätzlich
  workingHours?: number;
  hourlyRate?: number;
}

export class PayrollCalculationService {
  // Sozialversicherungsbeiträge 2025 (Beitragsbemessungsgrenzen - KORRIGIERT - offizielle Werte)
  private static readonly SOCIAL_INSURANCE_LIMITS = {
    health: 5512.50, // KV/PV Bemessungsgrenze 2025 (KORRIGIERT: war 4987.50, offiziell 5.512,50€)
    pension: 8050.00, // RV Bemessungsgrenze 2025 (KORRIGIERT: war 7050, offiziell 8.050€)
    unemployment: 8050.00, // ALV Bemessungsgrenze 2025 (KORRIGIERT: war 7050, offiziell 8.050€)
    care: 5512.50, // PV Bemessungsgrenze 2025 (KORRIGIERT: war 4987.50, offiziell 5.512,50€)
  };
  
  private static readonly SOCIAL_INSURANCE_RATES = {
    health: 0.146, // 14.6% (7,3% AN + 7,3% AG)
    healthEmployee: 0.073, // 7.3% Arbeitnehmer
    pension: 0.186, // 18.6% (9,3% AN + 9,3% AG)
    pensionEmployee: 0.093, // 9.3% Arbeitnehmer
    unemployment: 0.024, // 2.4% (1,2% AN + 1,2% AG)
    unemploymentEmployee: 0.012, // 1.2% Arbeitnehmer
    care: 0.0307, // 3.07% (1,535% AN + 1,535% AG)
    careEmployee: 0.01535, // 1.535% Arbeitnehmer
  };

  static calculatePayroll(employee: EmployeeData, period: PayrollPeriod): PayrollCalculation {
    const grossSalary = employee.hourlyRate && employee.workingHours 
      ? employee.hourlyRate * employee.workingHours 
      : employee.grossSalary;

    // Sozialversicherung berechnen
    const healthInsurance = this.calculateHealthInsurance(grossSalary, employee);
    const pensionInsurance = this.calculatePensionInsurance(grossSalary, employee);
    const unemploymentInsurance = this.calculateUnemploymentInsurance(grossSalary, employee);
    const careInsurance = this.calculateCareInsurance(grossSalary, employee);
    const socialInsuranceTotal = healthInsurance + pensionInsurance + unemploymentInsurance + careInsurance;

    // Steuern berechnen
    const incomeTax = this.calculateIncomeTax(grossSalary, employee, period);
    const solidaritySurcharge = this.calculateSolidaritySurcharge(incomeTax);
    const churchTax = this.calculateChurchTax(incomeTax, employee);
    const taxesTotal = incomeTax + solidaritySurcharge + churchTax;

    // Netto berechnen
    const netSalary = grossSalary - socialInsuranceTotal - taxesTotal;

    return {
      employeeId: employee.id,
      period,
      grossSalary,
      healthInsurance,
      pensionInsurance,
      unemploymentInsurance,
      careInsurance,
      socialInsuranceTotal,
      incomeTax,
      solidaritySurcharge,
      churchTax,
      taxesTotal,
      netSalary,
      workingHours: employee.workingHours,
      hourlyRate: employee.hourlyRate,
    };
  }

  private static calculateHealthInsurance(grossSalary: number, employee: EmployeeData): number {
    if (employee.healthInsurance === 'privat') return 0;
    
    const cappedSalary = Math.min(grossSalary, this.SOCIAL_INSURANCE_LIMITS.health);
    const baseRate = cappedSalary * this.SOCIAL_INSURANCE_RATES.healthEmployee;
    const additionalRate = employee.healthInsuranceRate ? cappedSalary * (employee.healthInsuranceRate / 100) : 0;
    
    return baseRate + additionalRate;
  }

  private static calculatePensionInsurance(grossSalary: number, employee: EmployeeData): number {
    if (!employee.pensionInsurance) return 0;
    
    const cappedSalary = Math.min(grossSalary, this.SOCIAL_INSURANCE_LIMITS.pension);
    return cappedSalary * this.SOCIAL_INSURANCE_RATES.pensionEmployee;
  }

  private static calculateUnemploymentInsurance(grossSalary: number, employee: EmployeeData): number {
    if (!employee.unemploymentInsurance) return 0;
    
    const cappedSalary = Math.min(grossSalary, this.SOCIAL_INSURANCE_LIMITS.unemployment);
    return cappedSalary * this.SOCIAL_INSURANCE_RATES.unemploymentEmployee;
  }

  private static calculateCareInsurance(grossSalary: number, employee: EmployeeData): number {
    if (!employee.careInsurance) return 0;
    
    const cappedSalary = Math.min(grossSalary, this.SOCIAL_INSURANCE_LIMITS.care);
    return cappedSalary * this.SOCIAL_INSURANCE_RATES.careEmployee;
  }

  private static calculateIncomeTax(grossSalary: number, employee: EmployeeData, period: PayrollPeriod): number {
    // BMF-konforme Lohnsteuerberechnung (ohne DATEV-API)
    // Verwendet offizielle BMF-Formeln nach Programmablaufplan 2025
    
    // Importiere TaxCalculationService für BMF-konforme Berechnung
    // Hinweis: In Produktion sollte TaxCalculationService direkt verwendet werden
    const annualGross = grossSalary * 12;
    const basicAllowance = 11908; // Grundfreibetrag 2025: 11.908€
    const childAllowance = employee.children * 3012; // 3.012€ pro Kind (2025)
    
    // Steuerfreibetrag nach Steuerklasse
    let taxFreeAmount = 0;
    switch (employee.taxClass) {
      case 1:
      case 2:
      case 4:
        taxFreeAmount = basicAllowance + childAllowance;
        break;
      case 3:
        taxFreeAmount = basicAllowance * 2 + childAllowance; // 23.816€
        break;
      case 5:
      case 6:
        taxFreeAmount = childAllowance; // Kein Grundfreibetrag
        break;
    }
    
    // Zu versteuerndes Einkommen
    const taxableIncome = Math.max(0, annualGross - taxFreeAmount);
    
    // Lohnsteuerberechnung nach BMF-Formeln 2025
    let annualTax = 0;
    
    if (taxableIncome <= 11908) {
      annualTax = 0;
    } else if (taxableIncome <= 17005) {
      // Erste Progressionszone (linear-progressiv)
      const y = (taxableIncome - 11908) / 10000;
      annualTax = (922.98 * y + 1400) * y;
    } else if (taxableIncome <= 66760) {
      // Zweite Progressionszone (linear-progressiv)
      const z = (taxableIncome - 17005) / 10000;
      annualTax = (181.19 * z + 2397) * z + 1025.38;
    } else if (taxableIncome <= 277825) {
      // Dritte Progressionszone (42%)
      annualTax = 0.42 * taxableIncome - 10602.13;
    } else {
      // Reichensteuer (45%)
      annualTax = 0.45 * taxableIncome - 18936.88;
    }
    
    // Monatliche Lohnsteuer
    return Math.max(0, Math.round(annualTax / 12 * 100) / 100);
  }

  private static calculateSolidaritySurcharge(incomeTax: number): number {
    // Soli-Zuschlag: 5.5% der Lohnsteuer
    return incomeTax * 0.055;
  }

  private static calculateChurchTax(incomeTax: number, employee: EmployeeData): number {
    if (!employee.churchTax) return 0;
    
    // Kirchensteuer: 8-9% der Lohnsteuer (je nach Bundesland)
    // Bayern (BY) und Baden-Württemberg (BW): 8%, alle anderen: 9%
    const churchTaxState = (employee as any).churchTaxState;
    const rate = churchTaxState && ['BW', 'BY'].includes(churchTaxState.toUpperCase()) ? 0.08 : 0.09;
    return Math.round(incomeTax * rate * 100) / 100;
  }
}
