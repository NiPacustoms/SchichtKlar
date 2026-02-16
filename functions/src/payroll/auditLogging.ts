// Audit-Logging für Lohnabrechnung
// GoBD-konforme Protokollierung aller Änderungen

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

const db = admin.firestore();

/**
 * Protokolliert alle Änderungen an Gehaltsdaten
 */
export const logPayrollAuditEvent = functions.firestore
  .document('companies/{companyId}/employeePayrollData/{employeeId}')
  .onWrite(async (change, context) => {
    const { companyId, employeeId } = context.params;
    
    try {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      
      // Änderungen identifizieren
      const changes: Record<string, { old: any; new: any }> = {};
      
      if (before && after) {
        // Update
        Object.keys(after).forEach(key => {
          if (before[key] !== after[key]) {
            changes[key] = {
              old: before[key],
              new: after[key]
            };
          }
        });
      } else if (!before && after) {
        // Create
        changes['_created'] = {
          old: null,
          new: 'created'
        };
      } else if (before && !after) {
        // Delete
        changes['_deleted'] = {
          old: 'deleted',
          new: null
        };
      }
      
      // Audit-Log erstellen
      await db.collection('payrollAuditLogs').add({
        action: before && after ? 'update' : (!before && after ? 'create' : 'delete'),
        resourceType: 'employee_payroll_data',
        resourceId: employeeId,
        companyId,
        changes,
        userId: context.auth?.uid || 'system',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: (context as any).rawRequest?.ip,
        userAgent: (context as any).rawRequest?.headers?.['user-agent'],
      });
      
    } catch (error) {
      console.error('Error logging payroll audit event:', error);
    }
  });

/**
 * Protokolliert alle Änderungen an Lohnberechnungen
 */
export const logPayrollCalculationAuditEvent = functions.firestore
  .document('payrollCalculations/{calculationId}')
  .onWrite(async (change, context) => {
    const { calculationId } = context.params;
    
    try {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      
      // Änderungen identifizieren
      const changes: Record<string, { old: any; new: any }> = {};
      
      if (before && after) {
        // Update
        Object.keys(after).forEach(key => {
          if (before[key] !== after[key]) {
            changes[key] = {
              old: before[key],
              new: after[key]
            };
          }
        });
      } else if (!before && after) {
        // Create
        changes['_created'] = {
          old: null,
          new: 'created'
        };
      } else if (before && !after) {
        // Delete
        changes['_deleted'] = {
          old: 'deleted',
          new: null
        };
      }
      
      // Audit-Log erstellen
      await db.collection('payrollAuditLogs').add({
        action: before && after ? 'update' : (!before && after ? 'create' : 'delete'),
        resourceType: 'payroll_calculation',
        resourceId: calculationId,
        employeeId: after?.employeeId || before?.employeeId,
        changes,
        userId: context.auth?.uid || 'system',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: (context as any).rawRequest?.ip,
        userAgent: (context as any).rawRequest?.headers?.['user-agent'],
      });
      
    } catch (error) {
      console.error('Error logging payroll calculation audit event:', error);
    }
  });

/**
 * Protokolliert alle Änderungen an Abrechnungsperioden
 */
export const logPayrollPeriodAuditEvent = functions.firestore
  .document('payrollPeriods/{periodId}')
  .onWrite(async (change, context) => {
    const { periodId } = context.params;
    
    try {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      
      // Änderungen identifizieren
      const changes: Record<string, { old: any; new: any }> = {};
      
      if (before && after) {
        // Update
        Object.keys(after).forEach(key => {
          if (before[key] !== after[key]) {
            changes[key] = {
              old: before[key],
              new: after[key]
            };
          }
        });
      } else if (!before && after) {
        // Create
        changes['_created'] = {
          old: null,
          new: 'created'
        };
      } else if (before && !after) {
        // Delete
        changes['_deleted'] = {
          old: 'deleted',
          new: null
        };
      }
      
      // Audit-Log erstellen
      await db.collection('payrollAuditLogs').add({
        action: before && after ? 'update' : (!before && after ? 'create' : 'delete'),
        resourceType: 'payroll_period',
        resourceId: periodId,
        changes,
        userId: context.auth?.uid || 'system',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: (context as any).rawRequest?.ip,
        userAgent: (context as any).rawRequest?.headers?.['user-agent'],
      });
      
    } catch (error) {
      console.error('Error logging payroll period audit event:', error);
    }
  });

/**
 * Protokolliert alle Änderungen an Payroll-Items
 */
export const logPayrollItemAuditEvent = functions.firestore
  .document('payrollItems/{itemId}')
  .onWrite(async (change, context) => {
    const { itemId } = context.params;
    
    try {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      
      // Änderungen identifizieren (nur kritische Felder)
      const changes: Record<string, { old: any; new: any }> = {};
      
      if (before && after) {
        // Update - nur kritische Felder protokollieren
        const criticalFields = ['grossSalary', 'netSalary', 'totalEmployerCost', 'status'];
        criticalFields.forEach(key => {
          if (before[key] !== after[key]) {
            changes[key] = {
              old: before[key],
              new: after[key]
            };
          }
        });
      } else if (!before && after) {
        // Create
        changes['_created'] = {
          old: null,
          new: 'created'
        };
      } else if (before && !after) {
        // Delete
        changes['_deleted'] = {
          old: 'deleted',
          new: null
        };
      }
      
      // Audit-Log erstellen
      await db.collection('payrollAuditLogs').add({
        action: before && after ? 'update' : (!before && after ? 'create' : 'delete'),
        resourceType: 'payroll_item',
        resourceId: itemId,
        periodId: after?.periodId || before?.periodId,
        employeeId: after?.userId || before?.userId,
        employeeName: after?.employeeName || before?.employeeName,
        changes,
        userId: context.auth?.uid || 'system',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: (context as any).rawRequest?.ip,
        userAgent: (context as any).rawRequest?.headers?.['user-agent'],
      });
      
    } catch (error) {
      console.error('Error logging payroll item audit event:', error);
    }
  });

/**
 * Protokolliert Zugriffe auf Gehaltsabrechnungen
 */
export const logPayslipAccess = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { employeeId, year, month, action } = data;

  if (!employeeId || !year || !month || !action) {
    throw new functions.https.HttpsError('invalid-argument', 'employeeId, year, month, and action are required');
  }

  try {
    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: `payslip_${action}`,
      resourceType: 'payslip_access',
      resourceId: `${employeeId}_${year}_${month}`,
      employeeId,
      year,
      month,
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest?.ip,
      userAgent: context.rawRequest?.headers?.['user-agent'],
    });

    return { success: true };

  } catch (error) {
    console.error('Error logging payslip access:', error);
    throw new functions.https.HttpsError('internal', 'Fehler beim Protokollieren des Zugriffs');
  }
});

/**
 * Protokolliert DATEV-Export
 */
export const logDATEVExport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { year, month, employeeCount, exportUrl } = data;

  if (!year || !month) {
    throw new functions.https.HttpsError('invalid-argument', 'year and month are required');
  }

  try {
    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'datev_export',
      resourceType: 'datev_export',
      resourceId: `${year}_${month}`,
      year,
      month,
      employeeCount: employeeCount || 0,
      exportUrl: exportUrl || '',
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest?.ip,
      userAgent: context.rawRequest?.headers?.['user-agent'],
    });

    return { success: true };

  } catch (error) {
    console.error('Error logging DATEV export:', error);
    throw new functions.https.HttpsError('internal', 'Fehler beim Protokollieren des DATEV-Exports');
  }
});

/**
 * Protokolliert PDF-Downloads
 */
export const logPDFDownload = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { employeeId, year, month, pdfUrl } = data;

  if (!employeeId || !year || !month || !pdfUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'employeeId, year, month, and pdfUrl are required');
  }

  try {
    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'pdf_download',
      resourceType: 'payslip_pdf',
      resourceId: `${employeeId}_${year}_${month}`,
      employeeId,
      year,
      month,
      pdfUrl,
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest?.ip,
      userAgent: context.rawRequest?.headers?.['user-agent'],
    });

    return { success: true };

  } catch (error) {
    console.error('Error logging PDF download:', error);
    throw new functions.https.HttpsError('internal', 'Fehler beim Protokollieren des PDF-Downloads');
  }
});

/**
 * Protokolliert Datenlöschung (DSGVO)
 */
export const logDataDeletion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { employeeId, reason, dataTypes } = data;

  if (!employeeId || !reason || !dataTypes) {
    throw new functions.https.HttpsError('invalid-argument', 'employeeId, reason, and dataTypes are required');
  }

  try {
    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'data_deletion',
      resourceType: 'employee_data',
      resourceId: employeeId,
      employeeId,
      reason,
      dataTypes,
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest?.ip,
      userAgent: context.rawRequest?.headers?.['user-agent'],
    });

    return { success: true };

  } catch (error) {
    console.error('Error logging data deletion:', error);
    throw new functions.https.HttpsError('internal', 'Fehler beim Protokollieren der Datenlöschung');
  }
});
