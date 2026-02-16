// Payroll-Regeln für Cloud Functions (muss mit Frontend-Konfiguration synchron bleiben)

export interface PayrollRules {
  defaultHourlyRate: number;
  defaultMonthlyHours: number;
  minimumWage: number;
  minijobLimit: number;
  midijobLimit: {
    lower: number;
    upper: number;
  };
  overtimeThreshold: {
    daily: number;
    weekly: number;
  };
  overtimeMultiplier: number;
  nightShiftStart: string;
  nightShiftEnd: string;
  nightShiftSurchargePercent: number;
  weekendDays: number[];
  weekendSurchargePercent: number;
  holidaySurchargePercent: number;
  calculationOrder: Array<'base' | 'overtime' | 'night' | 'weekend' | 'holiday'>;
  roundHoursTo: number;
  roundAmountsTo: number;
  socialInsuranceLimits: {
    health: number;
    pension: number;
    unemployment: number;
    care: number;
  };
  socialInsuranceRates: {
    healthEmployee: number;
    healthEmployer: number;
    pensionEmployee: number;
    pensionEmployer: number;
    unemploymentEmployee: number;
    unemploymentEmployer: number;
    careEmployee: number;
    careEmployer: number;
    careEmployeeNoChildren: number;
  };
  accidentInsuranceRate: number;
  insolvencyInsuranceRate: number;
  taxBasicAllowance: number;
  taxSolidarityRate: number;
  churchTaxRate: number;
}

const DEFAULT_RULES: PayrollRules = Object.freeze({
  defaultHourlyRate: 15.0,
  defaultMonthlyHours: 160,
  minimumWage: 12.82,
  minijobLimit: 556,
  midijobLimit: {
    lower: 520.01,
    upper: 2000,
  },
  overtimeThreshold: {
    daily: 8,
    weekly: 40,
  },
  overtimeMultiplier: 1.25,
  nightShiftStart: '22:00',
  nightShiftEnd: '06:00',
  nightShiftSurchargePercent: 25,
  weekendDays: [6, 0],
  weekendSurchargePercent: 20,
  holidaySurchargePercent: 35,
  calculationOrder: ['base', 'overtime', 'night', 'weekend', 'holiday'] as Array<'base' | 'overtime' | 'night' | 'weekend' | 'holiday'>,
  roundHoursTo: 2,
  roundAmountsTo: 2,
  socialInsuranceLimits: {
    health: 4987.5,
    pension: 7050,
    unemployment: 7050,
    care: 4987.5,
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
    careEmployeeNoChildren: 0.0168,
  },
  accidentInsuranceRate: 0.013,
  insolvencyInsuranceRate: 0.0006,
  taxBasicAllowance: 11908,
  taxSolidarityRate: 0.055,
  churchTaxRate: 0.09,
});

export function getPayrollRules(): PayrollRules {
  return DEFAULT_RULES;
}

export function roundCurrency(value: number, decimals = DEFAULT_RULES.roundAmountsTo): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function validateHourlyRate(rate: number): { valid: boolean; error?: string } {
  const rules = getPayrollRules();
  if (Number.isNaN(rate) || !Number.isFinite(rate)) {
    return { valid: false, error: 'Stundensatz ist ungültig' };
  }
  if (rate < rules.minimumWage) {
    return {
      valid: false,
      error: `Stundensatz ${rate.toFixed(2)}€ unterschreitet Mindestlohn ${rules.minimumWage.toFixed(2)}€`,
    };
  }
  return { valid: true };
}


