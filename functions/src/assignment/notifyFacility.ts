import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { sendTemplatedEmail, renderFacilityAssignmentTakenEmail } from '../email';

const db = admin.firestore();

export interface NotifyFacilityPayload {
  assignmentId: string;
  employeeName: string;
  contact?: string; // z. B. Telefon
}

/**
 * Sendet E-Mail an die Einrichtung: "Max M. übernimmt Ihren Einsatz! Kontakt: …"
 * Nutzt ausschließlich Firebase (email.ts mit nodemailer/SMTP).
 */
export const notifyFacility = functions.https.onCall(async (data: NotifyFacilityPayload, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { assignmentId, employeeName, contact } = data || {};
  if (!assignmentId || !employeeName) {
    throw new functions.https.HttpsError('invalid-argument', 'assignmentId and employeeName are required');
  }

  const assignmentSnap = await db.collection('assignments').doc(assignmentId).get();
  if (!assignmentSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Assignment not found');
  }

  const assignment = assignmentSnap.data()!;
  const facilityId = assignment.facilityId as string | undefined;
  if (!facilityId) {
    throw new functions.https.HttpsError('failed-precondition', 'Assignment has no facilityId');
  }

  const facilitySnap = await db.collection('facilities').doc(facilityId).get();
  if (!facilitySnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Facility not found');
  }

  const facility = facilitySnap.data()!;
  const email = (facility.contactEmail || facility.email || facility.contacts?.[0]?.email) as string | undefined;
  if (!email) {
    return { success: false, message: 'No facility email configured' };
  }

  const facilityName = (facility.name as string) || 'Einrichtung';
  const startDate = assignment.startDate?.toDate?.();
  const startTime = assignment.startTime || '';
  const endTime = assignment.endTime || '';
  const dateStr = startDate ? startDate.toLocaleDateString('de-DE') : '';
  const timeStr = startTime && endTime ? `${startTime}–${endTime}` : '';

  const subject = `${employeeName} übernimmt Ihren Einsatz`;
  const html = renderFacilityAssignmentTakenEmail({
    employeeName,
    facilityName,
    dateStr,
    timeStr,
    contact,
  });

  const result = await sendTemplatedEmail({ to: email, subject, html });
  return { success: result.success, fallback: result.fallback };
});
