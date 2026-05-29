// E-Mail-Versand-Adapter (Client).
// Alle Mails laufen über Next.js API-Routen (app/api/email/*) mit Resend.
//
// Hinweis: Einladungs-E-Mails laufen über /api/invitations (lib/server/email.ts),
// daher gibt es hier bewusst keine Client-Funktion dafür.

import { logger } from '@/lib/logging';

// Assignment-Formular-Mail
export interface AssignmentFormEmailPayload {
  to: string;
  cc?: string[];
  employeeName?: string;
  formLink: string;
  shiftInfo?: string;
}

export async function sendAssignmentFormEmail(payload: AssignmentFormEmailPayload): Promise<void> {
  if (typeof window === 'undefined') {
    logger.warn('[Email] sendAssignmentFormEmail server-side – übersprungen', {}, { to: payload.to });
    return;
  }
  try {
    const { auth } = await import('@/lib/firebase');
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error('Kein Auth-Token');

    const res = await fetch('/api/email/send-assignment-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }
  } catch (e) {
    logger.warn('[Email:FALLBACK] Assignment Form', {}, { to: payload.to, error: String(e) });
  }
}

// Assignment-Signaturen-E-Mail
export interface AssignmentSignatureEmailPayload {
  to: string;
  employeeName: string;
  assignmentId: string;
  pdfUrl: string;
  facilityName?: string;
  shiftDate?: string;
  recipientType: 'employee' | 'admin' | 'facility';
}

export function renderAssignmentSignatureEmailHtml(payload: AssignmentSignatureEmailPayload): string {
  const greeting = payload.employeeName ? `Hallo ${payload.employeeName},` : 'Guten Tag,';
  const recipientText = 
    payload.recipientType === 'employee' 
      ? 'Ihre Zeiterfassung mit allen Unterschriften wurde erfolgreich erstellt.'
      : payload.recipientType === 'admin'
      ? `Die Zeiterfassung für ${payload.employeeName} mit allen Unterschriften wurde erfolgreich erstellt.`
      : `Die Zeiterfassung für ${payload.employeeName} wurde erfolgreich abgeschlossen.`;

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2>Zeiterfassung mit Unterschriften</h2>
      <p>${greeting}</p>
      <p>${recipientText}</p>
      ${payload.facilityName ? `<p><strong>Einrichtung:</strong> ${payload.facilityName}</p>` : ''}
      ${payload.shiftDate ? `<p><strong>Datum:</strong> ${payload.shiftDate}</p>` : ''}
      <p>Das PDF-Dokument mit allen Unterschriften steht zum Download bereit:</p>
      <p>
        <a href="${payload.pdfUrl}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
          PDF herunterladen
        </a>
      </p>
      <p>Falls der Button nicht funktioniert, nutzen Sie diesen Link: <br/>
        <a href="${payload.pdfUrl}">${payload.pdfUrl}</a>
      </p>
      <p>Vielen Dank!</p>
    </div>
  `;
}

// PDF-Dokument per E-Mail versenden

export interface DocumentEmailPayload {
  to: string;
  cc?: string[];
  subject: string;
  pdfBlob: Blob;
  fileName: string;
  bodyText?: string;
}

/** Feste Info-Adresse, die bei Einsatzmitteilungen immer in Kopie gesetzt wird. */
export const INFO_EMAIL_ADDRESS = 'info@aufabruf.eu';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function sendDocumentEmail(payload: DocumentEmailPayload): Promise<void> {
  if (typeof window === 'undefined') {
    logger.warn('[Email] sendDocumentEmail server-side – übersprungen', {}, { to: payload.to });
    return;
  }

  const { auth } = await import('@/lib/firebase');
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Kein Auth-Token');

  const pdfBase64 = await blobToBase64(payload.pdfBlob);

  const res = await fetch('/api/email/send-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      to: payload.to,
      cc: payload.cc,
      subject: payload.subject,
      pdfBase64,
      fileName: payload.fileName,
      bodyText: payload.bodyText,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
}

export async function sendAssignmentSignatureEmail(payload: AssignmentSignatureEmailPayload): Promise<void> {
  try {
    // Dynamischer Import, um serverseitige Probleme zu vermeiden
    if (typeof window === 'undefined') {
      logger.warn('[Email] Called server-side, skipping email send', {}, { payload });
      return;
    }
    
    const { functions } = await import('@/lib/firebase');
    const { httpsCallable } = await import('firebase/functions');
    
    if (!functions) {
      throw new Error('Firebase Functions ist nicht initialisiert');
    }
    const call = httpsCallable(functions, 'sendAssignmentSignatureEmailCF');
    await call(payload);
  } catch (e) {
    // Fallback Logging, wenn CF nicht verfügbar
    logger.warn('[Email:FALLBACK] Assignment Signature', {}, { payload, html: renderAssignmentSignatureEmailHtml(payload) });
  }
}


