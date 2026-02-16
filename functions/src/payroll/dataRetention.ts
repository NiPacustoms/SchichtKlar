// DSGVO-konforme Datenaufbewahrung und -löschung
// Automatische Löschung nach Aufbewahrungsfristen

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

const db = admin.firestore();

/**
 * Automatische Datenlöschung nach DSGVO
 * Läuft täglich um 3 Uhr morgens
 */
export const scheduleDataDeletion = functions.pubsub
  .schedule('0 3 * * *') // Täglich um 3 Uhr
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    
    try {
      const now = new Date();
      const deletionDate = new Date(now.getTime() - (7 * 365 * 24 * 60 * 60 * 1000)); // 7 Jahre
      
      // Gehaltsdaten älter als 7 Jahre löschen
      await deleteOldPayrollData(deletionDate);
      
      // Audit-Logs älter als 10 Jahre löschen
      const auditDeletionDate = new Date(now.getTime() - (10 * 365 * 24 * 60 * 60 * 1000)); // 10 Jahre
      await deleteOldAuditLogs(auditDeletionDate);
      
      // Temporäre Dateien älter als 30 Tage löschen
      const tempDeletionDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 Tage
      await deleteOldTempFiles(tempDeletionDate);
      
      
      return {
        success: true,
        message: 'Datenlöschung erfolgreich abgeschlossen',
        deletedPayrollData: await getDeletedPayrollDataCount(deletionDate),
        deletedAuditLogs: await getDeletedAuditLogsCount(auditDeletionDate),
        deletedTempFiles: await getDeletedTempFilesCount(tempDeletionDate),
      };
      
    } catch (error) {
      console.error('Error in scheduled data deletion:', error);
      
      // Fehler in Audit-Log protokollieren
      await db.collection('systemAuditLogs').add({
        action: 'scheduled_data_deletion_error',
        error: (error as Error).message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      throw new functions.https.HttpsError(
        'internal',
        'Fehler bei der automatischen Datenlöschung'
      );
    }
  });

/**
 * Löscht alte Gehaltsdaten
 */
async function deleteOldPayrollData(deletionDate: Date): Promise<void> {
  
  // Alte Lohnberechnungen löschen
  const oldCalculations = await db
    .collection('payrollCalculations')
    .where('createdAt', '<', deletionDate)
    .get();
  
  const batch = db.batch();
  oldCalculations.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  if (oldCalculations.docs.length > 0) {
    await batch.commit();
  }
  
  // Alte Abrechnungsperioden löschen
  const oldPeriods = await db
    .collection('payrollPeriods')
    .where('createdAt', '<', deletionDate)
    .get();
  
  const periodBatch = db.batch();
  oldPeriods.docs.forEach(doc => {
    periodBatch.delete(doc.ref);
  });
  
  if (oldPeriods.docs.length > 0) {
    await periodBatch.commit();
  }
}

/**
 * Löscht alte Audit-Logs
 */
async function deleteOldAuditLogs(deletionDate: Date): Promise<void> {
  
  const oldAuditLogs = await db
    .collection('payrollAuditLogs')
    .where('timestamp', '<', deletionDate)
    .get();
  
  const batch = db.batch();
  oldAuditLogs.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  if (oldAuditLogs.docs.length > 0) {
    await batch.commit();
  }
}

/**
 * Löscht alte temporäre Dateien
 */
async function deleteOldTempFiles(deletionDate: Date): Promise<void> {
  
  const bucket = admin.storage().bucket();
  
  // Temporäre PDFs löschen
  const [tempPdfs] = await bucket.getFiles({
    prefix: 'temp/',
    maxResults: 1000,
  });
  
  let deletedCount = 0;
  for (const file of tempPdfs) {
    const [metadata] = await file.getMetadata();
    const created = metadata.timeCreated ? new Date(metadata.timeCreated) : null;
    
    if (created && created < deletionDate) {
      await file.delete();
      deletedCount++;
    }
  }
  
}

/**
 * Manuelle Datenlöschung für einen Mitarbeiter
 */
export const deleteEmployeeData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { employeeId, reason, dataTypes } = data;

  if (!employeeId || !reason || !dataTypes) {
    throw new functions.https.HttpsError('invalid-argument', 'employeeId, reason, and dataTypes are required');
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

    const deletedData: string[] = [];

    // Gehaltsdaten löschen
    if (dataTypes.includes('payroll_data')) {
      const payrollDataDoc = await db
        .collection('employeePayrollData')
        .doc(employeeId)
        .get();
      
      if (payrollDataDoc.exists) {
        await payrollDataDoc.ref.delete();
        deletedData.push('payroll_data');
      }
    }

    // Lohnberechnungen löschen
    if (dataTypes.includes('payroll_calculations')) {
      const calculationsQuery = await db
        .collection('payrollCalculations')
        .where('employeeId', '==', employeeId)
        .get();
      
      const batch = db.batch();
      calculationsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      if (calculationsQuery.docs.length > 0) {
        await batch.commit();
        deletedData.push(`payroll_calculations (${calculationsQuery.docs.length})`);
      }
    }

    // PDFs löschen
    if (dataTypes.includes('pdfs')) {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({
        prefix: `payslips/${employeeId}/`,
      });
      
      let pdfCount = 0;
      for (const file of files) {
        await file.delete();
        pdfCount++;
      }
      
      if (pdfCount > 0) {
        deletedData.push(`pdfs (${pdfCount})`);
      }
    }

    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'manual_data_deletion',
      resourceType: 'employee_data',
      resourceId: employeeId,
      employeeId,
      reason,
      dataTypes,
      deletedData,
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      employeeId,
      deletedData,
      message: `Daten für Mitarbeiter ${employeeId} erfolgreich gelöscht`,
    };

  } catch (error) {
    console.error('Error deleting employee data:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Fehler beim Löschen der Mitarbeiterdaten'
    );
  }
});

/**
 * Exportiert Daten vor Löschung
 */
export const exportDataBeforeDeletion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { employeeId, dataTypes } = data;

  if (!employeeId || !dataTypes) {
    throw new functions.https.HttpsError('invalid-argument', 'employeeId and dataTypes are required');
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

    const exportData: any = {
      employeeId,
      exportDate: new Date().toISOString(),
      dataTypes,
    };

    // Gehaltsdaten exportieren
    if (dataTypes.includes('payroll_data')) {
      const payrollDataDoc = await db
        .collection('employeePayrollData')
        .doc(employeeId)
        .get();
      
      if (payrollDataDoc.exists) {
        exportData.payrollData = payrollDataDoc.data();
      }
    }

    // Lohnberechnungen exportieren
    if (dataTypes.includes('payroll_calculations')) {
      const calculationsQuery = await db
        .collection('payrollCalculations')
        .where('employeeId', '==', employeeId)
        .get();
      
      exportData.payrollCalculations = calculationsQuery.docs.map(doc => doc.data());
    }

    // Export in Storage speichern
    const bucket = admin.storage().bucket();
    const fileName = `data-exports/${employeeId}_${Date.now()}.json`;
    const file = bucket.file(fileName);
    
    await file.save(JSON.stringify(exportData, null, 2), {
      metadata: {
        contentType: 'application/json',
      },
    });

    // Öffentliche URL generieren
    await file.makePublic();
    const exportUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'data_export_before_deletion',
      resourceType: 'employee_data',
      resourceId: employeeId,
      employeeId,
      dataTypes,
      exportUrl,
      userId: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      employeeId,
      exportUrl,
      message: `Daten für Mitarbeiter ${employeeId} erfolgreich exportiert`,
    };

  } catch (error) {
    console.error('Error exporting data:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Fehler beim Exportieren der Daten'
    );
  }
});

// Helper functions
async function getDeletedPayrollDataCount(deletionDate: Date): Promise<number> {
  const oldCalculations = await db
    .collection('payrollCalculations')
    .where('createdAt', '<', deletionDate)
    .get();
  
  return oldCalculations.docs.length;
}

async function getDeletedAuditLogsCount(deletionDate: Date): Promise<number> {
  const oldAuditLogs = await db
    .collection('payrollAuditLogs')
    .where('timestamp', '<', deletionDate)
    .get();
  
  return oldAuditLogs.docs.length;
}

async function getDeletedTempFilesCount(deletionDate: Date): Promise<number> {
  const bucket = admin.storage().bucket();
  const [tempFiles] = await bucket.getFiles({
    prefix: 'temp/',
    maxResults: 1000,
  });
  
  let count = 0;
  for (const file of tempFiles) {
    const [metadata] = await file.getMetadata();
    const created = metadata.timeCreated ? new Date(metadata.timeCreated) : null;
    
    if (created && created < deletionDate) {
      count++;
    }
  }
  
  return count;
}
