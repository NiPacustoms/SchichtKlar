import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions/v1';
import { requireAdmin } from '../utils/tenant';
import { logger } from '../utils/logger';
import { parseShiftToUTC } from '../utils/timeUtils';
import { sendUserPushNotification } from '../pushNotifications';
import { isUserAvailableForSlot } from './availability';
import { REGION } from '../utils/region';

const db = admin.firestore();

export interface CreateWithMatchingPayload {
  facilityId: string;
  companyId: string;
  startDate: string; // ISO date
  startTime: string;
  endTime: string;
  qualification?: string;
  /** Zu arbeitende Stunden (optional). */
  hours?: number;
  /** Von der Disposition ausgewählte Pflegekräfte (Pflicht). */
  selectedUserIds?: string[];
}

/**
 * Schreibt einen Einsatz (Status published) für die von der Disposition
 * ausgewählten Pflegekräfte aus und benachrichtigt sie per Push.
 */
export const createWithMatching = functions.region(REGION).https.onCall(async (data: CreateWithMatchingPayload, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userClaims = context.auth.token as { role?: string };
  if (userClaims.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create assignments');
  }

  const { facilityId, companyId, startDate, startTime, endTime, qualification, hours, selectedUserIds } = data || {};

  if (!facilityId || !companyId || !startDate || !startTime || !endTime) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'facilityId, companyId, startDate, startTime, endTime are required'
    );
  }

  // Mandantenisolation: Die übergebene companyId muss der des aufrufenden Admins
  // entsprechen (kein Anlegen in fremden Mandanten bei Direktaufruf der Function).
  const caller = await requireAdmin(context.auth);
  if (companyId !== caller.companyId) {
    throw new functions.https.HttpsError('permission-denied', 'companyId mismatch');
  }

  try {
    const date = new Date(startDate);
    const { startUTC, endUTC } = parseShiftToUTC(date, startTime, endTime, 'Europe/Berlin');

    // Facility laden (für Namen)
    const facilitySnap = await db.collection('facilities').doc(facilityId).get();
    if (!facilitySnap.exists || facilitySnap.get('companyId') !== companyId) {
      throw new functions.https.HttpsError('permission-denied', 'Einrichtung gehört nicht zu Ihrer Firma');
    }
    const facilityName = (facilitySnap.data()?.name as string) || 'Einrichtung';

    // Assignment anlegen (published, ohne userId)
    const assignmentRef = db.collection('assignments').doc();
    const assignmentData = {
      facilityId,
      companyId,
      createdBy: context.auth.uid,
      startDate: Timestamp.fromDate(date),
      startTime,
      endTime,
      qualification: qualification || null,
      hours: hours ?? null,
      status: 'published',
      candidateUserIds: [] as string[],
      declinedUserIds: [] as string[],
      declines: [] as unknown[],
      assignedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Die Disposition wählt die Kräfte selbst aus (keine automatische Kandidatensuche).
    const wanted = [...new Set((selectedUserIds ?? []).filter((u): u is string => typeof u === 'string' && !!u))].slice(0, 50);
    if (wanted.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Bitte mindestens eine Pflegekraft auswählen.');
    }
    const blocked: string[] = [];
    const candidateUserIds: string[] = [];
    for (const uid of wanted) {
      const u = await db.collection('users').doc(uid).get();
      if (!u.exists || u.get('companyId') !== companyId || u.get('role') !== 'nurse') {
        throw new functions.https.HttpsError('permission-denied', 'Person gehört nicht zu Ihrer Firma');
      }
      // Überschneidung + Regel „1 Einsatz pro Tag" (zentral in availability.ts)
      if (await isUserAvailableForSlot(db, uid, startUTC, endUTC, companyId)) candidateUserIds.push(uid);
      else blocked.push((u.get('displayName') as string) || (u.get('email') as string) || uid);
    }
    if (blocked.length > 0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Nicht verfügbar (anderer Einsatz am Tag oder Überschneidung): ${blocked.join(', ')}`,
        { code: 'UNAVAILABLE', blocked }
      );
    }

    await assignmentRef.set({
      ...assignmentData,
      candidateUserIds,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
    const link = `${appUrl}/employee/einsaetze/${assignmentRef.id}`;

    for (const userId of candidateUserIds) {
      await sendUserPushNotification({
        userId,
        title: 'Neuer Einsatz',
        body: `${facilityName} am ${date.toLocaleDateString('de-DE')} – ${startTime}–${endTime}`,
        data: { assignmentId: assignmentRef.id, type: 'assignment_published' },
        link,
        notificationType: 'assignment_published',
      });
    }

    return {
      success: true,
      assignmentId: assignmentRef.id,
      candidateUserIds,
      candidateCount: candidateUserIds.length,
    };
  } catch (error) {
    logger.error('createWithMatching error', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to create assignment with matching');
  }
});
