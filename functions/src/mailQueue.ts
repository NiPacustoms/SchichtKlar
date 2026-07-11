import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

/**
 * Mail-Queue nach dem Firebase-Muster "Trigger Email from Firestore":
 * Ein Dokument in der Collection `mail` anlegen → dieser Trigger versendet
 * die E-Mail über die zentrale Provider-Kette (Resend → SMTP) und schreibt
 * den Zustellstatus in `delivery` zurück.
 *
 * Vorteile gegenüber direktem Versand:
 * - Jeder Server-Codepfad (default- und scheduled-Codebase, Next.js-API mit
 *   Admin SDK) kann Mails verschicken, ohne nodemailer/Resend zu bündeln.
 * - Zustellstatus und Fehler sind in Firestore nachvollziehbar.
 * - Erneuter Versand durch Setzen von `delivery.state = 'RETRY'`.
 *
 * Die Collection ist per Firestore Rules für Clients gesperrt; nur das
 * Admin SDK (Cloud Functions / Server) darf schreiben.
 */

export const MAIL_COLLECTION = 'mail';

export type MailDeliveryState = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'RETRY';

export interface MailQueuePayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
}

/** Legt eine Mail in der Queue ab; der Firestore-Trigger übernimmt den Versand. */
export async function enqueueMail(payload: MailQueuePayload): Promise<string> {
  const ref = await admin.firestore().collection(MAIL_COLLECTION).add({
    ...payload,
    delivery: {
      state: 'PENDING',
      attempts: 0,
      error: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  });
  return ref.id;
}

async function deliverMailDocument(snap: FirebaseFirestore.DocumentSnapshot): Promise<void> {
  const data = snap.data() as
    | (MailQueuePayload & { delivery?: { state?: MailDeliveryState; attempts?: number } })
    | undefined;
  if (!data) return;

  const state = data.delivery?.state;
  if (state && state !== 'PENDING' && state !== 'RETRY') return;

  const attempts = (data.delivery?.attempts ?? 0) + 1;
  await snap.ref.update({
    'delivery.state': 'PROCESSING',
    'delivery.attempts': attempts,
    'delivery.startTime': admin.firestore.FieldValue.serverTimestamp(),
  });

  if (!data.to || !data.subject || (!data.html && !data.text)) {
    await snap.ref.update({
      'delivery.state': 'ERROR',
      'delivery.error': 'Pflichtfelder fehlen (to, subject und html oder text)',
      'delivery.endTime': admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  try {
    // Lazy import, damit nodemailer/resend nicht beim Deploy-Discovery geladen werden
    const { sendTemplatedEmail } = await import('./email');
    const result = await sendTemplatedEmail({
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      headers: data.headers,
    });

    await snap.ref.update({
      'delivery.state': result.success ? 'SUCCESS' : 'ERROR',
      'delivery.provider': result.provider ?? null,
      'delivery.error': result.success
        ? null
        : result.error ?? 'Kein E-Mail-Provider konfiguriert (RESEND_API_KEY oder SMTP_* setzen)',
      'delivery.endTime': admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('[MailQueue] Versand fehlgeschlagen', { mailId: snap.id }, e);
    await snap.ref.update({
      'delivery.state': 'ERROR',
      'delivery.error': e instanceof Error ? e.message : String(e),
      'delivery.endTime': admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

export const processMailQueue = functions.firestore
  .document(`${MAIL_COLLECTION}/{mailId}`)
  .onCreate(async (snap) => {
    await deliverMailDocument(snap);
  });

export const retryMailQueue = functions.firestore
  .document(`${MAIL_COLLECTION}/{mailId}`)
  .onUpdate(async (change) => {
    const before = (change.before.data()?.delivery as { state?: MailDeliveryState } | undefined)?.state;
    const after = (change.after.data()?.delivery as { state?: MailDeliveryState } | undefined)?.state;
    if (before !== 'RETRY' && after === 'RETRY') {
      await deliverMailDocument(change.after);
    }
  });
