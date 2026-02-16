// Sozialversicherungsberechnung nach deutschem Recht 2025
// Aktuelle Beitragssätze und Bemessungsgrenzen

// Mock types for now
interface SocialSecurityDeductions {
  healthInsurance: number;
  pensionInsurance: number;
  unemploymentInsurance: number;
  longTermCareInsurance: number;
  careInsurance: number;
  total: number;
}

interface EmployerContributions {
  healthInsurance: number;
  pensionInsurance: number;
  unemploymentInsurance: number;
  longTermCareInsurance: number;
  careInsurance: number;
  accidentInsurance: number;
  insolvencyInsurance: number;
  total: number;
}

export class SocialSecurityService {
  // Beitragssätze 2025 (korrigiert)
  private readonly rates = {
    healthInsurance: 0.146, // 14.6% (7,3% AN + 7,3% AG)
    healthInsuranceEmployee: 0.073, // 7.3% Arbeitnehmer
    additionalHealthInsurance: 0.017, // 1.7% Durchschnitt (Zusatzbeitrag KV)
    pensionInsurance: 0.186, // 18.6% (9,3% AN + 9,3% AG)
    pensionInsuranceEmployee: 0.093, // 9.3% Arbeitnehmer
    unemploymentInsurance: 0.024, // 2.4% (1,2% AN + 1,2% AG)
    unemploymentInsuranceEmployee: 0.012, // 1.2% Arbeitnehmer (KORRIGIERT: war 0.013)
    careInsurance: 0.0307, // 3.07% (1,535% AN + 1,535% AG)
    careInsuranceEmployee: 0.01535, // 1.535% Arbeitnehmer
    careInsuranceChildlessSupplement: 0.00145, // 0.145% Zuschlag kinderlos >23J (1,680% - 1,535%)
  };
  
  // Beitragsbemessungsgrenzen 2025 (KORRIGIERT - offizielle Werte)
  private readonly limits = {
    healthCareAnnual: 66150, // €66.150 jährlich (5.512,50 * 12)
    healthCareMonthly: 5512.50, // €5.512,50 monatlich (KORRIGIERT: war 4987.50, offiziell 5.512,50€)
    pensionAnnual: 96600, // €96.600 jährlich (8.050 * 12)
    pensionMonthly: 8050.00, // €8.050,00 monatlich (KORRIGIERT: war 7050, offiziell 8.050€)
    miniJobLimit: 556, // €556 monatlich (korrekt)
    midiJobLowerLimit: 556.01, // €556,01 monatlich (KORRIGIERT: war 520.01, offiziell 556,01€)
    midiJobUpperLimit: 2000, // €2.000 monatlich
  };
  
  /**
   * Berechnet Sozialversicherungsbeiträge
   */
  calculateSocialSecurity(
    grossSalary: number,
    employmentType: string,
    hasChildren: boolean,
    isOver23: boolean
  ): {
    employee: SocialSecurityDeductions;
    employer: EmployerContributions;
  } {
    // Handle negative or zero salary
    if (grossSalary <= 0) {
      return {
        employee: {
          healthInsurance: 0,
          pensionInsurance: 0,
          unemploymentInsurance: 0,
          longTermCareInsurance: 0,
          careInsurance: 0,
          total: 0,
        },
        employer: {
          healthInsurance: 0,
          pensionInsurance: 0,
          unemploymentInsurance: 0,
          longTermCareInsurance: 0,
          careInsurance: 0,
          accidentInsurance: 0,
          insolvencyInsurance: 0,
          total: 0,
        },
      };
    }

    // Minijob-Sonderregelung
    if (employmentType === 'minijob') {
      return this.calculateMiniJobContributions(grossSalary);
    }
    
    // Midijob-Gleitzone
    if (employmentType === 'midijob') {
      return this.calculateMidiJobContributions(grossSalary, hasChildren, isOver23);
    }
    
    // Reguläre SV-Berechnung
    const healthInsuranceBasis = Math.min(grossSalary, this.limits.healthCareMonthly);
    const pensionBasis = Math.min(grossSalary, this.limits.pensionMonthly);
    
    // Arbeitnehmer-Anteile
    const healthInsuranceEmployee = healthInsuranceBasis * this.rates.healthInsuranceEmployee;
    const additionalHealthInsurance = healthInsuranceBasis * this.rates.additionalHealthInsurance;
    const pensionEmployee = pensionBasis * this.rates.pensionInsuranceEmployee;
    const unemploymentEmployee = pensionBasis * this.rates.unemploymentInsuranceEmployee;
    
    let careEmployee = healthInsuranceBasis * this.rates.careInsuranceEmployee; // 1,535%
    if (!hasChildren && isOver23) {
      // Erhöhung auf 1,680% bei Kinderlosigkeit >23J
      careEmployee += healthInsuranceBasis * this.rates.careInsuranceChildlessSupplement; // +0,145%
    }
    
    // Arbeitgeber-Anteile
    const healthInsuranceEmployer = healthInsuranceBasis * this.rates.healthInsuranceEmployee;
    const pensionEmployer = pensionBasis * this.rates.pensionInsuranceEmployee;
    const unemploymentEmployer = pensionBasis * this.rates.unemploymentInsuranceEmployee;
    const careEmployer = healthInsuranceBasis * this.rates.careInsuranceEmployee;
    const accidentInsurance = grossSalary * 0.011; // ~1.1% (branchenabhängig, variabel je nach BG)
    const insolvencyInsurance = grossSalary * 0.0006; // 0.06% (KORRIGIERT: war 0.0009, EntgeltSiG)
    
    const employeeTotal = 
      healthInsuranceEmployee + 
      additionalHealthInsurance + 
      pensionEmployee + 
      unemploymentEmployee + 
      careEmployee;
    
    const employerTotal = 
      healthInsuranceEmployer + 
      pensionEmployer + 
      unemploymentEmployer + 
      careEmployer + 
      accidentInsurance + 
      insolvencyInsurance;
    
    return {
      employee: {
        healthInsurance: Math.round((healthInsuranceEmployee + additionalHealthInsurance) * 100) / 100,
        pensionInsurance: Math.round(pensionEmployee * 100) / 100,
        unemploymentInsurance: Math.round(unemploymentEmployee * 100) / 100,
        longTermCareInsurance: Math.round(careEmployee * 100) / 100,
        careInsurance: Math.round(careEmployee * 100) / 100,
        total: Math.round(employeeTotal * 100) / 100,
      },
      employer: {
        healthInsurance: Math.round(healthInsuranceEmployer * 100) / 100,
        pensionInsurance: Math.round(pensionEmployer * 100) / 100,
        unemploymentInsurance: Math.round(unemploymentEmployer * 100) / 100,
        longTermCareInsurance: Math.round(careEmployer * 100) / 100,
        careInsurance: Math.round(careEmployer * 100) / 100,
        accidentInsurance: Math.round(accidentInsurance * 100) / 100,
        insolvencyInsurance: Math.round(insolvencyInsurance * 100) / 100,
        total: Math.round(employerTotal * 100) / 100,
      },
    };
  }

  /**
   * Minijob-Sonderregelung (bis 538€)
   */
  private calculateMiniJobContributions(grossSalary: number): {
    employee: SocialSecurityDeductions;
    employer: EmployerContributions;
  } {
    // Minijob: Arbeitnehmer zahlt keine SV-Beiträge
    // Arbeitgeber zahlt pauschale Beiträge
    const employerHealthInsurance = grossSalary * 0.13; // 13% pauschal
    const employerPensionInsurance = grossSalary * 0.15; // 15% pauschal
    const employerUnemploymentInsurance = grossSalary * 0.03; // 3% pauschal
    const employerCareInsurance = grossSalary * 0.13; // 13% pauschal
    const accidentInsurance = grossSalary * 0.011; // 1.1% (variabel je nach BG)
    const insolvencyInsurance = grossSalary * 0.0006; // 0.06% (KORRIGIERT: war 0.0009, EntgeltSiG)

    const employerTotal = 
      employerHealthInsurance + 
      employerPensionInsurance + 
      employerUnemploymentInsurance + 
      employerCareInsurance + 
      accidentInsurance + 
      insolvencyInsurance;

    return {
      employee: {
        healthInsurance: 0,
        pensionInsurance: 0,
        unemploymentInsurance: 0,
        longTermCareInsurance: 0,
        careInsurance: 0,
        total: 0,
      },
      employer: {
        healthInsurance: Math.round(employerHealthInsurance * 100) / 100,
        pensionInsurance: Math.round(employerPensionInsurance * 100) / 100,
        unemploymentInsurance: Math.round(employerUnemploymentInsurance * 100) / 100,
        longTermCareInsurance: Math.round(employerCareInsurance * 100) / 100,
        careInsurance: Math.round(employerCareInsurance * 100) / 100,
        accidentInsurance: Math.round(accidentInsurance * 100) / 100,
        insolvencyInsurance: Math.round(insolvencyInsurance * 100) / 100,
        total: Math.round(employerTotal * 100) / 100,
      },
    };
  }

  /**
   * Midijob-Gleitzone (538€ - 2000€)
   */
  private calculateMidiJobContributions(
    grossSalary: number,
    hasChildren: boolean,
    isOver23: boolean
  ): {
    employee: SocialSecurityDeductions;
    employer: EmployerContributions;
  } {
    // Gleitzone-Faktor
    const f = 0.15; // Faktor für Gleitzone
    const reducedSalary = grossSalary * f;
    
    // Berechnung mit reduziertem Gehalt
    const healthInsuranceBasis = Math.min(reducedSalary, this.limits.healthCareMonthly);
    const pensionBasis = Math.min(reducedSalary, this.limits.pensionMonthly);
    
    // Arbeitnehmer-Anteile (reduziert)
    const healthInsuranceEmployee = healthInsuranceBasis * this.rates.healthInsuranceEmployee;
    const additionalHealthInsurance = healthInsuranceBasis * this.rates.additionalHealthInsurance;
    const pensionEmployee = pensionBasis * this.rates.pensionInsuranceEmployee;
    const unemploymentEmployee = pensionBasis * this.rates.unemploymentInsuranceEmployee;
    
    let careEmployee = healthInsuranceBasis * this.rates.careInsuranceEmployee; // 1,535%
    if (!hasChildren && isOver23) {
      // Erhöhung auf 1,680% bei Kinderlosigkeit >23J
      careEmployee += healthInsuranceBasis * this.rates.careInsuranceChildlessSupplement; // +0,145%
    }
    
    // Arbeitgeber-Anteile (reduziert)
    const healthInsuranceEmployer = healthInsuranceBasis * this.rates.healthInsuranceEmployee;
    const pensionEmployer = pensionBasis * this.rates.pensionInsuranceEmployee;
    const unemploymentEmployer = pensionBasis * this.rates.unemploymentInsuranceEmployee;
    const careEmployer = healthInsuranceBasis * this.rates.careInsuranceEmployee;
    const accidentInsurance = grossSalary * 0.011; // Unfallversicherung auf volles Gehalt (variabel je nach BG)
    const insolvencyInsurance = grossSalary * 0.0006; // 0.06% Insolvenzgeldumlage (KORRIGIERT: war 0.0009, EntgeltSiG)
    
    const employeeTotal = 
      healthInsuranceEmployee + 
      additionalHealthInsurance + 
      pensionEmployee + 
      unemploymentEmployee + 
      careEmployee;
    
    const employerTotal = 
      healthInsuranceEmployer + 
      pensionEmployer + 
      unemploymentEmployer + 
      careEmployer + 
      accidentInsurance + 
      insolvencyInsurance;

    return {
      employee: {
        healthInsurance: Math.round((healthInsuranceEmployee + additionalHealthInsurance) * 100) / 100,
        pensionInsurance: Math.round(pensionEmployee * 100) / 100,
        unemploymentInsurance: Math.round(unemploymentEmployee * 100) / 100,
        longTermCareInsurance: Math.round(careEmployee * 100) / 100,
        careInsurance: Math.round(careEmployee * 100) / 100,
        total: Math.round(employeeTotal * 100) / 100,
      },
      employer: {
        healthInsurance: Math.round(healthInsuranceEmployer * 100) / 100,
        pensionInsurance: Math.round(pensionEmployer * 100) / 100,
        unemploymentInsurance: Math.round(unemploymentEmployer * 100) / 100,
        longTermCareInsurance: Math.round(careEmployer * 100) / 100,
        careInsurance: Math.round(careEmployer * 100) / 100,
        accidentInsurance: Math.round(accidentInsurance * 100) / 100,
        insolvencyInsurance: Math.round(insolvencyInsurance * 100) / 100,
        total: Math.round(employerTotal * 100) / 100,
      },
    };
  }

  /**
   * Validiert Gehalt für Beschäftigungsart
   */
  validateSalaryForEmploymentType(
    grossSalary: number,
    employmentType: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (employmentType === 'minijob' && grossSalary > this.limits.miniJobLimit) {
      errors.push(`Minijob-Gehalt darf nicht über ${this.limits.miniJobLimit}€ liegen`);
    }

    if (employmentType === 'midijob' && 
        (grossSalary < this.limits.midiJobLowerLimit || grossSalary > this.limits.midiJobUpperLimit)) {
      errors.push(`Midijob-Gehalt muss zwischen ${this.limits.midiJobLowerLimit}€ und ${this.limits.midiJobUpperLimit}€ liegen`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Berechnet Gesamtkosten für Arbeitgeber
   */
  calculateTotalEmployerCost(
    grossSalary: number,
    socialSecurity: { employee: SocialSecurityDeductions; employer: EmployerContributions }
  ): number {
    return grossSalary + socialSecurity.employer.total;
  }

  /**
   * Berechnet Netto-Gehalt
   */
  calculateNetSalary(
    grossSalary: number,
    taxDeductions: number,
    socialSecurityDeductions: SocialSecurityDeductions
  ): number {
    const totalDeductions = taxDeductions + socialSecurityDeductions.total;
    return Math.round((grossSalary - totalDeductions) * 100) / 100;
  }
}
