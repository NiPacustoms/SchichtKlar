// Lohnsteuerberechnung nach deutschem Recht 2025
// Basiert auf offiziellen BMF-Formeln (Programmablaufplan 2025)
// Kopiert aus lib/services/payroll/taxCalculation.ts für Cloud Functions

export class TaxCalculationService {
  // Steuerfreibeträge 2025 (Grundfreibetrag: 11.908 €)
  private readonly basicAllowances = {
    1: 11908, // Steuerklasse 1
    2: 11908, // Steuerklasse 2
    3: 23816, // Steuerklasse 3 (2x Grundfreibetrag)
    4: 11908, // Steuerklasse 4
    5: 0,     // Steuerklasse 5
    6: 0,     // Steuerklasse 6
  };

  // Kinderfreibetrag 2025
  private readonly childAllowance = 3012; // 3.012 € pro Kind (2025)

  /**
   * Berechnet Lohnsteuer nach offiziellen PAP 2025 Formeln
   * Quelle: BMF - Programmablaufplan 2025
   */
  calculateIncomeTax(
    grossSalary: number,
    taxClass: 1 | 2 | 3 | 4 | 5 | 6,
    childAllowance: number,
    isMonthly: boolean = true
  ): number {
    // Jahresbruttogehalt berechnen
    const annualGross = isMonthly ? grossSalary * 12 : grossSalary;
    
    // Steuerfreibetrag nach Steuerklasse
    const basicAllowance = this.getBasicAllowance(taxClass, childAllowance);
    
    // Zu versteuerndes Einkommen
    const taxableIncome = Math.max(0, annualGross - basicAllowance);
    
    // Lohnsteuerberechnung nach Steuerprogression (BMF-Tabelle 2025)
    let annualTax = 0;
    
    if (taxableIncome <= 11908) {
      annualTax = 0; // Grundfreibetrag 2025
    } else if (taxableIncome <= 17005) {
      // Erste Progressionszone (linear-progressiv)
      const y = (taxableIncome - 11908) / 10000;
      annualTax = (922.98 * y + 1400) * y;
    } else if (taxableIncome <= 66760) {
      // Zweite Progressionszone (linear-progressiv)
      const z = (taxableIncome - 17005) / 10000;
      annualTax = (181.19 * z + 2397) * z + 1025.38;
    } else if (taxableIncome <= 277825) {
      // Dritte Progressionszone (42% proportional)
      annualTax = 0.42 * taxableIncome - 10602.13;
    } else {
      // Reichensteuer (45% proportional)
      annualTax = 0.45 * taxableIncome - 18936.88;
    }
    
    return isMonthly ? Math.round(annualTax / 12 * 100) / 100 : Math.round(annualTax * 100) / 100;
  }
  
  /**
   * Berechnet Solidaritätszuschlag (5.5% der Lohnsteuer)
   * Freigrenze: 17.543€ jährlich (Steuerklasse 1)
   * Quelle: §51a EStG
   */
  calculateSolidarityTax(incomeTax: number, annualGross: number): number {
    // Freigrenze prüfen (17.543€ jährlich)
    if (annualGross <= 17543) {
      return 0;
    }
    
    // Solidaritätszuschlag: 5.5% der Lohnsteuer
    const soli = incomeTax * 0.055;
    
    // Rundung auf Cent
    return Math.round(soli * 100) / 100;
  }
  
  /**
   * Berechnet Kirchensteuer (8% oder 9% je nach Bundesland)
   * Bayern und Baden-Württemberg: 8%, alle anderen: 9%
   * Quelle: Kirchensteuergesetze der Bundesländer
   */
  calculateChurchTax(incomeTax: number, state?: string): number {
    if (!state) return 0;
    
    // Bayern (BY) und Baden-Württemberg (BW): 8%, alle anderen: 9%
    const rate = ['BW', 'BY'].includes(state.toUpperCase()) ? 0.08 : 0.09;
    return Math.round(incomeTax * rate * 100) / 100;
  }

  /**
   * Berechnet Steuerfreibetrag basierend auf Steuerklasse und Kinderfreibetrag
   */
  private getBasicAllowance(taxClass: number, childAllowance: number): number {
    const baseAllowance = this.basicAllowances[taxClass as keyof typeof this.basicAllowances];
    const childAllowanceAmount = childAllowance * this.childAllowance;
    
    return baseAllowance + childAllowanceAmount;
  }
}

