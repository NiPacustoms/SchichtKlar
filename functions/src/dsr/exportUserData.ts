import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { REGION } from '../utils/region';
import { getCaller } from '../utils/tenant';

if (!admin.apps.length) {
  admin.initializeApp();
}

/** Sammlungen mit personenbezogenen Daten (Feld → Person) */
export const DSR_COLLECTIONS: Array<{ name: string; field: string }> = [
  { name: 'assignments', field: 'userId' },
  { name: 'timesheets', field: 'userId' },
  { name: 'timesheetStatements', field: 'userId' },
  { name: 'absences', field: 'userId' },
  { name: 'documents', field: 'userId' },
  { name: 'notifications', field: 'userId' },
  { name: 'employeeNotifications', field: 'userId' },
  { name: 'messages', field: 'userId' },
];

/**
 * DSGVO Art. 15/20 – Datenauskunft. Eigene Daten darf jede Person abrufen,
 * Daten anderer Personen nur die Disposition (Admin) derselben Firma.
 */
export const exportUserData = functions.region(REGION).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  const caller = await getCaller(context.auth);
  const targetUid: string = typeof data?.uid === 'string' && data.uid ? data.uid : caller.uid;
  if (targetUid !== caller.uid && caller.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Nur die eigenen Daten können abgerufen werden.');
  }
  const companyId = caller.companyId;
  const db = admin.firestore();

  const result: Record<string, Array<{ id: string } & Record<string, unknown>>> = {};
  const userSnap = await db.collection('users').doc(targetUid).get();
  if (!userSnap.exists || userSnap.get('companyId') !== companyId) {
    throw new functions.https.HttpsError('not-found', 'Person nicht gefunden.');
  }
  result.users = [{ id: userSnap.id, ...userSnap.data() }];

  for (const c of DSR_COLLECTIONS) {
    const snap = await db.collection(c.name).where('companyId', '==', companyId).where(c.field, '==', targetUid).get();
    result[c.name] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  return { uid: targetUid, companyId, exportedAt: new Date().toISOString(), data: result };
});
