// DATEV-Export für deutsche Buchhaltung
// Generiert DATEV-konforme Exportdateien für Lohnbuchhaltung

import { PayrollCalculation, EmployeeData } from './payrollCalculationService';

export interface DATEVExportData {
  calculations: PayrollCalculation[];
  employees: EmployeeData[];
  company: {
    name: string;
    taxId: string;
    socialSecurityNumber: string;
  };
  period: {
    year: number;
    month: number;
  };
}

export interface DATEVRecord {
  recordType: string;
  fields: string[];
}

export class DATEVExportService {
  static async exportToDATEV(data: DATEVExportData): Promise<string> {
    const records: DATEVRecord[] = [];
    
    // Header-Record (DATEV-Standard)
    records.push(this.createHeaderRecord(data));
    
    // Lohnbuchhaltung Records für jeden Mitarbeiter
    for (let i = 0; i < data.calculations.length; i++) {
      const calculation = data.calculations[i];
      const employee = data.employees.find(e => e.id === calculation.employeeId);
      
      if (!employee) continue;
      
      // Lohnbuchhaltung Hauptrecord
      records.push(this.createPayrollMainRecord(calculation, employee, data.period));
      
      // Sozialversicherung Records
      records.push(this.createSocialInsuranceRecord(calculation, employee, data.period));
      
      // Steuer Records
      records.push(this.createTaxRecord(calculation, employee, data.period));
    }
    
    // Footer-Record
    records.push(this.createFooterRecord(data));
    
    // DATEV-Format generieren
    const datevContent = this.generateDATEVContent(records);
    
    // Datei speichern und URL zurückgeben
    const fileName = `DATEV_Lohnbuchhaltung_${data.period.year}_${data.period.month.toString().padStart(2, '0')}.txt`;
    const fileUrl = await this.saveDATEVFile(datevContent, fileName);
    
    return fileUrl;
  }

  private static createHeaderRecord(data: DATEVExportData): DATEVRecord {
    return {
      recordType: 'EXTF',
      fields: [
        '700', // DATEV-Format Version
        '21', // Lohnbuchhaltung
        'Lohnbuchhaltung', // Bezeichnung
        data.company.name, // Firmenname
        data.company.taxId, // Steuernummer
        data.company.socialSecurityNumber, // Sozialversicherungsnummer
        data.period.year.toString(), // Jahr
        data.period.month.toString().padStart(2, '0'), // Monat
        new Date().toISOString().split('T')[0].replace(/-/g, ''), // Export-Datum
        'JobFlow', // Software-Name
        '1.0' // Software-Version
      ]
    };
  }

  private static createPayrollMainRecord(
    calculation: PayrollCalculation,
    employee: EmployeeData,
    period: { year: number; month: number }
  ): DATEVRecord {
    return {
      recordType: 'LON',
      fields: [
        employee.id, // Personalnummer
        employee.name, // Name
        employee.email, // E-Mail
        period.year.toString(), // Jahr
        period.month.toString().padStart(2, '0'), // Monat
        calculation.grossSalary.toFixed(2), // Bruttolohn
        calculation.netSalary.toFixed(2), // Nettolohn
        employee.taxClass.toString(), // Lohnsteuerklasse
        employee.children.toString(), // Anzahl Kinder
        employee.healthInsurance === 'gesetzlich' ? '1' : '0', // Gesetzliche KV
        calculation.workingHours?.toString() || '', // Arbeitsstunden
        calculation.hourlyRate?.toFixed(2) || '' // Stundensatz
      ]
    };
  }

  private static createSocialInsuranceRecord(
    calculation: PayrollCalculation,
    employee: EmployeeData,
    period: { year: number; month: number }
  ): DATEVRecord {
    return {
      recordType: 'SOZ',
      fields: [
        employee.id, // Personalnummer
        period.year.toString(), // Jahr
        period.month.toString().padStart(2, '0'), // Monat
        calculation.healthInsurance.toFixed(2), // Krankenversicherung
        calculation.pensionInsurance.toFixed(2), // Rentenversicherung
        calculation.unemploymentInsurance.toFixed(2), // Arbeitslosenversicherung
        calculation.careInsurance.toFixed(2), // Pflegeversicherung
        calculation.socialInsuranceTotal.toFixed(2), // Sozialversicherung gesamt
        employee.healthInsuranceRate?.toString() || '0' // KV-Zusatzbeitrag
      ]
    };
  }

  private static createTaxRecord(
    calculation: PayrollCalculation,
    employee: EmployeeData,
    period: { year: number; month: number }
  ): DATEVRecord {
    return {
      recordType: 'STU',
      fields: [
        employee.id, // Personalnummer
        period.year.toString(), // Jahr
        period.month.toString().padStart(2, '0'), // Monat
        calculation.incomeTax.toFixed(2), // Lohnsteuer
        calculation.solidaritySurcharge.toFixed(2), // Solidaritätszuschlag
        calculation.churchTax.toFixed(2), // Kirchensteuer
        calculation.taxesTotal.toFixed(2), // Steuern gesamt
        employee.taxClass.toString(), // Lohnsteuerklasse
        employee.churchTax ? '1' : '0' // Kirchensteuerpflichtig
      ]
    };
  }

  private static createFooterRecord(data: DATEVExportData): DATEVRecord {
    return {
      recordType: 'END',
      fields: [
        data.calculations.length.toString(), // Anzahl Records
        new Date().toISOString().split('T')[0].replace(/-/g, ''), // Export-Datum
        new Date().toTimeString().split(' ')[0].replace(/:/g, '') // Export-Zeit
      ]
    };
  }

  private static generateDATEVContent(records: DATEVRecord[]): string {
    const lines: string[] = [];
    
    for (const record of records) {
      // DATEV-Format: Record-Type + Felder durch Semikolon getrennt
      const line = [record.recordType, ...record.fields].join(';');
      lines.push(line);
    }
    
    return lines.join('\n');
  }

  private static async saveDATEVFile(content: string, fileName: string): Promise<string> {
    const admin = await import('firebase-admin');
    const bucket = admin.storage().bucket();
    const path = `datev/${fileName}`;
    const file = bucket.file(path);
    await file.save(Buffer.from(content, 'utf8'), { metadata: { contentType: 'text/plain; charset=utf-8' } });
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${path}`;
  }

  // Zusätzliche Methode für DATEV-Kontenplan Export
  static async exportChartOfAccounts(): Promise<string> {
    const accounts = [
      { number: '8400', name: 'Bruttolohn', type: 'Aufwand' },
      { number: '8401', name: 'Krankenversicherung', type: 'Aufwand' },
      { number: '8402', name: 'Rentenversicherung', type: 'Aufwand' },
      { number: '8403', name: 'Arbeitslosenversicherung', type: 'Aufwand' },
      { number: '8404', name: 'Pflegeversicherung', type: 'Aufwand' },
      { number: '8405', name: 'Lohnsteuer', type: 'Aufwand' },
      { number: '8406', name: 'Solidaritätszuschlag', type: 'Aufwand' },
      { number: '8407', name: 'Kirchensteuer', type: 'Aufwand' },
      { number: '8408', name: 'Nettolohn', type: 'Aufwand' },
    ];

    const content = accounts.map(account => 
      `${account.number};${account.name};${account.type}`
    ).join('\n');

    const fileName = 'DATEV_Kontenplan_Lohnbuchhaltung.txt';
    return await this.saveDATEVFile(content, fileName);
  }
}
