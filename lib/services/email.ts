// Minimaler E-Mail Versand-Adapter (Platzhalter)
// In Produktion: Resend/SES/Sendgrid integrieren.

export interface InviteEmailPayload {
  to: string;
  companyName: string;
  acceptLink: string;
}

export function renderInviteEmailHtml(payload: InviteEmailPayload): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2>Einladung zu JobFlow</h2>
      <p>Sie wurden von <strong>${payload.companyName}</strong> eingeladen, JobFlow beizutreten.</p>
      <p>Bitte klicken Sie innerhalb von 24 Stunden auf den folgenden Link, um Ihr Konto zu erstellen:</p>
      <p>
        <a href="${payload.acceptLink}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
          Einladung annehmen
        </a>
      </p>
      <p>Falls der Button nicht funktioniert, nutzen Sie diesen Link: <br/>
        <a href="${payload.acceptLink}">${payload.acceptLink}</a>
      </p>
      <p>Wenn Sie diese Einladung nicht erwartet haben, ignorieren Sie diese E-Mail.</p>
    </div>
  `;
}

import { logger } from '@/lib/logging';

export async function sendInvitationEmail(payload: InviteEmailPayload): Promise<void> {
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
    const call = httpsCallable(functions, 'sendInvitationEmailCF');
    await call(payload);
  } catch (e) {
    // Fallback Logging, wenn CF nicht verfügbar
    logger.warn('[Email:FALLBACK] Invitation', {}, { payload, html: renderInviteEmailHtml(payload) });
  }
}

// Assignment-Formular-Mail
export interface AssignmentFormEmailPayload {
  to: string;
  employeeName?: string;
  formLink: string;
  shiftInfo?: string;
}

export function renderAssignmentFormEmailHtml(payload: AssignmentFormEmailPayload): string {
  const greeting = payload.employeeName ? `Hallo ${payload.employeeName},` : 'Guten Tag,';
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <p>${greeting}</p>
      <p>Sie wurden für einen Dienst zugewiesen.${payload.shiftInfo ? ` <strong>${payload.shiftInfo}</strong>` : ''}</p>
      <p>Bitte füllen Sie die Einsatzmitteilung oder die Ablehnung über folgenden Link aus:</p>
      <p>
        <a href="${payload.formLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
          Formular öffnen
        </a>
      </p>
      <p>Falls der Button nicht funktioniert, nutzen Sie diesen Link: <br/>
        <a href="${payload.formLink}">${payload.formLink}</a>
      </p>
      <p>Vielen Dank!</p>
    </div>
  `;
}

export async function sendAssignmentFormEmail(payload: AssignmentFormEmailPayload): Promise<void> {
  if (typeof window === 'undefined') {
    logger.warn('[Email] sendAssignmentFormEmail server-side – übersprungen', {}, { to: payload.to });
    return;
  }
  try {
    const { functions } = await import('@/lib/firebase');
    const { httpsCallable } = await import('firebase/functions');
    if (!functions) throw new Error('Firebase Functions ist nicht initialisiert');
    const call = httpsCallable(functions, 'sendAssignmentFormEmailCF');
    await call(payload);
  } catch (e) {
    logger.warn('[Email:FALLBACK] Assignment Form', {}, { payload, html: renderAssignmentFormEmailHtml(payload) });
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
  subject: string;
  pdfBlob: Blob;
  fileName: string;
  bodyText?: string;
}

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

  const { functions } = await import('@/lib/firebase');
  const { httpsCallable } = await import('firebase/functions');

  if (!functions) {
    throw new Error('Firebase Functions ist nicht initialisiert');
  }

  const pdfBase64 = await blobToBase64(payload.pdfBlob);
  const call = httpsCallable(functions, 'sendDocumentEmailCF');
  await call({
    to: payload.to,
    subject: payload.subject,
    pdfBase64,
    fileName: payload.fileName,
    bodyText: payload.bodyText,
  });
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


