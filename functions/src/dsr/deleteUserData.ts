import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { REGION } from '../utils/region';
import { getCaller } from '../utils/tenant';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Nachweise mit gesetzlicher Aufbewahrungspflicht (MiLoG § 17: 2 Jahre,
 * AO/HGB für lohnrelevante Unterlagen bis zu 10 Jahre). Diese werden auch bei
 * einer Löschanfrage nicht gelöscht, sondern nur gesperrt (Art. 17 Abs. 3 b DSGVO).
 */
export const RETAINED_COLLECTIONS = ['timesheets', 'timesheetStatements', 'absences', 'assignments'];
const ERASABLE_COLLECTIONS = ['documents', 'notifications', 'employeeNotifications', 'messages'];

/**
 * DSGVO Art. 17 – Löschung. Eigene Daten: Person selbst; andere Personen: nur
 * die Disposition (Admin) derselben Firma. Endgültiges Löschen (hardDelete)
 * nur durch Admins – Aufbewahrungspflichtiges bleibt gesperrt erhalten.
 */
export const deleteUserData = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const caller = await getCaller(context.auth);
  const targetUid: string = typeof data?.uid === 'string' && data.uid ? data.uid : caller.uid;
  const hardDelete = !!data?.hardDelete;
  if (targetUid !== caller.uid && !caller.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Nur die eigenen Daten können gelöscht werden.');
  }
  if (hardDelete && !caller.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Endgültiges Löschen nur durch die Disposition.');
  }
  if (hardDelete && targetUid === caller.uid) {
    throw new functions.https.HttpsError('failed-precondition', 'Das eigene Admin-Konto kann nicht endgültig gelöscht werden.');
  }
  const companyId = caller.companyId;
  const db = admin.firestore();

  const userRef = db.collection('users').doc(targetUid);
  const userSnap = await userRef.get();
  if (!userSnap.exists || userSnap.get('companyId') !== companyId) {
    throw new functions.https.HttpsError('not-found', 'Person nicht gefunden.');
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const ops: Array<(b: FirebaseFirestore.WriteBatch) => void> = [];

  // Personenstammdaten: Kontaktdaten entfernen, Konto sperren. Name/Personalnummer
  // bleiben für aufbewahrungspflichtige Nachweise (Zuordnung) erhalten.
  ops.push(b =>
    b.update(userRef, {
      deleted: true,
      active: false,
      email: admin.firestore.FieldValue.delete(),
      phone: admin.firestore.FieldValue.delete(),
      address: admin.firestore.FieldValue.delete(),
      contact: admin.firestore.FieldValue.delete(),
      emergencyContact: admin.firestore.FieldValue.delete(),
      bankAccount: admin.firestore.FieldValue.delete(),
      driversLicense: admin.firestore.FieldValue.delete(),
      deletionRequestedAt: now,
      deletionRequestedBy: caller.uid,
      updatedAt: now,
    })
  );

  const counts: Record<string, number> = {};
  for (const name of [...ERASABLE_COLLECTIONS, ...RETAINED_COLLECTIONS]) {
    const snap = await db.collection(name).where('companyId', '==', companyId).where('userId', '==', targetUid).get();
    counts[name] = snap.size;
    const retained = RETAINED_COLLECTIONS.includes(name);
    for (const d of snap.docs) {
      if (hardDelete && !retained) ops.push(b => b.delete(d.ref));
      else ops.push(b => b.update(d.ref, { deleted: true, legalHold: retained, updatedAt: now }));
    }
  }

  // Firestore-Batches sind auf 500 Schreibvorgänge begrenzt
  for (let i = 0; i < ops.length; i += 450) {
    const batch = db.batch();
    ops.slice(i, i + 450).forEach(op => op(batch));
    await batch.commit();
  }

  // Anmeldung sperren (hardDelete: Konto entfernen)
  try {
    if (hardDelete) await admin.auth().deleteUser(targetUid);
    else await admin.auth().updateUser(targetUid, { disabled: true });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code !== 'auth/user-not-found') functions.logger.error('Auth-Konto konnte nicht gesperrt/gelöscht werden', { targetUid, code });
  }

  return {
    uid: targetUid,
    companyId,
    hardDelete,
    retained: RETAINED_COLLECTIONS.filter(n => counts[n] > 0),
    counts,
    deletedAt: new Date().toISOString(),
  };
});
