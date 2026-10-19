/**
 * Cloud Function zum Schutz von approved/submitted Timesheets
 * Zusätzliche Sicherheitsebene für GoBD-Konformität
 * Wird als Firestore Trigger ausgeführt, wenn ein Timesheet aktualisiert wird
 */

import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

const db = admin.firestore();

/**
 * Firestore Trigger: Wird ausgeführt, wenn ein Timesheet aktualisiert wird
 * Prüft, ob approved/submitted Timesheets geändert werden sollen
 * Falls ja: Änderung rückgängig machen und Audit-Log erstellen
 */
export const protectApprovedTimesheets = onDocumentUpdated(
  {
    document: 'timesheets/{timesheetId}',
    region: 'europe-west1',
  },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      return;
    }

    const timesheetId = event.params.timesheetId;
    const beforeStatus = beforeData.status;
    const afterStatus = afterData.status;

    // Nur freigegebene Zeiten sind unveränderlich. Eingereichte darf die
    // Disposition korrigieren (Firestore-Regeln prüfen Rolle und Firma).
    if (beforeStatus === 'approved' && beforeStatus === afterStatus) {
      // Die Zuschlags-Aufteilung schreibt nur der Server-Trigger
      // computeTimesheetBreakdown (erkennbar am geänderten breakdownKey) –
      // sie ändert keine erfassten Zeiten und wird nicht zurückgesetzt.
      const breakdownByServer = beforeData.breakdownKey !== afterData.breakdownKey;
      const protectedFields = breakdownByServer
        ? ['startTime', 'endTime', 'breakMinutes', 'totalHours', 'date']
        : ['startTime', 'endTime', 'breakMinutes', 'totalHours', 'date', 'nightHours', 'weekendHours', 'holidayHours', 'overtimeHours', 'regularHours'];

      // Werte vergleichen, nicht Objekt-Identität (Timestamp !== Timestamp wäre immer „geändert“)
      const norm = (v: unknown): unknown => {
        if (v && typeof v === 'object' && typeof (v as { toMillis?: () => number }).toMillis === 'function') {
          return (v as { toMillis: () => number }).toMillis();
        }
        return v ?? null;
      };

      let hasProtectedFieldChanged = false;
      const changedFields: Record<string, { old: unknown; new: unknown }> = {};

      for (const field of protectedFields) {
        if (JSON.stringify(norm(beforeData[field])) !== JSON.stringify(norm(afterData[field]))) {
          hasProtectedFieldChanged = true;
          changedFields[field] = { old: norm(beforeData[field]), new: norm(afterData[field]) };
        }
      }

      if (hasProtectedFieldChanged) {
        // KRITISCH: Versuch, ein approved/submitted Timesheet zu ändern
        logger.error('Attempt to modify approved/submitted timesheet detected', {
          timesheetId,
          userId: afterData.userId,
          changedFields: Object.keys(changedFields),
        });

        // Erstelle Audit-Log
        await db.collection('auditLogs').add({
          userId: afterData.userId || 'unknown',
          action: 'timesheet_modification_blocked',
          resourceType: 'timesheet',
          resourceId: timesheetId,
          severity: 'critical',
          message: 'Versuch, ein approved/submitted Timesheet zu ändern (GoBD-Verstoß verhindert)',
          changes: changedFields,
          beforeStatus,
          afterStatus,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Stelle ursprüngliche Werte wieder her
        // WICHTIG: Dies ist eine zusätzliche Sicherheitsebene
        // Die Firestore Rules sollten dies bereits verhindern
        try {
          const restoreData: Record<string, any> = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          for (const field of Object.keys(changedFields)) {
            // fehlte das Feld vorher, wird es wieder entfernt
            restoreData[field] = beforeData[field] === undefined ? admin.firestore.FieldValue.delete() : beforeData[field];
          }

          await db.collection('timesheets').doc(timesheetId).update(restoreData);

          logger.info('Approved timesheet restored to original values', {
            timesheetId,
            restoredFields: Object.keys(restoreData),
          });
        } catch (error) {
          logger.error('Error restoring approved timesheet', {
            timesheetId,
            error: error instanceof Error ? error.message : 'unknown',
          });
        }
      }
    }
  }
);

