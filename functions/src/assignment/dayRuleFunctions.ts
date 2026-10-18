import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { assertSameCompany, getCaller } from '../utils/tenant';
import {
  dayRuleConflictError,
  findDayRuleConflicts,
  isDayRuleActiveStatus,
  isValidOverrideReason,
  resolveAssignmentDayKey,
  toDayKey,
  formatDayKeyDE,
} from '../utils/dayRule';

const db = admin.firestore();

/**
 * Annahme eines per Matching ausgeschriebenen Einsatzes (status 'published')
 * durch eine:n Kandidat:in.
 *
 * Vorher schrieb der Client direkt in Firestore – das scheiterte an den Rules
 * (userId war noch leer) und hätte zwei gleichzeitige Annahmen nicht verhindert.
 * Jetzt: Transaktion, Firmen- und Kandidatenprüfung, Regel „1 Einsatz pro Tag".
 */
export const acceptPublishedAssignment = functions.https.onCall(async (data, context) => {
  const caller = await getCaller(context.auth);
  const { assignmentId } = (data || {}) as { assignmentId?: string };
  if (!assignmentId) {
    throw new functions.https.HttpsError('invalid-argument', 'assignmentId is required');
  }

  return db.runTransaction(async tx => {
    const ref = db.collection('assignments').doc(assignmentId);
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'Einsatz nicht gefunden');
    }
    const a = snap.data()!;
    assertSameCompany(caller, a.companyId);

    if (a.status !== 'published' || a.userId) {
      throw new functions.https.HttpsError('failed-precondition', 'Dieser Einsatz ist bereits vergeben.');
    }
    const candidates = (a.candidateUserIds as string[] | undefined) ?? [];
    const declined = (a.declinedUserIds as string[] | undefined) ?? [];
    if (!candidates.includes(caller.uid) || declined.includes(caller.uid)) {
      throw new functions.https.HttpsError('permission-denied', 'Sie sind für diesen Einsatz nicht angefragt.');
    }

    const dayKey = await resolveAssignmentDayKey(db, a, tx);
    if (dayKey) {
      const sameDay = await findDayRuleConflicts(
        db,
        { userId: caller.uid, companyId: caller.companyId, dayKey, excludeAssignmentId: assignmentId },
        tx
      );
      if (sameDay.length > 0) throw dayRuleConflictError(dayKey, sameDay, false);
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    tx.update(ref, { userId: caller.uid, status: 'accepted', acceptedAt: now, updatedAt: now });
    tx.set(db.collection('auditLogs').doc(), {
      userId: caller.uid,
      companyId: caller.companyId,
      action: 'assignment_accepted',
      resourceType: 'assignment',
      resourceId: assignmentId,
      changes: { status: { old: 'published', new: 'accepted' }, userId: { old: null, new: caller.uid } },
      timestamp: now,
    });
    return { success: true };
  });
});

function relevantFingerprint(d: FirebaseFirestore.DocumentData | undefined): string {
  if (!d) return '';
  const date = toDayKey(d.startDate) ?? '';
  return [d.status, d.userId, d.shiftId, date].join('|');
}

/**
 * Sicherheitsnetz für die Regel „1 Einsatz pro Tag".
 *
 * Callables und Client prüfen die Regel bereits vor dem Schreiben. Da aber
 * noch Schreibpfade direkt aus dem Client existieren, prüft dieser Trigger jede
 * Änderung, durch die ein Einsatz für eine Person aktiv wird. Ein Verstoß ohne
 * dokumentierte Admin-Übersteuerung wird NICHT stillschweigend zurückgedreht
 * (das könnte laufende Abläufe zerreißen), sondern am Einsatz markiert
 * (dayRuleViolation) und den Admins der Firma gemeldet.
 */
export const enforceDayRule = onDocumentWritten(
  { document: 'assignments/{assignmentId}', region: 'europe-west1' },
  async event => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return;

    // Nur reagieren, wenn sich status/Person/Tag geändert hat – eigene Markierungs-Updates lösen nichts aus
    if (relevantFingerprint(before) === relevantFingerprint(after)) return;

    const assignmentId = event.params.assignmentId;
    const ref = db.collection('assignments').doc(assignmentId);

    const active = isDayRuleActiveStatus(after.status) && !!after.userId && !!after.companyId;
    const overridden = isValidOverrideReason(after.dayRuleOverride?.reason);

    if (!active || overridden) {
      if (after.dayRuleViolation) await ref.update({ dayRuleViolation: admin.firestore.FieldValue.delete() });
      return;
    }

    const dayKey = await resolveAssignmentDayKey(db, after);
    if (!dayKey) return;

    const sameDay = await findDayRuleConflicts(db, {
      userId: after.userId,
      companyId: after.companyId,
      dayKey,
      excludeAssignmentId: assignmentId,
    });

    if (sameDay.length === 0) {
      if (after.dayRuleViolation) await ref.update({ dayRuleViolation: admin.firestore.FieldValue.delete() });
      return;
    }

    logger.warn('Tagesregel verletzt', { assignmentId, userId: after.userId, dayKey, sameDay });
    await ref.update({
      dayRuleViolation: {
        dayKey,
        conflictingAssignmentIds: sameDay,
        detectedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    const admins = await db
      .collection('users')
      .where('companyId', '==', after.companyId)
      .where('role', '==', 'admin')
      .get();
    const batch = db.batch();
    for (const adminDoc of admins.docs) {
      batch.set(db.collection('notifications').doc(), {
        userId: adminDoc.id,
        companyId: after.companyId,
        type: 'day-rule-violation',
        title: 'Zwei Einsätze am selben Tag',
        message: `Für den ${formatDayKeyDE(dayKey)} sind für eine Person mehrere Einsätze aktiv. Bitte prüfen oder mit Begründung übersteuern.`,
        actionUrl: `/admin/einsaetze/${assignmentId}`,
        read: false,
        important: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
);
