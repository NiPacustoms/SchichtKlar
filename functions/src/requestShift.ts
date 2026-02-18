import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

const db = admin.firestore();

/**
 * Cloud Function für Schichtanfragen von Pflegekräften
 * Erstellt Assignment mit status='requested' ohne Kapazitätsbelegung
 */
export const requestShift = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { shiftId, message } = data;

  if (!shiftId) {
    throw new functions.https.HttpsError('invalid-argument', 'shiftId is required');
  }

  try {
    return await db.runTransaction(async transaction => {
      const userId = context.auth!.uid;

      // 1. Shift-Daten laden
      const shiftRef = db.collection('shifts').doc(shiftId);
      const shiftDoc = await transaction.get(shiftRef);

      if (!shiftDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Shift not found');
      }

      const shift = shiftDoc.data()!;

      // 2. Prüfen ob Shift noch offen ist
      if (shift.status !== 'open') {
        throw new functions.https.HttpsError('failed-precondition', 'Shift is no longer available');
      }

      // 3. Prüfen ob User bereits eine Anfrage für diese Schicht hat
      const existingRequestQuery = db
        .collection('assignments')
        .where('userId', '==', userId)
        .where('shiftId', '==', shiftId)
        .where('status', '==', 'requested');

      const existingRequest = await transaction.get(existingRequestQuery);

      if (!existingRequest.empty) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'You have already requested this shift'
        );
      }

      // 4. User-Daten laden für Qualifikationsprüfung
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }

      const user = userDoc.data()!;

      // 5. Qualifikationsprüfung (optional, nur Warnung)
      const requiredSkills = shift.requiredSkills || [];
      const userQualifications = user.qualifications || [];
      const missingQualifications = requiredSkills.filter(
        (skill: string) => !userQualifications.includes(skill)
      );

      // 5.1 Zeitkonflikt-Prüfung
      const userAssignmentsQuery = db
        .collection('assignments')
        .where('userId', '==', userId)
        .where('status', 'in', ['assigned', 'accepted']);

      const userAssignments = await transaction.get(userAssignmentsQuery);
      const conflicts: any[] = [];

      for (const assignmentDoc of userAssignments.docs) {
        const assignment = assignmentDoc.data();
        const existingShiftRef = db.collection('shifts').doc(assignment.shiftId);
        const existingShiftDoc = await transaction.get(existingShiftRef);

        if (existingShiftDoc.exists) {
          const existingShift = existingShiftDoc.data()!;

          // Zeitüberschneidung prüfen
          if (checkTimeOverlap(shift, existingShift)) {
            conflicts.push({
              shiftId: existingShift.id,
              type: existingShift.type,
              date: existingShift.date,
              startTime: existingShift.startTime,
              endTime: existingShift.endTime,
            });
          }
        }
      }

      // 5.2 Pausenregel-Prüfung (11 Stunden zwischen Schichten)
      const breakRuleViolations: any[] = [];
      for (const conflict of conflicts) {
        const breakHours = calculateBreakHours(shift, conflict);
        if (breakHours < 11) {
          breakRuleViolations.push({
            ...conflict,
            breakHours: Math.round(breakHours * 10) / 10,
          });
        }
      }

      // 6. Assignment mit status='requested' erstellen
      // WICHTIG: companyId aus Shift holen, damit Frontend-Queries funktionieren
      // Fallback-Kette: Shift -> User -> User-Token (claims.companyId)
      const userToken = context.auth?.token as { companyId?: string; claims?: { companyId?: string } } | undefined;
      const tokenCompanyId = userToken?.companyId || userToken?.claims?.companyId;
      const shiftCompanyId = shift.companyId || user.companyId || tokenCompanyId;
      if (!shiftCompanyId) {
        functions.logger.error('No companyId found in requestShift', {
          shiftId,
          userId,
          shiftHasCompanyId: !!shift.companyId,
          userHasCompanyId: !!user.companyId,
          tokenHasCompanyId: !!tokenCompanyId,
          tokenKeys: userToken ? Object.keys(userToken) : [],
        });
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Shift, user, or token must have a companyId'
        );
      }

      const assignmentRef = db.collection('assignments').doc();
      const assignmentData = {
        userId,
        shiftId,
        companyId: shiftCompanyId, // WICHTIG: companyId für Mandantenisolation
        status: 'requested',
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        notes: message,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(assignmentRef, assignmentData);

      // 7. Admin-Notification (immer in notifications Collection für Admin)
      const adminNotificationRef = db.collection('notifications').doc();
      const adminNotificationData = {
        userId: shift.createdBy, // Admin der die Schicht erstellt hat
        companyId: shiftCompanyId, // WICHTIG: companyId für Mandantenisolation
        type: 'shift-requested',
        title: 'Neue Schichtanfrage',
        message: `${user.displayName || user.email} hat eine Anfrage für eine Schicht gesendet`,
        actionUrl: `/admin/einsaetze/${assignmentRef.id}`,
        read: false,
        important: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(adminNotificationRef, adminNotificationData);

      // 8. User-Notification (Bestätigung) - in richtige Collection basierend auf User-Rolle
      const userRole = user.role || 'nurse';
      const notificationCollection = userRole === 'nurse' ? 'employeeNotifications' : 'notifications';
      const userNotificationRef = db.collection(notificationCollection).doc();
      const userNotificationData = {
        userId,
        companyId: shiftCompanyId, // WICHTIG: companyId für Mandantenisolation
        type: 'shift-requested',
        title: 'Schichtanfrage gesendet',
        message: 'Deine Schichtanfrage wurde erfolgreich gesendet',
        actionUrl: '/employee/dienstplan',
        read: false,
        priority: 'normal',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(userNotificationRef, userNotificationData);

      // 9. Audit Log
      const auditLogRef = db.collection('auditLogs').doc();
      const auditData = {
        userId,
        companyId: shiftCompanyId, // WICHTIG: companyId für Mandantenisolation
        action: 'shift_requested',
        resourceType: 'assignment',
        resourceId: assignmentRef.id,
        changes: {
          status: { old: null, new: 'requested' },
          userId: { old: null, new: userId },
          shiftId: { old: null, new: shiftId },
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.set(auditLogRef, auditData);

      return {
        success: true,
        assignmentId: assignmentRef.id,
        message: 'Schichtanfrage erfolgreich gesendet',
        missingQualifications: missingQualifications.length > 0 ? missingQualifications : undefined,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
        breakRuleViolations: breakRuleViolations.length > 0 ? breakRuleViolations : undefined,
        warnings: [
          ...(missingQualifications.length > 0
            ? [`Fehlende Qualifikationen: ${missingQualifications.join(', ')}`]
            : []),
          ...(conflicts.length > 0
            ? [`Zeitkonflikte: ${conflicts.length} Überschneidungen gefunden`]
            : []),
          ...(breakRuleViolations.length > 0
            ? [
                `Pausenregel-Verletzungen: ${breakRuleViolations.length} Schichten mit weniger als 11h Pause`,
              ]
            : []),
        ],
      };
    });
  } catch (error) {
    console.error('Error in requestShift:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while requesting the shift'
    );
  }
});

// Helper functions
function checkTimeOverlap(shift1: any, shift2: any): boolean {
  const start1 = new Date(shift1.date).getTime() + timeToMs(shift1.startTime);
  const end1 = new Date(shift1.date).getTime() + timeToMs(shift1.endTime);
  const start2 = new Date(shift2.date).getTime() + timeToMs(shift2.startTime);
  const end2 = new Date(shift2.date).getTime() + timeToMs(shift2.endTime);

  return start1 < end2 && start2 < end1;
}

function timeToMs(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours * 60 + minutes) * 60 * 1000;
}

function calculateBreakHours(shift1: any, shift2: any): number {
  const end1 = new Date(shift1.date).getTime() + timeToMs(shift1.endTime);
  const start2 = new Date(shift2.date).getTime() + timeToMs(shift2.startTime);

  // Handle overnight shifts
  if (end1 > start2) {
    return (end1 - start2) / (1000 * 60 * 60);
  } else {
    return (start2 - end1) / (1000 * 60 * 60);
  }
}
