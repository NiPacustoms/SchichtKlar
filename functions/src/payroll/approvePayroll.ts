// Lohnabrechnung genehmigen und sperren
// Cloud Function für Genehmigungsworkflow

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

const db = admin.firestore();

/**
 * Genehmigt Lohnabrechnung für eine Periode
 */
export const approvePayroll = functions.https.onCall(async (data, context) => {
  // Authentifizierung prüfen
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { periodId, notes } = data;

  if (!periodId) {
    throw new functions.https.HttpsError('invalid-argument', 'periodId is required');
  }

  try {
    // Admin-Berechtigung prüfen
    const user = await db.collection('users').doc(context.auth?.uid || 'unknown').get();
    if (!user.exists || user.data()!.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin access required'
      );
    }

    // Periode laden
    const periodDoc = await db.collection('payrollPeriods').doc(periodId).get();
    if (!periodDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payroll period not found');
    }

    const period = periodDoc.data()!;

    // Status prüfen
    if (period.status === 'locked') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Payroll period is already locked'
      );
    }

    if (period.status !== 'ready') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Payroll period must be ready for approval'
      );
    }

    // Alle Berechnungen für die Periode laden
    const calculationsQuery = await db
      .collection('payrollCalculations')
      .where('year', '==', period.year)
      .where('month', '==', period.month)
      .get();

    if (calculationsQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'No payroll calculations found for this period');
    }

    // Berechnungen validieren
    const calculations = calculationsQuery.docs.map(doc => doc.data());
    const invalidCalculations = calculations.filter(calc => calc.status !== 'calculated');

    if (invalidCalculations.length > 0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `${invalidCalculations.length} calculations are not ready for approval`
      );
    }

    // Transaktion für atomare Genehmigung
    await db.runTransaction(async (transaction) => {
      // Periode genehmigen
      transaction.update(periodDoc.ref, {
        status: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: context.auth?.uid || 'unknown',
        notes: notes || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Alle Berechnungen genehmigen
      for (const doc of calculationsQuery.docs) {
        transaction.update(doc.ref, {
          status: 'approved',
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          approvedBy: context.auth?.uid || 'unknown',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'payroll_approved',
      periodId,
      year: period.year,
      month: period.month,
      userId: context.auth?.uid || 'unknown',
      employeeCount: calculations.length,
      notes: notes || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      periodId,
      employeeCount: calculations.length,
      message: `Lohnabrechnung für ${calculations.length} Mitarbeiter erfolgreich genehmigt`,
    };

  } catch (error) {
    console.error('Error approving payroll:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Fehler bei der Genehmigung der Lohnabrechnung'
    );
  }
});

/**
 * Sperrt Lohnabrechnung (nach Zahlung)
 */
export const lockPayroll = functions.https.onCall(async (data, context) => {
  // Authentifizierung prüfen
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { periodId, paidAt } = data;

  if (!periodId) {
    throw new functions.https.HttpsError('invalid-argument', 'periodId is required');
  }

  try {
    // Admin-Berechtigung prüfen
    const user = await db.collection('users').doc(context.auth?.uid || 'unknown').get();
    if (!user.exists || user.data()!.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin access required'
      );
    }

    // Periode laden
    const periodDoc = await db.collection('payrollPeriods').doc(periodId).get();
    if (!periodDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payroll period not found');
    }

    const period = periodDoc.data()!;

    // Status prüfen
    if (period.status === 'locked') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Payroll period is already locked'
      );
    }

    if (period.status !== 'approved') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Payroll period must be approved before locking'
      );
    }

    // Alle Berechnungen für die Periode laden
    const calculationsQuery = await db
      .collection('payrollCalculations')
      .where('year', '==', period.year)
      .where('month', '==', period.month)
      .get();

    if (calculationsQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'No payroll calculations found for this period');
    }

    // Transaktion für atomare Sperrung
    await db.runTransaction(async (transaction) => {
      // Periode sperren
      transaction.update(periodDoc.ref, {
        status: 'locked',
        paidAt: paidAt ? new Date(paidAt) : admin.firestore.FieldValue.serverTimestamp(),
        lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        lockedBy: context.auth?.uid || 'unknown',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Alle Berechnungen als bezahlt markieren
      for (const doc of calculationsQuery.docs) {
        transaction.update(doc.ref, {
          status: 'paid',
          paidAt: paidAt ? new Date(paidAt) : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'payroll_locked',
      periodId,
      year: period.year,
      month: period.month,
      userId: context.auth?.uid || 'unknown',
      employeeCount: calculationsQuery.size,
      paidAt: paidAt || new Date().toISOString(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      periodId,
      employeeCount: calculationsQuery.size,
      message: `Lohnabrechnung für ${calculationsQuery.size} Mitarbeiter erfolgreich gesperrt`,
    };

  } catch (error) {
    console.error('Error locking payroll:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Fehler beim Sperren der Lohnabrechnung'
    );
  }
});

/**
 * Entsperrt Lohnabrechnung (nur in Ausnahmefällen)
 */
export const unlockPayroll = functions.https.onCall(async (data, context) => {
  // Authentifizierung prüfen
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { periodId, reason } = data;

  if (!periodId || !reason) {
    throw new functions.https.HttpsError('invalid-argument', 'periodId and reason are required');
  }

  try {
    // Admin-Berechtigung prüfen
    const user = await db.collection('users').doc(context.auth?.uid || 'unknown').get();
    if (!user.exists || user.data()!.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin access required'
      );
    }

    // Periode laden
    const periodDoc = await db.collection('payrollPeriods').doc(periodId).get();
    if (!periodDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payroll period not found');
    }

    const period = periodDoc.data()!;

    // Status prüfen
    if (period.status !== 'locked') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Payroll period is not locked'
      );
    }

    // Alle Berechnungen für die Periode laden
    const calculationsQuery = await db
      .collection('payrollCalculations')
      .where('year', '==', period.year)
      .where('month', '==', period.month)
      .get();

    if (calculationsQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'No payroll calculations found for this period');
    }

    // Transaktion für atomare Entsperrung
    await db.runTransaction(async (transaction) => {
      // Periode entsperren
      transaction.update(periodDoc.ref, {
        status: 'approved',
        unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
        unlockedBy: context.auth?.uid || 'unknown',
        unlockReason: reason,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Alle Berechnungen als genehmigt markieren
      for (const doc of calculationsQuery.docs) {
        transaction.update(doc.ref, {
          status: 'approved',
          unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
          unlockedBy: context.auth?.uid || 'unknown',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    // Audit-Log erstellen
    await db.collection('payrollAuditLogs').add({
      action: 'payroll_unlocked',
      periodId,
      year: period.year,
      month: period.month,
      userId: context.auth?.uid || 'unknown',
      employeeCount: calculationsQuery.size,
      reason,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      periodId,
      employeeCount: calculationsQuery.size,
      message: `Lohnabrechnung für ${calculationsQuery.size} Mitarbeiter erfolgreich entsperrt`,
    };

  } catch (error) {
    console.error('Error unlocking payroll:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Fehler beim Entsperren der Lohnabrechnung'
    );
  }
});
