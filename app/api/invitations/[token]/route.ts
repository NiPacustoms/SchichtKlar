import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { maskEmail } from '@/lib/utils/authz';
import { createValidationErrorResponse, createNotFoundErrorResponse, createErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

const ROUTE = '/api/invitations/[token]';

/**
 * GET /api/invitations/[token] – Vorschau einer Einladung (öffentlich, ohne Login):
 * maskierte E-Mail und Firmenname. Läuft über das Admin-SDK, weil die Rules
 * Einladungen und Firmen für nicht angemeldete Nutzer nicht freigeben.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ token?: string }> }) {
  try {
    const limited = checkRateLimit(req);
    if (limited) return limited;
    const { token } = (await context.params) || {};
    if (!token || token.length < 16 || token.length > 200)
      return createValidationErrorResponse('token erforderlich.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    if (!adminDb) throw new Error('Firebase Admin nicht konfiguriert');

    const snap = await adminDb.collection('invitations').where('token', '==', token).limit(1).get();
    if (snap.empty) return createNotFoundErrorResponse('Einladung nicht gefunden.', ROUTE);
    const invite = snap.docs[0].data() as {
      email: string;
      companyId: string;
      acceptedAt?: unknown;
      expiresAt?: { toDate?: () => Date } | string | number | null;
    };
    if (invite.acceptedAt)
      return createValidationErrorResponse('Einladung bereits verwendet.', ErrorCode.VALIDATION_DUPLICATE_VALUE, ROUTE);
    const exp =
      (invite.expiresAt as { toDate?: () => Date })?.toDate?.() ?? (invite.expiresAt ? new Date(invite.expiresAt as string | number) : null);
    if (exp && Date.now() > exp.getTime())
      return createErrorResponse(createAppError(new Error('Einladung abgelaufen.'), ErrorCode.INVITATION_EXPIRED, { route: ROUTE }));

    const company = invite.companyId ? await adminDb.collection('companies').doc(invite.companyId).get() : null;
    const companyName = (company?.exists && (company.data()?.name as string)) || 'Ihre Firma';
    return NextResponse.json({ emailMasked: maskEmail(invite.email), companyName }, { status: 200 });
  } catch (e: unknown) {
    const appError = createAppError(e instanceof Error ? e : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE });
    return createErrorResponse(appError);
  }
}
