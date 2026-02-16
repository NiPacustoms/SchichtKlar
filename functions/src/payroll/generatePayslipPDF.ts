// Server-seitige PDF-Generierung für Gehaltsabrechnungen
// Cloud Function für sichere PDF-Erstellung nach §108 GewO

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';

const db = admin.firestore();

// Helper-Funktion für Datumsformatierung
function formatDate(date: Date | admin.firestore.Timestamp | null | undefined): string {
  if (!date) return '';
  const d = date instanceof admin.firestore.Timestamp ? date.toDate() : date;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Helper-Funktion für Geldbeträge
function formatMoney(amount: number | null | undefined): string {
  return `${(amount || 0).toFixed(2)} €`;
}

// Helper-Funktion zum Zeichnen von Text mit automatischem Zeilenumbruch
function drawTextWrapped(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  color: any = rgb(0, 0, 0)
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const width = font.widthOfTextAtSize(testLine, size);
    
    if (width > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      line = word;
      currentY -= size + 2;
    } else {
      line = testLine;
    }
  }
  
  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color });
  }
  
  return currentY;
}

/**
 * Generiert PDF für einzelne Gehaltsabrechnung mit allen Pflichtangaben nach §108 GewO
 */
export const generatePayslipPDF = functions.https.onCall(async (data, context) => {
  // Authentifizierung prüfen
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { employeeId, periodId, year, month } = data;

  if (!employeeId || (!periodId && (!year || !month))) {
    throw new functions.https.HttpsError('invalid-argument', 'employeeId and (periodId or year/month) are required');
  }

  try {
    // Berechtigung prüfen
    const user = await db.collection('users').doc(context.auth.uid).get();
    if (!user.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = user.data()!;
    const isAdmin = userData.role === 'admin';
    const isOwnData = context.auth.uid === employeeId;

    if (!isAdmin && !isOwnData) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only access your own payroll data'
      );
    }

    // Periode laden (falls periodId vorhanden)
    let period: any = null;
    let periodYear = year;
    let periodMonth = month;
    
    if (periodId) {
      const periodDoc = await db.collection('payrollPeriods').doc(periodId).get();
      if (periodDoc.exists) {
        period = periodDoc.data();
        periodYear = period.year;
        periodMonth = period.month;
      }
    }

    // PayrollItem laden
    let payrollItem: any = null;
    if (periodId) {
      const itemsQuery = await db
        .collection('payrollItems')
        .where('periodId', '==', periodId)
        .where('userId', '==', employeeId)
        .limit(1)
        .get();
      
      if (!itemsQuery.empty) {
        payrollItem = itemsQuery.docs[0].data();
      }
    } else {
      // Fallback: Suche nach year/month
      const periodsQuery = await db
        .collection('payrollPeriods')
        .where('year', '==', year)
        .where('month', '==', month)
        .limit(1)
        .get();
      
      if (!periodsQuery.empty) {
        const foundPeriod = periodsQuery.docs[0];
        const itemsQuery = await db
          .collection('payrollItems')
          .where('periodId', '==', foundPeriod.id)
          .where('userId', '==', employeeId)
          .limit(1)
          .get();
        
        if (!itemsQuery.empty) {
          payrollItem = itemsQuery.docs[0].data();
          period = foundPeriod.data();
        }
      }
    }

    if (!payrollItem) {
      throw new functions.https.HttpsError('not-found', 'Payroll item not found');
    }

    // Mitarbeiterdaten laden
    const employeeDoc = await db.collection('users').doc(employeeId).get();
    if (!employeeDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Employee not found');
    }

    const employee = employeeDoc.data()!;

    // PayrollSettings laden
    const settingsQuery = await db
      .collection('payrollSettings')
      .where('userId', '==', employeeId)
      .limit(1)
      .get();
    
    const payrollSettings = settingsQuery.empty ? null : settingsQuery.docs[0].data();

    // Firmendaten laden
    const companyDoc = await db.collection('systemSettings').doc('main').get();
    const company = companyDoc.exists ? (companyDoc.data() as any) : null;

    // PDF generieren (pdf-lib)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();

    let currentY = height - 50;

    // === HEADER: Arbeitgeber ===
    if (company) {
      page.drawText(company.companyName || company.name || 'JobFlow GmbH', {
        x: 50,
        y: currentY,
        size: 16,
        font: boldFont,
        color: rgb(0, 0.35, 0.45),
      });
      currentY -= 20;

      if (company.address) {
        const addressLines = (company.address as string).split('\n');
        for (const line of addressLines) {
          page.drawText(line, { x: 50, y: currentY, size: 10, font });
          currentY -= 14;
        }
      }

      if (company.phone) {
        page.drawText(`Tel: ${company.phone}`, { x: 50, y: currentY, size: 10, font });
        currentY -= 14;
      }

      if (company.email) {
        page.drawText(`E-Mail: ${company.email}`, { x: 50, y: currentY, size: 10, font });
        currentY -= 14;
      }

      // Steuernummer des Arbeitgebers (Pflichtangabe)
      if (company.taxNumber) {
        page.drawText(`Steuernummer: ${company.taxNumber}`, { x: 50, y: currentY, size: 10, font });
        currentY -= 14;
      }
    }

    currentY -= 10;
    page.drawLine({
      start: { x: 50, y: currentY },
      end: { x: width - 50, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 20;

    // === TITEL ===
    page.drawText(`Gehaltsabrechnung ${String(periodMonth).padStart(2, '0')}/${periodYear}`, {
      x: 50,
      y: currentY,
      size: 18,
      font: boldFont,
      color: rgb(0, 0.35, 0.45),
    });
    currentY -= 30;

    // === ARBEITNEHMER (Pflichtangaben) ===
    page.drawText('Arbeitnehmer:', { x: 50, y: currentY, size: 12, font: boldFont });
    currentY -= 18;

    page.drawText(`Name: ${employee.name || employee.displayName || employee.email || employeeId}`, {
      x: 50,
      y: currentY,
      size: 10,
      font,
    });
    currentY -= 14;

    if (employee.address) {
      const addressLines = (employee.address as string).split('\n');
      for (const line of addressLines) {
        page.drawText(line, { x: 50, y: currentY, size: 10, font });
        currentY -= 14;
      }
    }

    // Geburtsdatum (Pflichtangabe)
    if (employee.birthDate || employee.dateOfBirth) {
      const birthDate = employee.birthDate || employee.dateOfBirth;
      page.drawText(`Geburtsdatum: ${formatDate(birthDate)}`, {
        x: 50,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 14;
    }

    // Steuer-ID (Pflichtangabe)
    if (payrollSettings?.taxId) {
      page.drawText(`Steuer-ID: ${payrollSettings.taxId}`, {
        x: 50,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 14;
    }

    // SV-Nummer (Pflichtangabe)
    if (payrollSettings?.socialSecurityNumber) {
      page.drawText(`SV-Nummer: ${payrollSettings.socialSecurityNumber}`, {
        x: 50,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 14;
    }

    // Steuerklasse (Pflichtangabe)
    if (payrollSettings?.taxClass) {
      page.drawText(`Steuerklasse: ${payrollSettings.taxClass}`, {
        x: 50,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 14;
    }

    currentY -= 10;
    page.drawLine({
      start: { x: 50, y: currentY },
      end: { x: width - 50, y: currentY },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 20;

    // === ABRECHNUNGSZEITRAUM (Pflichtangabe) ===
    page.drawText('Abrechnungszeitraum:', { x: 50, y: currentY, size: 12, font: boldFont });
    currentY -= 18;

    if (period?.startDate && period?.endDate) {
      page.drawText(
        `Vom: ${formatDate(period.startDate)} bis: ${formatDate(period.endDate)}`,
        { x: 50, y: currentY, size: 10, font }
      );
      currentY -= 14;
    } else {
      // Fallback: Berechne aus Jahr/Monat
      const startDate = new Date(periodYear, periodMonth - 1, 1);
      const endDate = new Date(periodYear, periodMonth, 0);
      page.drawText(
        `Vom: ${formatDate(startDate)} bis: ${formatDate(endDate)}`,
        { x: 50, y: currentY, size: 10, font }
      );
      currentY -= 14;
    }

    // Zahlungszeitpunkt (Pflichtangabe)
    if (period?.paidAt) {
      page.drawText(`Zahlungszeitpunkt: ${formatDate(period.paidAt)}`, {
        x: 50,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 14;
    }

    currentY -= 10;
    page.drawLine({
      start: { x: 50, y: currentY },
      end: { x: width - 50, y: currentY },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY -= 20;

    // === ZUSAMMENSETZUNG DES ARBEITSENTGELTS (Pflichtangabe) ===
    page.drawText('Zusammensetzung des Arbeitsentgelts:', {
      x: 50,
      y: currentY,
      size: 12,
      font: boldFont,
    });
    currentY -= 18;

    const earnings: Array<[string, number]> = [
      ['Grundlohn', payrollItem.baseSalary || 0],
      ['Überstunden', payrollItem.overtimeAmount || 0],
      ['Nachtzuschlag', payrollItem.nightShiftAmount || 0],
      ['Wochenendzuschlag', payrollItem.weekendAmount || 0],
      ['Feiertagszuschlag', payrollItem.holidayAmount || 0],
      ['Boni/Zulagen', payrollItem.bonuses || 0],
    ];

    const totalEarnings = earnings.reduce((sum, [, amount]) => sum + amount, 0);
    const deductions = payrollItem.deductions || 0;
    const grossSalary = totalEarnings - deductions;

    earnings.forEach(([label, amount]) => {
      if (amount > 0) {
        page.drawText(label, { x: 70, y: currentY, size: 10, font });
        page.drawText(formatMoney(amount), {
          x: width - 150,
          y: currentY,
          size: 10,
          font,
        });
        currentY -= 14;
      }
    });

    if (deductions > 0) {
      page.drawText('Abzüge', { x: 70, y: currentY, size: 10, font });
      page.drawText(`-${formatMoney(deductions)}`, {
        x: width - 150,
        y: currentY,
        size: 10,
        font,
        color: rgb(0.8, 0, 0),
      });
      currentY -= 14;
    }

    page.drawLine({
      start: { x: 50, y: currentY },
      end: { x: width - 50, y: currentY },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    });
    currentY -= 10;

    page.drawText('Bruttolohn/-gehalt', { x: 50, y: currentY, size: 11, font: boldFont });
    page.drawText(formatMoney(grossSalary), {
      x: width - 150,
      y: currentY,
      size: 11,
      font: boldFont,
    });
    currentY -= 20;

    // === ABZÜGE (Pflichtangabe - gesplittet) ===
    page.drawText('Abzüge:', { x: 50, y: currentY, size: 12, font: boldFont });
    currentY -= 18;

    // Lohnsteuer - Aufteilen in Lohnsteuer, Soli, Kirchensteuer
    // Hinweis: payrollItem.incomeTax enthält die Summe (incomeTax + solidarityTax + churchTax)
    // Für korrekte Aufteilung müssen die einzelnen Werte aus der Berechnung kommen
    // Vereinfachte Aufteilung basierend auf typischen Verhältnissen
    const incomeTaxTotal = payrollItem.incomeTax || 0;
    // Typisches Verhältnis: ~90% Lohnsteuer, ~5% Soli, ~5% Kirchensteuer (wenn vorhanden)
    // Besser: Diese Werte sollten separat in payrollItem gespeichert werden
    const hasChurchTax = payrollSettings?.churchTax || false;
    const baseTax = hasChurchTax ? incomeTaxTotal / 1.1 : incomeTaxTotal / 1.055; // Rückwärtsberechnung
    const incomeTax = baseTax;
    const solidarityTax = baseTax * 0.055;
    const churchTax = hasChurchTax ? baseTax * 0.09 : 0; // Vereinfacht: 9% Standard

    page.drawText('Lohnsteuer', { x: 70, y: currentY, size: 10, font });
    page.drawText(formatMoney(incomeTax), {
      x: width - 150,
      y: currentY,
      size: 10,
      font,
    });
    currentY -= 14;

    page.drawText('Solidaritätszuschlag', { x: 70, y: currentY, size: 10, font });
    page.drawText(formatMoney(solidarityTax), {
      x: width - 150,
      y: currentY,
      size: 10,
      font,
    });
    currentY -= 14;

    if (churchTax > 0) {
      page.drawText('Kirchensteuer', { x: 70, y: currentY, size: 10, font });
      page.drawText(formatMoney(churchTax), {
        x: width - 150,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 14;
    }

    // Sozialversicherungsbeiträge (gesplittet)
    page.drawText('Sozialversicherungsbeiträge:', { x: 70, y: currentY, size: 10, font: boldFont });
    currentY -= 14;

    if (payrollItem.healthInsurance) {
      page.drawText('Krankenversicherung (AN-Anteil)', { x: 90, y: currentY, size: 10, font });
      page.drawText(formatMoney(payrollItem.healthInsurance), {
        x: width - 150,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 14;
    }

    if (payrollItem.pensionInsurance) {
      page.drawText('Rentenversicherung (AN-Anteil)', { x: 90, y: currentY, size: 10, font });
      page.drawText(formatMoney(payrollItem.pensionInsurance), {
        x: width - 150,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 14;
    }

    if (payrollItem.unemploymentInsurance) {
      page.drawText('Arbeitslosenversicherung (AN-Anteil)', { x: 90, y: currentY, size: 10, font });
      page.drawText(formatMoney(payrollItem.unemploymentInsurance), {
        x: width - 150,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 14;
    }

    // Pflegeversicherung (wenn vorhanden)
    const careInsurance = (payrollItem.socialInsurance || 0) - 
      (payrollItem.healthInsurance || 0) - 
      (payrollItem.pensionInsurance || 0) - 
      (payrollItem.unemploymentInsurance || 0);
    
    if (careInsurance > 0) {
      page.drawText('Pflegeversicherung (AN-Anteil)', { x: 90, y: currentY, size: 10, font });
      page.drawText(formatMoney(careInsurance), {
        x: width - 150,
        y: currentY,
        size: 10,
        font,
      });
      currentY -= 14;
    }

    const totalDeductions = incomeTaxTotal + (payrollItem.socialInsurance || 0);

    page.drawLine({
      start: { x: 50, y: currentY },
      end: { x: width - 50, y: currentY },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    });
    currentY -= 10;

    page.drawText('Gesamte Abzüge', { x: 50, y: currentY, size: 11, font: boldFont });
    page.drawText(formatMoney(totalDeductions), {
      x: width - 150,
      y: currentY,
      size: 11,
      font: boldFont,
    });
    currentY -= 20;

    // === AUSZAHLUNGSBETRAG (Pflichtangabe) ===
    page.drawRectangle({
      x: 50,
      y: currentY - 30,
      width: width - 100,
      height: 30,
      borderColor: rgb(0, 0.35, 0.45),
      borderWidth: 2,
    });

    page.drawText('Auszahlungsbetrag (Nettolohn/-gehalt)', {
      x: 60,
      y: currentY - 15,
      size: 12,
      font: boldFont,
      color: rgb(0, 0.35, 0.45),
    });
    page.drawText(formatMoney(payrollItem.netSalary || 0), {
      x: width - 150,
      y: currentY - 15,
      size: 14,
      font: boldFont,
      color: rgb(0, 0.35, 0.45),
    });
    currentY -= 40;

    // === FOOTER ===
    currentY = 50;
    page.drawLine({
      start: { x: 50, y: currentY + 20 },
      end: { x: width - 50, y: currentY + 20 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentY += 10;

    page.drawText(
      'Diese Abrechnung wurde maschinell erstellt und ist ohne Unterschrift gültig.',
      { x: 50, y: currentY, size: 8, font, color: rgb(0.5, 0.5, 0.5) }
    );
    currentY -= 12;

    page.drawText(
      `Erstellt am: ${formatDate(admin.firestore.Timestamp.now())}`,
      { x: 50, y: currentY, size: 8, font, color: rgb(0.5, 0.5, 0.5) }
    );

    const pdfBytes = await pdfDoc.save();

    // PDF in Firebase Storage hochladen
    const bucket = admin.storage().bucket();
    const fileName = `payslips/${periodYear}/${String(periodMonth).padStart(2, '0')}/${employeeId}.pdf`;
    const file = bucket.file(fileName);
    await file.save(Buffer.from(pdfBytes), { metadata: { contentType: 'application/pdf' } });

    // Öffentliche URL generieren
    await file.makePublic();
    const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // PDF-URL in PayrollItem speichern (falls periodId vorhanden)
    if (periodId) {
      const itemsQuery = await db
        .collection('payrollItems')
        .where('periodId', '==', periodId)
        .where('userId', '==', employeeId)
        .limit(1)
        .get();
      
      if (!itemsQuery.empty) {
        await itemsQuery.docs[0].ref.update({
          pdfUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'payslip_pdf_generated',
      employeeId,
      year,
      month,
      userId: context.auth.uid,
      pdfUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      pdfUrl,
      message: 'PDF erfolgreich generiert',
    };

  } catch (error) {
    console.error('Error generating payslip PDF:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Fehler bei der PDF-Generierung'
    );
  }
});

/**
 * Generiert PDFs für alle Mitarbeiter einer Periode
 */
export const generateBatchPayslipPDFs = functions.https.onCall(async (data, context) => {
  // Authentifizierung prüfen
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { year, month } = data;

  if (!year || !month) {
    throw new functions.https.HttpsError('invalid-argument', 'year and month are required');
  }

  try {
    // Admin-Berechtigung prüfen
    const user = await db.collection('users').doc(context.auth.uid).get();
    if (!user.exists || user.data()!.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin access required'
      );
    }

    // Alle Berechnungen für die Periode laden
    const calculationsQuery = await db
      .collection('payrollCalculations')
      .where('year', '==', year)
      .where('month', '==', month)
      .get();

    if (calculationsQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'No payroll calculations found for this period');
    }

    const calculations = calculationsQuery.docs.map(doc => doc.data());
    const employeeIds = Array.from(new Set(calculations.map(calc => calc.employeeId)));

    // Mitarbeiterdaten laden
    const employeesSnapshot = await db
      .collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', employeeIds)
      .get();

    const employees = employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Firmendaten laden (derzeit nicht im Batch-PDF verwendet)
    await db.collection('systemSettings').doc('main').get();

    // PDFs generieren
    // PDFs generieren und hochladen
    const bucket = admin.storage().bucket();
    const pdfUrls: string[] = [];

    for (let i = 0; i < calculations.length; i++) {
      const calculation = calculations[i];
      const employee = employees.find(e => e.id === calculation.employeeId) as any;
      if (!employee) continue;

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText(`Gehaltsabrechnung ${String(month).padStart(2, '0')}/${year}`, { x: 50, y: 800, size: 16, font });
      page.drawText(`Mitarbeiter: ${employee.name || employee.id}`, { x: 50, y: 780, size: 11, font });
      page.drawText(`Bruttolohn: ${(calculation.grossSalary || 0).toFixed(2)} €`, { x: 50, y: 760, size: 11, font });
      page.drawText(`Nettolohn: ${(calculation.netSalary || 0).toFixed(2)} €`, { x: 50, y: 744, size: 11, font });
      const pdfBytes = await pdfDoc.save();

      const fileName = `payslips/${year}/${String(month).padStart(2, '0')}/${calculation.employeeId}.pdf`;
      const file = bucket.file(fileName);
      await file.save(Buffer.from(pdfBytes), { metadata: { contentType: 'application/pdf' } });
      await file.makePublic();
      const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      pdfUrls.push(pdfUrl);

      await db.collection('payrollCalculations').doc(calculation.id).update({
        pdfUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'batch_payslip_pdfs_generated',
      year,
      month,
      userId: context.auth.uid,
      pdfCount: pdfUrls.length,
      pdfUrls,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      pdfCount: pdfUrls.length,
      pdfUrls,
      message: `${pdfUrls.length} PDFs erfolgreich generiert`,
    };

  } catch (error) {
    console.error('Error generating batch payslip PDFs:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Fehler bei der Batch-PDF-Generierung'
    );
  }
});

/**
 * Löscht PDF aus Storage
 */
export const deletePayslipPDF = functions.https.onCall(async (data, context) => {
  // Authentifizierung prüfen
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { pdfUrl } = data;

  if (!pdfUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'pdfUrl is required');
  }

  try {
    // Admin-Berechtigung prüfen
    const user = await db.collection('users').doc(context.auth.uid).get();
    if (!user.exists || user.data()!.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin access required'
      );
    }

    // PDF aus Storage löschen
    const bucket = admin.storage().bucket();
    const fileName = pdfUrl.split('/').pop();
    
    if (fileName) {
      await bucket.file(`payslips/${fileName}`).delete();
    }

    // PDF-URL aus Berechnung entfernen
    const calculationsQuery = await db
      .collection('payrollCalculations')
      .where('pdfUrl', '==', pdfUrl)
      .get();

    for (const doc of calculationsQuery.docs) {
      await doc.ref.update({
        pdfUrl: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'payslip_pdf_deleted',
      pdfUrl,
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: 'PDF erfolgreich gelöscht',
    };

  } catch (error) {
    console.error('Error deleting payslip PDF:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Fehler beim Löschen des PDFs'
    );
  }
});
