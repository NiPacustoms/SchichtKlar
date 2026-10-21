import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import * as nodeCrypto from 'node:crypto';
import { adminAuth, adminDb } from '@/lib/server/firebaseAdmin';
import { requireAuthContext, HttpError } from '@/lib/server/requestContext';
import { sendInvitationEmailServer } from '@/lib/server/email';
import {
  createValidationErrorResponse,
  createErrorResponse,
} from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ROUTE = '/api/invitations';
/** Einladungen gelten 7 Tage – Pflegekräfte im Schichtdienst sehen Mails oft erst später */
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateToken(length = 48): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    nodeCrypto.randomFillSync(bytes);
  }
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return Buffer.from(binary, 'binary').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// POST /api/invitations
// Auth: Bearer-Token eines Admins. Body: { email: string }
// Der einladende Admin und dessen companyId werden AUS DEM TOKEN abgeleitet –
// niemals aus dem Request-Body (sonst Spoofing fremder Companies möglich).
export async function POST(req: NextRequest) {
  let ctx;
  try {
    const limited = checkRateLimit(req);
    if (limited) return limited;
    ctx = await requireAuthContext(req, { role: 'admin' });
  } catch (e) {
    if (e instanceof HttpError) return e.response;
    throw e;
  }
  const adminUid = ctx.uid;
  const companyId = ctx.companyId;

  let body: { email?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return createValidationErrorResponse(
      'Ungültiger Request-Body (JSON erwartet).',
      ErrorCode.VALIDATION_INVALID_FORMAT,
      ROUTE
    );
  }
  const { email } = body || {};
  if (!email) {
    return createValidationErrorResponse('email erforderlich.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
  }

  try {
    if (!adminDb) {
      return createErrorResponse(
        createAppError(new Error('Firebase Admin nicht konfiguriert.'), ErrorCode.INTERNAL_ERROR, { route: ROUTE })
      );
    }

    const emailTrim = String(email).trim().toLowerCase();
    // Bestehendes Konto? Dann ist keine Einladung nötig (sonst scheitert die Annahme).
    if (adminAuth) {
      const existingUser = await adminAuth.getUserByEmail(emailTrim).catch(() => null);
      if (existingUser) {
        return createValidationErrorResponse(
          'Für diese E-Mail-Adresse gibt es bereits ein Konto. Die Person kann sich direkt anmelden.',
          ErrorCode.VALIDATION_DUPLICATE_VALUE,
          ROUTE
        );
      }
    }
    const invitationsSnap = await adminDb
      .collection('invitations')
      .where('companyId', '==', companyId)
      .where('email', '==', emailTrim)
      .get();
    let invitationId: string;
    let token: string;
    let expiresAt: Date;

    const existing = invitationsSnap.docs.find(d => !d.data().acceptedAt);
    if (existing) {
      // Offene Einladung erneut senden: gleiche ID, neuer Link, neue Frist
      // (ein abgelaufener Link wäre sonst nicht mehr einlösbar).
      invitationId = existing.id;
      token = generateToken(48);
      expiresAt = new Date(Date.now() + INVITE_TTL_MS);
      await existing.ref.update({ token, expiresAt, resentAt: FieldValue.serverTimestamp(), createdByUserId: adminUid });
    } else {
      token = generateToken(48);
      expiresAt = new Date(Date.now() + INVITE_TTL_MS);
      const invRef = await adminDb.collection('invitations').add({
        companyId,
        email: emailTrim,
        token,
        expiresAt,
        acceptedAt: null,
        createdByUserId: adminUid,
        createdAt: FieldValue.serverTimestamp(),
      });
      invitationId = invRef.id;
    }

    const companySnap = await adminDb.collection('companies').doc(companyId).get();
    const companyName = companySnap.exists && companySnap.data()?.name
      ? String(companySnap.data()!.name)
      : 'Ihre Firma';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const acceptLink = `${baseUrl}/einladung-annehmen?token=${encodeURIComponent(token)}`;

    let emailSent = false;
    try {
      const result = await sendInvitationEmailServer({ to: emailTrim, companyName, acceptLink });
      emailSent = result.sent;
    } catch {
      emailSent = false;
    }

    return NextResponse.json(
      {
        invitationId,
        token,
        expiresAt: expiresAt.toISOString(),
        acceptLink,
        companyName,
        emailSent,
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    logger.error('[API] POST /api/invitations failed', err, { route: ROUTE, adminUid, email });
    const msg = err.message || '';
    if (msg.includes('index') && (msg.includes('required') || msg.includes('CREATE INDEX'))) {
      const appError = createAppError(err, ErrorCode.FIREBASE_MISSING_INDEX, { route: ROUTE });
      return createErrorResponse(appError);
    }
    const appError = createAppError(err, ErrorCode.INTERNAL_ERROR, { route: ROUTE });
    return createErrorResponse(appError);
  }
}

// GET /api/invitations
// Auth: Bearer-Token eines Admins. Liefert die Einladungen der EIGENEN Company.
export async function GET(req: NextRequest) {
  let ctx;
  try {
    const limited = checkRateLimit(req);
    if (limited) return limited;
    ctx = await requireAuthContext(req, { role: 'admin' });
  } catch (e) {
    if (e instanceof HttpError) return e.response;
    throw e;
  }
  const companyId = ctx.companyId;

  try {
    if (!adminDb) {
      return createErrorResponse(
        createAppError(new Error('Firebase Admin nicht konfiguriert.'), ErrorCode.INTERNAL_ERROR, { route: ROUTE })
      );
    }

    const snap = await adminDb.collection('invitations').where('companyId', '==', companyId).get();
    const data = snap.docs.map(d => {
      const x = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        email: x.email as string,
        companyId: x.companyId as string,
        token: x.token as string,
        createdAt: (x.createdAt as { toDate?: () => Date })?.toDate?.() || null,
        acceptedAt: (x.acceptedAt as { toDate?: () => Date })?.toDate?.() || null,
        expiresAt:
          (x.expiresAt as { toDate?: () => Date })?.toDate?.() ||
          (x.expiresAt ? new Date(x.expiresAt as string | number) : null),
      };
    });
    return NextResponse.json({ data, total: data.length }, { status: 200 });
  } catch (e: unknown) {
    const appError = createAppError(e instanceof Error ? e : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE });
    return createErrorResponse(appError);
  }
}
