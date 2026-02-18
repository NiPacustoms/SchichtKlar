import * as admin from 'firebase-admin';

export async function sendFormReminderEmails(): Promise<void> {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const assignmentsSnap = await db.collection('assignments')
    .where('assignedAt', '<=', twentyFourHoursAgo)
    .get();

  for (const doc of assignmentsSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const formDone = data.formStatus === 'acknowledged' || data.formStatus === 'declined';

    const shiftDoc = await db.collection('shifts').doc(data.shiftId as string).get();
    const shift = shiftDoc.exists ? (shiftDoc.data() as Record<string, unknown>) : null;
    const shiftDate = shift?.date as admin.firestore.Timestamp | undefined;
    const dateStr = shiftDate?.toDate ? shiftDate.toDate().toISOString().slice(0,10) : undefined;
    const dailySignatures = Array.isArray(data.dailySignatures) ? data.dailySignatures : [];
    const dailySigned = dateStr ? dailySignatures.some((s: Record<string, unknown>) => s.date === dateStr) : false;

    if (!formDone || !dailySigned) {
      const userDoc = await db.collection('users').doc(data.userId as string).get();
      const user = userDoc.exists ? (userDoc.data() as Record<string, unknown>) : null;
      const email = user?.email;
      const formLink = `${process.env.PUBLIC_APP_URL || 'https://app.example.com'}/employee/formulare/einsaetze/${doc.id}`;
      console.log('[ReminderEmail]', { to: email, formLink, assignmentId: doc.id, missingDailySignature: !dailySigned, formNotDone: !formDone });
    }
  }
}
