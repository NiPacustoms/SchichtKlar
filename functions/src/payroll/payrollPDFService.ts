// PDF-Generation für Gehaltsabrechnungen mit Puppeteer
// Erstellt professionelle PDFs aus HTML-Templates

import * as puppeteer from 'puppeteer';
import { PayrollCalculation, EmployeeData, PayrollPeriod } from './payrollCalculationService';

export interface CompanyData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  taxId: string; // Steuernummer des Arbeitgebers
  socialSecurityNumber: string;
}

export interface PayrollPDFData {
  calculation: PayrollCalculation;
  employee: EmployeeData;
  company: CompanyData;
  period: PayrollPeriod;
  // Pflichtangaben nach §108 GewO
  employeeTaxId?: string; // Steuer-ID des Arbeitnehmers
  employeeSocialSecurityNumber?: string; // SV-Nummer des Arbeitnehmers
  employeeBirthDate?: Date; // Geburtsdatum des Arbeitnehmers
  employeeAddress?: string; // Anschrift des Arbeitnehmers
  paymentDate?: Date; // Zahlungszeitpunkt
  payoutDate?: Date; // Auszahlungstag
}

export class PayrollPDFService {
  static async generatePayrollPDF(data: PayrollPDFData): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // HTML-Template generieren
      const html = this.generateHTMLTemplate(data);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // PDF generieren
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      // PDF in Firebase Storage speichern
      const fileName = `payroll-${data.employee.id}-${data.period.year}-${data.period.month.toString().padStart(2, '0')}.pdf`;
      const storageUrl = await this.uploadPDFToStorage(pdfBuffer, fileName);
      
      return storageUrl;
    } finally {
      await browser.close();
    }
  }

  static async generateBatchPayslips(
    calculations: PayrollCalculation[],
    employees: EmployeeData[],
    company: CompanyData
  ): Promise<string[]> {
    const pdfUrls: string[] = [];
    
    for (let i = 0; i < calculations.length; i++) {
      const calculation = calculations[i];
      const employee = employees.find(e => e.id === calculation.employeeId);
      
      if (!employee) continue;
      
      const pdfData: PayrollPDFData = {
        calculation,
        employee,
        company,
        period: calculation.period
      };
      
      try {
        const pdfUrl = await this.generatePayrollPDF(pdfData);
        pdfUrls.push(pdfUrl);
      } catch (error) {
        console.error(`Fehler bei PDF-Generation für ${employee.name}:`, error);
        pdfUrls.push(''); // Platzhalter für fehlgeschlagene PDFs
      }
    }
    
    return pdfUrls;
  }

  private static generateHTMLTemplate(data: PayrollPDFData): string {
    const { calculation, employee, company, period } = data;
    
    // Formatierung für Datum
    const formatDate = (date?: Date): string => {
      if (!date) return '-';
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    
    // Formatierung für Geburtsdatum
    const formatBirthDate = (date?: Date): string => {
      if (!date) return '-';
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    
    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gehaltsabrechnung ${period.month}/${period.year}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #005f73;
            padding-bottom: 20px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #005f73;
            margin-bottom: 10px;
        }
        
        .company-details {
            font-size: 11px;
            color: #666;
        }
        
        .document-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        
        .employee-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .info-section {
            width: 45%;
        }
        
        .info-section h3 {
            font-size: 14px;
            font-weight: bold;
            color: #005f73;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .info-label {
            font-weight: bold;
        }
        
        .payroll-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .payroll-table th,
        .payroll-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        .payroll-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #005f73;
        }
        
        .payroll-table .amount {
            text-align: right;
        }
        
        .payroll-table .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        
        .payroll-table .net-row {
            font-weight: bold;
            background-color: #e8f4f8;
            color: #005f73;
        }
        
        .footer {
            margin-top: 40px;
            font-size: 10px;
            color: #666;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        
        .signature-section {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }
        
        .signature-box {
            width: 45%;
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            margin: 30px 0 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${company.name}</div>
        <div class="company-details">
            ${company.address}<br>
            ${company.postalCode} ${company.city}<br>
            Steuernummer: ${company.taxId || '-'}<br>
            ${company.socialSecurityNumber ? `Sozialversicherungsnummer: ${company.socialSecurityNumber}` : ''}
        </div>
    </div>
    
    <div class="document-title">Gehaltsabrechnung für ${period.month}/${period.year}</div>
    
    <div class="employee-info">
        <div class="info-section">
            <h3>Mitarbeiterdaten (§108 GewO)</h3>
            <div class="info-row">
                <span class="info-label">Name:</span>
                <span>${employee.name}</span>
            </div>
            ${data.employeeAddress ? `
            <div class="info-row">
                <span class="info-label">Anschrift:</span>
                <span>${data.employeeAddress}</span>
            </div>
            ` : ''}
            ${data.employeeBirthDate ? `
            <div class="info-row">
                <span class="info-label">Geburtsdatum:</span>
                <span>${formatBirthDate(data.employeeBirthDate)}</span>
            </div>
            ` : ''}
            ${data.employeeTaxId ? `
            <div class="info-row">
                <span class="info-label">Steuer-ID:</span>
                <span>${data.employeeTaxId}</span>
            </div>
            ` : ''}
            ${data.employeeSocialSecurityNumber ? `
            <div class="info-row">
                <span class="info-label">Sozialversicherungsnummer:</span>
                <span>${data.employeeSocialSecurityNumber}</span>
            </div>
            ` : ''}
            <div class="info-row">
                <span class="info-label">Lohnsteuerklasse:</span>
                <span>${employee.taxClass}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Kinderfreibetrag:</span>
                <span>${employee.children}</span>
            </div>
            ${employee.email ? `
            <div class="info-row">
                <span class="info-label">E-Mail:</span>
                <span>${employee.email}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="info-section">
            <h3>Abrechnungszeitraum (§108 GewO)</h3>
            <div class="info-row">
                <span class="info-label">Zeitraum:</span>
                <span>${period.month}/${period.year}</span>
            </div>
            ${period.startDate ? `
            <div class="info-row">
                <span class="info-label">Beginn:</span>
                <span>${formatDate(period.startDate)}</span>
            </div>
            ` : ''}
            ${period.endDate ? `
            <div class="info-row">
                <span class="info-label">Ende:</span>
                <span>${formatDate(period.endDate)}</span>
            </div>
            ` : ''}
            ${data.paymentDate ? `
            <div class="info-row">
                <span class="info-label">Zahlungszeitpunkt:</span>
                <span>${formatDate(data.paymentDate)}</span>
            </div>
            ` : ''}
            ${data.payoutDate ? `
            <div class="info-row">
                <span class="info-label">Auszahlungstag:</span>
                <span>${formatDate(data.payoutDate)}</span>
            </div>
            ` : ''}
            <div class="info-row">
                <span class="info-label">Arbeitstage:</span>
                <span>${period.workingDays || '-'}</span>
            </div>
            ${calculation.workingHours ? `
            <div class="info-row">
                <span class="info-label">Arbeitsstunden:</span>
                <span>${calculation.workingHours.toFixed(2)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Stundensatz:</span>
                <span>${calculation.hourlyRate?.toFixed(2)} €</span>
            </div>
            ` : ''}
        </div>
    </div>
    
    <table class="payroll-table">
        <thead>
            <tr>
                <th>Position</th>
                <th class="amount">Betrag (€)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Bruttolohn</td>
                <td class="amount">${calculation.grossSalary.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="2"><strong>Sozialversicherung</strong></td>
            </tr>
            <tr>
                <td>&nbsp;&nbsp;Krankenversicherung</td>
                <td class="amount">-${calculation.healthInsurance.toFixed(2)}</td>
            </tr>
            <tr>
                <td>&nbsp;&nbsp;Rentenversicherung</td>
                <td class="amount">-${calculation.pensionInsurance.toFixed(2)}</td>
            </tr>
            <tr>
                <td>&nbsp;&nbsp;Arbeitslosenversicherung</td>
                <td class="amount">-${calculation.unemploymentInsurance.toFixed(2)}</td>
            </tr>
            <tr>
                <td>&nbsp;&nbsp;Pflegeversicherung</td>
                <td class="amount">-${calculation.careInsurance.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
                <td><strong>Sozialversicherung gesamt</strong></td>
                <td class="amount"><strong>-${calculation.socialInsuranceTotal.toFixed(2)}</strong></td>
            </tr>
            <tr>
                <td colspan="2"><strong>Steuern</strong></td>
            </tr>
            <tr>
                <td>&nbsp;&nbsp;Lohnsteuer</td>
                <td class="amount">-${calculation.incomeTax.toFixed(2)}</td>
            </tr>
            <tr>
                <td>&nbsp;&nbsp;Solidaritätszuschlag</td>
                <td class="amount">-${calculation.solidaritySurcharge.toFixed(2)}</td>
            </tr>
            ${calculation.churchTax > 0 ? `
            <tr>
                <td>&nbsp;&nbsp;Kirchensteuer</td>
                <td class="amount">-${calculation.churchTax.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
                <td><strong>Steuern gesamt</strong></td>
                <td class="amount"><strong>-${calculation.taxesTotal.toFixed(2)}</strong></td>
            </tr>
            <tr class="net-row">
                <td><strong>Nettolohn</strong></td>
                <td class="amount"><strong>${calculation.netSalary.toFixed(2)}</strong></td>
            </tr>
        </tbody>
    </table>
    
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div>Arbeitgeber</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div>Mitarbeiter</div>
        </div>
    </div>
    
    <div class="footer">
        <p>Diese Gehaltsabrechnung wurde automatisch erstellt am ${new Date().toLocaleDateString('de-DE')}.</p>
        <p>Bei Fragen wenden Sie sich bitte an die Personalabteilung.</p>
    </div>
</body>
</html>
    `;
  }

  private static async uploadPDFToStorage(pdfBuffer: Buffer, fileName: string): Promise<string> {
    const admin = await import('firebase-admin');
    const bucket = admin.storage().bucket();
    const path = `payslips/${fileName}`;
    const file = bucket.file(path);
    await file.save(pdfBuffer, { metadata: { contentType: 'application/pdf' } });
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${path}`;
  }
}
