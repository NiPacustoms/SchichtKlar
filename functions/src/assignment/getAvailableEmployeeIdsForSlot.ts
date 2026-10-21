import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { getAvailableEmployeeIds } from './availability';
import { requireAdmin } from '../utils/tenant';
import { logger } from '../utils/logger';
import { REGION } from '../utils/region';

const db = admin.firestore();

export interface GetAvailableEmployeeIdsPayload {
  companyId: string;
  startDate: string; // ISO date (yyyy-MM-dd)
  startTime: string;
  endTime: string;
  qualification?: string;
}

/**
 * Gibt die User-IDs aller Mitarbeiter (nurse) der Firma zurück, die im
 * angegebenen Zeitraum verfügbar sind (keine Überlappung mit Einsätzen).
 */
export const getAvailableEmployeeIdsForSlot = functions.region(REGION).https.onCall(
  async (data: GetAvailableEmployeeIdsPayload, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const caller = await requireAdmin(context.auth);

    const { companyId, startDate, startTime, endTime, qualification } = data || {};
    if (!companyId || !startDate || !startTime || !endTime) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'companyId, startDate, startTime, endTime are required'
      );
    }

    if (companyId !== caller.companyId) {
      throw new functions.https.HttpsError('permission-denied', 'companyId mismatch');
    }

    try {
      const availableUserIds = await getAvailableEmployeeIds(
        db,
        companyId,
        startDate,
        startTime,
        endTime,
        qualification
      );
      return { availableUserIds };
    } catch (error) {
      logger.error('getAvailableEmployeeIdsForSlot error', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get available employees'
      );
    }
  }
);
