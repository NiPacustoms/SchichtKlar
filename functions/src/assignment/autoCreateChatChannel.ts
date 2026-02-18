import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

const db = admin.firestore();

export interface AutoCreateChatChannelPayload {
  assignmentId: string;
}

/**
 * Erstellt bei Annahme eines Einsatzes einen Chat-Channel: "Einsatz {Einrichtung} {Datum} - {MA-Name}".
 * Members: [employeeId, adminId]; System-Nachricht: "Einsatz zugewiesen! Kommunikation hier."
 */
export const autoCreateChatChannel = functions.https.onCall(async (data: AutoCreateChatChannelPayload, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { assignmentId } = data || {};
  if (!assignmentId) {
    throw new functions.https.HttpsError('invalid-argument', 'assignmentId is required');
  }

  const assignmentSnap = await db.collection('assignments').doc(assignmentId).get();
  if (!assignmentSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Assignment not found');
  }

  const assignment = assignmentSnap.data()!;
  const userId = assignment.userId as string | undefined;
  const createdBy = assignment.createdBy as string | undefined;
  const companyId = assignment.companyId as string | undefined;
  const facilityId = assignment.facilityId as string | undefined;

  if (!userId || !createdBy) {
    throw new functions.https.HttpsError('failed-precondition', 'Assignment must have userId and createdBy');
  }

  let facilityName = 'Einsatz';
  if (facilityId) {
    const facilitySnap = await db.collection('facilities').doc(facilityId).get();
    if (facilitySnap.exists) {
      facilityName = (facilitySnap.data()?.name as string) || facilityName;
    }
  }

  const userSnap = await db.collection('users').doc(userId).get();
  const employeeName = userSnap.exists ? ((userSnap.data()?.displayName as string) || userSnap.data()?.email) || 'Mitarbeiter' : 'Mitarbeiter';

  const startDate = assignment.startDate?.toDate?.();
  const dateStr = startDate ? startDate.toLocaleDateString('de-DE') : '';

  const channelName = `Einsatz ${facilityName} ${dateStr} - ${employeeName}`;
  const participants = [userId, createdBy];

  const channelRef = db.collection('chatChannels').doc();
  await channelRef.set({
    name: channelName,
    participants,
    type: 'direct',
    createdBy: context.auth.uid,
    companyId: companyId || null,
    assignmentId,
    archived: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const msgRef = channelRef.collection('messages').doc();
  await msgRef.set({
    senderId: 'system',
    text: 'Einsatz zugewiesen! Kommunikation hier.',
    type: 'system',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, channelId: channelRef.id };
});
