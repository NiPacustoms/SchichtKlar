import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { logger } from '../utils/logger';
import { sendUserPushNotification } from '../pushNotifications';

const db = admin.firestore();
const storage = admin.storage();

export interface DeclineWithSignaturePayload {
  assignmentId: string;
  reason: string;
  signatureDataUrl: string; // data:image/png;base64,...
}

const DECLINE_REASONS: Record<string, string> = {
  'not_available': 'Nicht verfügbar',
  'other_assignment': 'Anderer Einsatz',
  'too_far': 'Zu weit',
};

/**
 * Mitarbeiter lehnt einen published-Einsatz ab: Grund + Canvas-Signatur.
 * Speichert in declines-Array und Subcollection, optional PDF; benachrichtigt nächsten Kandidaten per FCM.
 */
export const declineWithSignature = functions.https.onCall(async (data: DeclineWithSignaturePayload, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const uid = context.auth.uid;
  const { assignmentId, reason, signatureDataUrl } = data || {};

  if (!assignmentId || !reason) {
    throw new functions.https.HttpsError('invalid-argument', 'assignmentId and reason are required');
  }

  const assignmentRef = db.collection('assignments').doc(assignmentId);
  const assignmentSnap = await assignmentRef.get();
  if (!assignmentSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Assignment not found');
  }

  const assignment = assignmentSnap.data()!;
  const candidateUserIds = (assignment.candidateUserIds as string[]) || [];
  const declinedUserIds = (assignment.declinedUserIds as string[]) || [];
  const declines = (assignment.declines as Array<{ employeeId: string; reason: string; signatureUrl?: string; pdfUrl?: string; timestamp: admin.firestore.Timestamp }>) || [];

  const isCandidate = candidateUserIds.includes(uid);
  const isAssigned = assignment.userId === uid;
  if (!isCandidate && !isAssigned) {
    throw new functions.https.HttpsError('permission-denied', 'Only assigned or candidate users can decline');
  }

  if (!['published', 'assigned', 'accepted', 'requested', 'pending'].includes(assignment.status)) {
    throw new functions.https.HttpsError('failed-precondition', 'Assignment cannot be declined in current status');
  }

  const reasonLabel = DECLINE_REASONS[reason] || reason;
  let signatureUrl: string | null = null;

  if (signatureDataUrl && signatureDataUrl.startsWith('data:')) {
    try {
      const bucket = storage.bucket();
      const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const path = `assignments/${assignmentId}/declines/${uid}_signature.png`;
      const file = bucket.file(path);
      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
      });
      signatureUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
    } catch (e) {
      logger.warn('Failed to store signature image', e);
    }
  }

  const declineEntry = {
    employeeId: uid,
    reason: reasonLabel,
    signatureUrl: signatureUrl || undefined,
    pdfUrl: undefined as string | undefined,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  const newDeclinedUserIds = declinedUserIds.includes(uid) ? declinedUserIds : [...declinedUserIds, uid];
  const newDeclines = [...declines, declineEntry];

  await assignmentRef.update({
    declinedUserIds: newDeclinedUserIds,
    declines: newDeclines,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Nur signatureUrl speichern – keine Data-URL (Base64), um Firestore-Dokumentgröße (< 1 MB) nicht zu überschreiten
  await db.collection('assignments').doc(assignmentId).collection('declines').doc(uid).set({
    reason: reasonLabel,
    signatureUrl: signatureUrl || null,
    pdfUrl: null,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Nächsten Kandidaten benachrichtigen (noch nicht abgelehnt)
  const nextCandidateId = candidateUserIds.find(id => !newDeclinedUserIds.includes(id));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
  const link = `${appUrl}/employee/einsaetze/${assignmentId}`;

  if (nextCandidateId) {
    await sendUserPushNotification({
      userId: nextCandidateId,
      title: 'Einsatz-Anfrage',
      body: 'Sie sind als Nächste/r für einen Einsatz vorgesehen.',
      data: { assignmentId, type: 'assignment_next_candidate' },
      link,
      notificationType: 'assignment_next_candidate',
    });
  }

  // Admin-Benachrichtigung
  const facilityId = assignment.facilityId;
  let facilityName = 'Einsatz';
  if (facilityId) {
    const facilitySnap = await db.collection('facilities').doc(facilityId).get();
    if (facilitySnap.exists) {
      facilityName = (facilitySnap.data()?.name as string) || facilityName;
    }
  }
  const createdBy = assignment.createdBy as string | undefined;
  if (createdBy) {
    await db.collection('notifications').add({
      userId: createdBy,
      type: 'assignment_declined',
      title: 'Einsatz abgelehnt',
      message: `Ein Mitarbeiter hat den Einsatz (${facilityName}) abgelehnt. Grund: ${reasonLabel}`,
      actionUrl: `/admin/einsaetze`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {
    success: true,
    nextCandidateNotified: !!nextCandidateId,
  };
});
