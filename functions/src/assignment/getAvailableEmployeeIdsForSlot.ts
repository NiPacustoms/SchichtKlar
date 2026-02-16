import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { getAvailableEmployeeIds } from './availability';
import { logger } from '../utils/logger';

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
export const getAvailableEmployeeIdsForSlot = functions.https.onCall(
  async (data: GetAvailableEmployeeIdsPayload, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userClaims = context.auth.token as { role?: string };
    if (userClaims.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can query available employees'
      );
    }

    const { companyId, startDate, startTime, endTime, qualification } = data || {};
    if (!companyId || !startDate || !startTime || !endTime) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'companyId, startDate, startTime, endTime are required'
      );
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
