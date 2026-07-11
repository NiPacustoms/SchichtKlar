import * as admin from 'firebase-admin';

interface ReminderEmailInput {
  employeeName?: string;
  formLink: string;
  missingDailySignature: boolean;
  formNotDone: boolean;
}

function renderReminderEmailHtml(input: ReminderEmailInput): string {
  const greeting = input.employeeName ? `Hallo ${input.employeeName},` : 'Guten Tag,';
  const reasons = [
    input.formNotDone ? 'die Einsatzmitteilung ist noch nicht bestätigt' : '',
    input.missingDailySignature ? 'die tägliche Unterschrift fehlt' : '',
  ].filter(Boolean).join(' und ');
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2>Erinnerung: Einsatz-Formular ausfüllen</h2>
      <p>${greeting}</p>
      <p>Für Ihren Einsatz ${reasons ? `ist noch etwas offen: ${reasons}.` : 'ist noch ein Formular offen.'}</p>
      <p>Bitte füllen Sie das Formular über folgenden Link aus:</p>
      <p>
        <a href="${input.formLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
          Formular öffnen
        </a>
      </p>
      <p>Falls der Button nicht funktioniert, nutzen Sie diesen Link: <br/>
        <a href="${input.formLink}">${input.formLink}</a>
      </p>
      <p>Vielen Dank!</p>
    </div>
  `;
}

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
      const email = typeof user?.email === 'string' ? user.email : undefined;
      const formLink = `${process.env.PUBLIC_APP_URL || 'https://app.example.com'}/employee/formulare/einsaetze/${doc.id}`;

      if (!email) {
        console.warn('[ReminderEmail] Keine E-Mail-Adresse für User', { userId: data.userId, assignmentId: doc.id });
        continue;
      }

      const html = renderReminderEmailHtml({
        employeeName: typeof user?.displayName === 'string' ? user.displayName : undefined,
        formLink,
        missingDailySignature: !dailySigned,
        formNotDone: !formDone,
      });

      // Mail in die Queue legen; der Firestore-Trigger `processMailQueue`
      // (default-Codebase) übernimmt den Versand. Deterministische ID
      // verhindert Duplikate, wenn der Job mehrfach am selben Tag läuft.
      const today = new Date().toISOString().slice(0, 10);
      const mailId = `formReminder_${doc.id}_${today}`;
      try {
        await db.collection('mail').doc(mailId).create({
          to: email,
          subject: 'Erinnerung: Einsatz-Formular ausfüllen',
          html,
          text: `Bitte füllen Sie das Einsatz-Formular aus: ${formLink}`,
          delivery: {
            state: 'PENDING',
            attempts: 0,
            error: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        });
        console.log('[ReminderEmail] eingereiht', { to: email, assignmentId: doc.id, mailId });
      } catch (e) {
        const code = (e as { code?: number }).code;
        if (code === 6) {
          // ALREADY_EXISTS: Erinnerung für heute wurde bereits eingereiht
          continue;
        }
        console.error('[ReminderEmail] Einreihen fehlgeschlagen', { assignmentId: doc.id }, e);
      }
    }
  }
}
