import { logger } from '@/lib/logging';

import { functions } from '@/lib/firebase';
import { AssignmentResult, DeclineAssignmentData } from '@/lib/types';
import { httpsCallable } from 'firebase/functions';
import { DayRuleConflictError, getDayRuleConflict } from '@/lib/domain/dayRule';

/**
 * Client-Wrapper für Cloud Functions der Schichtverwaltung
 * Bietet typisierte, benutzerfreundliche Schnittstelle zu den CFs
 */

// Helper function to get functions or throw
function getFunctionsOrThrow() {
  if (!functions) {
    throw new Error('Firebase Functions ist nicht initialisiert. Bitte überprüfe deine Firebase-Konfiguration.');
  }
  return functions;
}

// Cloud Function References - lazy initialization
const getAssignShiftCF = () => httpsCallable(getFunctionsOrThrow(), 'assignShift');
const getUnassignShiftCF = () => httpsCallable(getFunctionsOrThrow(), 'unassignShift');
const getDeclineAssignmentCF = () => httpsCallable(getFunctionsOrThrow(), 'declineAssignment');
const getAcceptPublishedCF = () => httpsCallable(getFunctionsOrThrow(), 'acceptPublishedAssignment');

/** Tagesregel-Konflikte aus Callables als typisierten Fehler weiterreichen (UI fragt dann nach Begründung). */
function rethrowDayRuleConflict(error: unknown): void {
  const conflict = getDayRuleConflict(error);
  if (conflict) {
    throw new DayRuleConflictError(conflict.dayKey ?? '', conflict.conflictingAssignmentIds);
  }
}

export const cloudFunctions = {
  /**
   * Schicht einem User zuweisen
   * @param shiftId Schicht-ID
   * @param userId User-ID
   * @param adminOverride Admin-Override für Qualifikations-/Zeitkonfliktprüfung
   * @param dayRuleOverrideReason Begründung, um die Regel „1 Einsatz pro Tag" zu übersteuern
   *   (adminOverride deckt diese Regel bewusst NICHT ab)
   * @returns AssignmentResult
   * @throws DayRuleConflictError wenn die Person an dem Tag schon eingeplant ist
   */
  async assignShiftToUser(
    shiftId: string,
    userId: string,
    adminOverride: boolean = false,
    dayRuleOverrideReason?: string
  ): Promise<AssignmentResult> {
    try {
      const result = await getAssignShiftCF()({ shiftId, userId, adminOverride, dayRuleOverrideReason });
      return result.data as AssignmentResult;
    } catch (error: unknown) {
      rethrowDayRuleConflict(error);

      // Benutzerfreundliche Fehlermeldungen
      if ((error as { code?: string; message?: string }).code === 'functions/failed-precondition') {
        const msg = (error as { message?: string }).message || '';
        if (msg.includes('Missing qualifications')) {
          throw new Error('Der Mitarbeiter erfüllt nicht alle erforderlichen Qualifikationen');
        }
        if (msg.includes('Time conflicts')) {
          throw new Error('Zeitkonflikt: Der Mitarbeiter hat bereits eine Schicht zu dieser Zeit');
        }
        if (msg.includes('Shift is already full')) {
          throw new Error('Die Schicht ist bereits voll besetzt');
        }
      }

      if ((error as { code?: string }).code === 'functions/permission-denied') {
        throw new Error('Keine Berechtigung für diese Aktion');
      }

      if ((error as { code?: string }).code === 'functions/not-found') {
        throw new Error('Schicht oder User nicht gefunden');
      }

      if ((error as { code?: string }).code === 'functions/internal') {
        // Log the full error for debugging
        logger.error('Internal error in assignShift:', error);
        throw new Error('Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.');
      }

      throw new Error((error as { message?: string }).message || 'Fehler bei der Schichtzuweisung');
    }
  },

  /**
   * Schichtzuweisung zurücknehmen
   * @param assignmentId Assignment-ID
   * @param reason Grund für Rücknahme
   * @returns Erfolgsmeldung
   */
  async unassignUser(
    assignmentId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await getUnassignShiftCF()({ assignmentId, reason });
      return result.data as { success: boolean; message: string };
    } catch (error: unknown) {

      if ((error as { code?: string }).code === 'functions/permission-denied') {
        throw new Error('Keine Berechtigung für diese Aktion');
      }

      if ((error as { code?: string }).code === 'functions/not-found') {
        throw new Error('Zuweisung nicht gefunden');
      }

      throw new Error((error as { message?: string }).message || 'Fehler beim Rücknehmen der Zuweisung');
    }
  },

  /**
   * Assignment ablehnen (mit Unterschrifts-Workflow)
   * @param data DeclineAssignmentData
   * @returns Ergebnis mit Unterschrifts-Status
   */
  async declineAssignment(data: DeclineAssignmentData): Promise<{
    success: boolean;
    message: string;
    requiresSignature: boolean;
    newStatus: string;
  }> {
    try {
      const result = await getDeclineAssignmentCF()(data);
      return result.data as {
        success: boolean; message: string; requiresSignature: boolean; newStatus: string
      };
    } catch (error: unknown) {

      if ((error as { code?: string }).code === 'functions/permission-denied') {
        throw new Error('Keine Berechtigung für diese Aktion');
      }

      if ((error as { code?: string }).code === 'functions/failed-precondition') {
        throw new Error('Assignment kann im aktuellen Status nicht abgelehnt werden');
      }

      throw new Error((error as { message?: string }).message || 'Fehler beim Ablehnen der Schicht');
    }
  },

  async runScheduledReportsNow(): Promise<{ success: boolean }> {
    const fn = httpsCallable(getFunctionsOrThrow(), 'runScheduledReportsNow');
    const result = await fn({});
    return result.data as { success: boolean };
  },

  async notifyFacilityForAssignment(payload: { assignmentId: string; employeeName: string; contact?: string }): Promise<{ success: boolean }> {
    const fn = httpsCallable(getFunctionsOrThrow(), 'notifyFacilityForAssignment');
    const result = await fn(payload);
    return result.data as { success: boolean };
  },

  async declineAssignmentWithSignature(payload: { assignmentId: string; reason: string; signatureDataUrl: string }): Promise<{ success: boolean }> {
    const fn = httpsCallable(getFunctionsOrThrow(), 'declineAssignmentWithSignature');
    const result = await fn(payload);
    return result.data as { success: boolean };
  },

  /**
   * Ausgeschriebenen Einsatz als Kandidat:in annehmen.
   * Läuft serverseitig als Transaktion (keine Doppelvergabe, Tagesregel geprüft).
   * @throws DayRuleConflictError wenn bereits ein Einsatz an dem Tag besteht
   */
  async acceptPublishedAssignment(assignmentId: string): Promise<void> {
    try {
      await getAcceptPublishedCF()({ assignmentId });
    } catch (error: unknown) {
      rethrowDayRuleConflict(error);
      throw new Error((error as { message?: string }).message || 'Einsatz konnte nicht angenommen werden');
    }
  },
};
