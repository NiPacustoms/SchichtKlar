// Payroll-Regeln und Konfiguration
// Rechtskonforme Einstellungen für deutsche Lohnabrechnung 2025

import { z } from 'zod';

const calculationSteps = ['base', 'overtime', 'night', 'weekend', 'holiday'] as const;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const payrollRulesSchema = z
  .object({
    defaultHourlyRate: z.number().min(0, 'Default-Stundensatz muss ≥ 0 sein'),
    defaultMonthlyHours: z.number().int().min(1, 'Monatliche Stunden müssen ≥ 1 sein'),
    minimumWage: z.number().min(0, 'Mindestlohn muss ≥ 0 sein'),
    minijobLimit: z.number().min(0, 'Minijob-Grenze muss ≥ 0 sein'),
    midijobLimit: z.object({
      lower: z.number().min(0, 'Midijob-Untergrenze muss ≥ 0 sein'),
      upper: z.number().min(0, 'Midijob-Obergrenze muss ≥ 0 sein'),
    }),
    overtimeThreshold: z.object({
      daily: z.number().min(0, 'Überstunden-Tagesgrenze muss ≥ 0 sein'),
      weekly: z.number().min(0, 'Überstunden-Wochengrenze muss ≥ 0 sein'),
    }),
    overtimeMultiplier: z.number().min(1, 'Überstundenzuschlag muss ≥ 1 sein').max(5, 'Überstundenzuschlag zu hoch'),
    nightShiftStart: z.string().regex(timePattern, 'Nachtarbeitsbeginn muss HH:MM sein'),
    nightShiftEnd: z.string().regex(timePattern, 'Nachtarbeitsende muss HH:MM sein'),
    nightShiftSurchargePercent: z.number().min(0).max(100),
    weekendDays: z.array(z.number().int().min(0).max(6)).min(1),
    weekendSurchargePercent: z.number().min(0).max(100),
    holidaySurchargePercent: z.number().min(0).max(100),
    calculationOrder: z.array(z.enum(calculationSteps)).min(1),
    roundHoursTo: z.number().int().min(0).max(4),
    roundAmountsTo: z.number().int().min(0).max(4),
    socialInsuranceLimits: z.object({
      health: z.number().min(0),
      pension: z.number().min(0),
      unemployment: z.number().min(0),
      care: z.number().min(0),
    }),
    socialInsuranceRates: z.object({
      healthEmployee: z.number().min(0).max(0.2),
      healthEmployer: z.number().min(0).max(0.2),
      pensionEmployee: z.number().min(0).max(0.2),
      pensionEmployer: z.number().min(0).max(0.2),
      unemploymentEmployee: z.number().min(0).max(0.05),
      unemploymentEmployer: z.number().min(0).max(0.05),
      careEmployee: z.number().min(0).max(0.05),
      careEmployer: z.number().min(0).max(0.05),
      careEmployeeNoChildren: z.number().min(0).max(0.05),
    }),
    accidentInsuranceRate: z.number().min(0).max(0.1),
    insolvencyInsuranceRate: z.number().min(0).max(0.01),
    taxBasicAllowance: z.number().min(0),
    taxSolidarityRate: z.number().min(0).max(0.1),
    churchTaxRate: z.number().min(0).max(0.1),
  })
  .superRefine((rules, ctx) => {
    if (rules.defaultHourlyRate < rules.minimumWage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default-Stundensatz muss mindestens dem Mindestlohn entsprechen',
        path: ['defaultHourlyRate'],
      });
    }
    if (rules.minijobLimit >= rules.midijobLimit.lower) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Midijob-Untergrenze muss über der Minijob-Grenze liegen',
        path: ['midijobLimit', 'lower'],
      });
    }
    if (rules.midijobLimit.lower >= rules.midijobLimit.upper) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Midijob-Obergrenze muss über der Untergrenze liegen',
        path: ['midijobLimit', 'upper'],
      });
    }
    if (rules.overtimeThreshold.weekly < rules.overtimeThreshold.daily) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Wöchentliche Überstundengrenze muss ≥ täglicher Grenze sein',
        path: ['overtimeThreshold', 'weekly'],
      });
    }
    const uniqueOrder = new Set(rules.calculationOrder);
    if (uniqueOrder.size !== rules.calculationOrder.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Berechnungsreihenfolge darf keine Duplikate enthalten',
        path: ['calculationOrder'],
      });
    }
  });

export type PayrollRules = z.infer<typeof payrollRulesSchema>;

const defaultPayrollRulesConfig: PayrollRules = {
  defaultHourlyRate: 15.0,
  defaultMonthlyHours: 160,
  minimumWage: 12.82, // Mindestlohn 2025 (MiLoG §1)
  minijobLimit: 556, // Minijob-Grenze 2025 (bis 556€)
  midijobLimit: {
    lower: 556.01, // Midijob untere Grenze 2025 (KORRIGIERT: war 520.01, offiziell 556,01€)
    upper: 2000, // Midijob obere Grenze 2025
  },
  overtimeThreshold: {
    daily: 8,
    weekly: 40,
  },
  overtimeMultiplier: 1.25,
  nightShiftStart: '22:00',
  nightShiftEnd: '06:00',
  nightShiftSurchargePercent: 25,
  weekendDays: [6, 0], // Samstag, Sonntag
  weekendSurchargePercent: 20,
  holidaySurchargePercent: 35,
  calculationOrder: ['base', 'overtime', 'night', 'weekend', 'holiday'],
  roundHoursTo: 2,
  roundAmountsTo: 2,
  socialInsuranceLimits: {
    health: 5512.5, // KV/PV Bemessungsgrenze 2025 (korrigiert: war 4987.50)
    pension: 8050.0, // RV Bemessungsgrenze 2025 (korrigiert: war 7050)
    unemployment: 8050.0, // ALV Bemessungsgrenze 2025 (korrigiert: war 7050)
    care: 5512.5, // PV Bemessungsgrenze 2025 (korrigiert: war 4987.50)
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
  accidentInsuranceRate: 0.013, // 1,3% Durchschnitt (variabel)
  insolvencyInsuranceRate: 0.0006, // 0,06%
  taxBasicAllowance: 11908, // Grundfreibetrag 2025: 11.908€
  taxSolidarityRate: 0.055,
  churchTaxRate: 0.09,
};

export const defaultPayrollRules: PayrollRules = payrollRulesSchema.parse(defaultPayrollRulesConfig);

export function getPayrollRules(): PayrollRules {
  // TODO: Könnte aus Firestore oder Umgebungsvariablen geladen werden
  // Für jetzt: Validierte Default-Werte
  return defaultPayrollRules;
}

export function validatePayrollRules(
  rules: PayrollRules
): { valid: true; value: PayrollRules } | { valid: false; errors: string[] } {
  const result = payrollRulesSchema.safeParse(rules);
  if (result.success) {
    return { valid: true, value: result.data };
  }
  return { valid: false, errors: result.error.issues.map(issue => issue.message) };
}

export function validateHourlyRate(rate: number): { valid: boolean; error?: string } {
  const rules = getPayrollRules();
  if (rate < rules.minimumWage) {
    return {
      valid: false,
      error: `Stundensatz ${rate.toFixed(2)}€ unterschreitet Mindestlohn ${rules.minimumWage.toFixed(2)}€`,
    };
  }
  return { valid: true };
}

export function roundAmount(value: number): number {
  const rules = getPayrollRules();
  const factor = Math.pow(10, rules.roundAmountsTo);
  return Math.round(value * factor) / factor;
}

export function roundHours(value: number): number {
  const rules = getPayrollRules();
  const factor = Math.pow(10, rules.roundHoursTo);
  return Math.round(value * factor) / factor;
}

