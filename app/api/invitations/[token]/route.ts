import { NextRequest, NextResponse } from 'next/server';
import { invitationService } from '@/lib/services/invitations';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { maskEmail } from '@/lib/utils/authz';
import { createValidationErrorResponse, createNotFoundErrorResponse, createErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';
import { checkRateLimit } from '@/lib/middleware/rateLimit';

export const runtime = 'nodejs';

const ROUTE = '/api/invitations/[token]';

// GET /api/invitations/[token]
// Öffentlich per Token erreichbar → IP-Rate-Limit gegen Token-Enumeration.
export async function GET(req: NextRequest, context: { params: Promise<{ token?: string }> }) {
  try {
    const rateLimitResponse = checkRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    const params = await context.params;
    const { token } = params || {};
    if (!token) return createValidationErrorResponse('token erforderlich.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);

    const invite = await invitationService.getByToken(token);
    if (!invite) return createNotFoundErrorResponse('Einladung nicht gefunden.', ROUTE);

    const now = Date.now();
    const exp = invite.expiresAt?.getTime?.() || 0;
    if (invite.acceptedAt)
      return createValidationErrorResponse('Einladung bereits verwendet.', ErrorCode.VALIDATION_DUPLICATE_VALUE, ROUTE);
    if (exp && now > exp)
      return createErrorResponse(createAppError(new Error('Einladung abgelaufen.'), ErrorCode.INVITATION_EXPIRED, { route: ROUTE }));

    if (!db) throw new Error('Firestore not initialized');
    const companyDoc = await getDoc(doc(db, 'companies', invite.companyId));
    const companyName = companyDoc.exists() ? companyDoc.data()?.name : 'Ihre Firma';

    const email = invite.email;
    const emailMasked = maskEmail(email);

    return NextResponse.json({ emailMasked, companyName }, { status: 200 });
  } catch (e: unknown) {
    const appError = createAppError(e instanceof Error ? e : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE });
    return createErrorResponse(appError);
  }
}
