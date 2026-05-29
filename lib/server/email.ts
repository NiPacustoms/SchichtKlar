/**
 * Serverseitiger E-Mail-Versand.
 * Bevorzugt: Resend (direkt aus Next.js). Fallback: Firebase Cloud Function sendInvitationEmailHttp.
 *
 * Env: RESEND_API_KEY (für direkten Versand), optional RESEND_FROM.
 * Fallback Einladungen: FIREBASE_INVITATION_EMAIL_URL + INVITATION_EMAIL_SECRET.
 * Fallback: FIREBASE_INVITATION_EMAIL_URL + INVITATION_EMAIL_SECRET.
 */

import { logger } from '@/lib/logging';

export interface InviteEmailPayload {
  to: string;
  companyName: string;
  acceptLink: string;
}

const INVITE_HTML = (companyName: string, acceptLink: string) => `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
  <h2>Einladung zu JobFlow</h2>
  <p>Sie wurden von <strong>${companyName}</strong> eingeladen, JobFlow beizutreten.</p>
  <p>Bitte klicken Sie innerhalb von 24 Stunden auf den folgenden Link, um Ihr Konto zu erstellen:</p>
  <p>
    <a href="${acceptLink}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
      Einladung annehmen
    </a>
  </p>
  <p>Falls der Button nicht funktioniert, nutzen Sie diesen Link: <br/>
    <a href="${acceptLink}">${acceptLink}</a>
  </p>
  <p>Wenn Sie diese Einladung nicht erwartet haben, ignorieren Sie diese E-Mail.</p>
</div>`;

/**
 * Sendet die Einladungs-E-Mail.
 * Nutzt Resend (RESEND_API_KEY), falls gesetzt; sonst die Firebase HTTP Function.
 */
export async function sendInvitationEmailServer(
  payload: InviteEmailPayload
): Promise<{ sent: boolean; error?: string }> {
  const companyName = payload.companyName || 'Ihre Firma';
  const html = INVITE_HTML(companyName, payload.acceptLink);
  const text = [
    `Sie wurden von ${companyName} eingeladen, JobFlow zu nutzen.`,
    `Bitte öffnen Sie innerhalb von 24 Stunden folgenden Link: ${payload.acceptLink}`,
  ].join('\n\n');

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      const from = process.env.RESEND_FROM?.trim() || 'JobFlow <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from,
          to: payload.to,
          subject: 'Einladung zu JobFlow',
          html,
          text,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        logger.error(
          '[Email] Resend API Fehler',
          new Error(`${res.status}: ${errBody}`),
          { to: payload.to }
        );
        return { sent: false, error: `${res.status}: ${errBody}` };
      }

      logger.info('[Email] Einladung versendet (Resend)', {}, { to: payload.to });
      return { sent: true };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      logger.error('[Email] Resend-Versand fehlgeschlagen', err, { to: payload.to });
      return { sent: false, error: err.message };
    }
  }

  const url = process.env.FIREBASE_INVITATION_EMAIL_URL?.trim();
  const secret = process.env.INVITATION_EMAIL_SECRET?.trim();
  if (!url || !secret) {
    logger.warn(
      '[Email] Weder RESEND_API_KEY noch Firebase-Einladungs-URL/Secret gesetzt',
      {},
      { to: payload.to }
    );
    return { sent: false };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        to: payload.to,
        companyName,
        acceptLink: payload.acceptLink,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error('[Email] Firebase Function Fehler', new Error(`${res.status}: ${text}`), { to: payload.to });
      return { sent: false, error: `${res.status}: ${text}` };
    }

    const data = (await res.json().catch(() => ({}))) as { success?: boolean; fallback?: boolean };
    const sent = data?.success === true && data?.fallback !== true;
    if (sent) {
      logger.info('[Email] Einladung versendet (Firebase)', {}, { to: payload.to });
    } else {
      logger.warn('[Email] Einladung nicht versendet (Function/SMTP)', {}, { to: payload.to });
    }
    return { sent };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    logger.error('[Email] Einladungs-Versand fehlgeschlagen', err, { to: payload.to });
    return { sent: false, error: err.message };
  }
}

// ─── Gemeinsame Resend-Hilfsfunktion ─────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getResendFrom(): string {
  return process.env.RESEND_FROM?.trim() || 'AufAbruf <onboarding@resend.dev>';
}

async function resendFetch(body: Record<string, unknown>): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY nicht konfiguriert' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return { sent: false, error: `Resend ${res.status}: ${errBody}` };
  }
  return { sent: true };
}

/** Filtert CC-Adressen: nur gültige, eindeutige Adressen die nicht identisch mit `to` sind. */
export function sanitizeCc(cc: string[] | undefined, to: string): string[] {
  if (!Array.isArray(cc)) return [];
  const seen = new Set([to.trim().toLowerCase()]);
  return cc.filter(addr => {
    const key = addr.trim().toLowerCase();
    if (!EMAIL_REGEX.test(addr.trim()) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Einsatzmitteilung-Formular-Benachrichtigung ─────────────────────────────

export interface AssignmentFormEmailServerPayload {
  to: string;
  employeeName?: string;
  formLink: string;
  shiftInfo?: string;
}

function assignmentFormHtml(p: AssignmentFormEmailServerPayload): string {
  const greeting = p.employeeName ? `Hallo ${p.employeeName},` : 'Guten Tag,';
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <p>${greeting}</p>
      <p>Sie wurden für einen Dienst zugewiesen.${p.shiftInfo ? ` <strong>${p.shiftInfo}</strong>` : ''}</p>
      <p>Bitte bestätigen oder lehnen Sie den Einsatz über folgenden Link ab:</p>
      <p>
        <a href="${p.formLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
          Formular öffnen
        </a>
      </p>
      <p>Falls der Button nicht funktioniert, nutzen Sie diesen Link:<br/>
        <a href="${p.formLink}">${p.formLink}</a>
      </p>
      <p>Vielen Dank!</p>
    </div>`;
}

export async function sendAssignmentFormEmailServer(
  payload: AssignmentFormEmailServerPayload
): Promise<{ sent: boolean; error?: string }> {
  const { to, employeeName, formLink, shiftInfo } = payload;
  const html = assignmentFormHtml({ to, employeeName, formLink, shiftInfo });
  const text = [
    employeeName ? `Hallo ${employeeName},` : 'Guten Tag,',
    `Sie wurden für einen Dienst zugewiesen.${shiftInfo ? ` ${shiftInfo}` : ''}`,
    `Bitte öffnen Sie das Formular: ${formLink}`,
  ].join('\n\n');

  const result = await resendFetch({
    from: getResendFrom(),
    to,
    subject: 'Neuer Einsatz – Bitte Formular ausfüllen',
    html,
    text,
  });

  if (!result.sent) {
    logger.warn('[Email] AssignmentForm Resend fehlgeschlagen', {}, { to, error: result.error });
  } else {
    logger.info('[Email] AssignmentForm versendet', {}, { to });
  }
  return result;
}

// ─── PDF-Dokument per E-Mail ──────────────────────────────────────────────────

export interface DocumentEmailServerPayload {
  to: string;
  cc?: string[];
  subject: string;
  /** PDF als Base64-String */
  pdfBase64: string;
  fileName: string;
  bodyText?: string;
}

function documentEmailHtml(bodyText?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2>Dokument aus JobFlow</h2>
      <p>${bodyText || 'Anbei finden Sie das angeforderte Dokument als PDF-Anhang.'}</p>
      <p>Mit freundlichen Grüßen<br/>AufAbruf GmbH</p>
    </div>`;
}

export async function sendDocumentEmailServer(
  payload: DocumentEmailServerPayload
): Promise<{ sent: boolean; error?: string }> {
  const { to, cc, subject, pdfBase64, fileName, bodyText } = payload;
  const ccList = sanitizeCc(cc, to);

  const result = await resendFetch({
    from: getResendFrom(),
    to,
    ...(ccList.length ? { cc: ccList } : {}),
    subject,
    html: documentEmailHtml(bodyText),
    text: bodyText || 'Anbei finden Sie das angeforderte Dokument als PDF-Anhang.',
    attachments: [{ filename: fileName, content: pdfBase64 }],
  });

  if (!result.sent) {
    logger.warn('[Email] Dokument Resend fehlgeschlagen', {}, { to, subject, error: result.error });
  } else {
    logger.info('[Email] Dokument versendet', {}, { to, cc: ccList, subject });
  }
  return result;
}
