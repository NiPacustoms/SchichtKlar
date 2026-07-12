/**
 * Serverseitiger E-Mail-Versand für Einladungen.
 * Bevorzugt: Resend (direkt aus Next.js). Fallback: Firebase Cloud Function sendInvitationEmailHttp.
 *
 * Env: RESEND_API_KEY (für direkten Versand), optional RESEND_FROM.
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
  <h2>Einladung zu Schichtklar</h2>
  <p>Sie wurden von <strong>${companyName}</strong> eingeladen, Schichtklar beizutreten.</p>
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
    `Sie wurden von ${companyName} eingeladen, Schichtklar zu nutzen.`,
    `Bitte öffnen Sie innerhalb von 24 Stunden folgenden Link: ${payload.acceptLink}`,
  ].join('\n\n');

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      const from = process.env.RESEND_FROM?.trim() || 'Schichtklar <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from,
          to: payload.to,
          subject: 'Einladung zu Schichtklar',
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
