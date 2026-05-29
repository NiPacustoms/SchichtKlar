import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/server/firebaseAdmin';
import { sendAssignmentFormEmailServer, sanitizeCc } from '@/lib/server/email';
import {
  createAuthErrorResponse,
  createValidationErrorResponse,
  createErrorResponse,
  createAppError,
  ErrorCode,
} from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROUTE = '/api/email/send-assignment-form';

interface RequestBody {
  to: string;
  cc?: string[];
  employeeName?: string;
  formLink: string;
  shiftInfo?: string;
}

function isRequestBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return typeof b.to === 'string' && typeof b.formLink === 'string';
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
}

export async function POST(req: NextRequest) {
  const decoded = await verifyIdToken(req.headers.get('authorization') ?? undefined);
  if (!decoded) return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return createValidationErrorResponse('Ungültiger JSON-Body', undefined, ROUTE);
  }

  if (!isRequestBody(body)) {
    return createValidationErrorResponse('to und formLink sind erforderlich', undefined, ROUTE);
  }

  const { to, cc, employeeName, formLink, shiftInfo } = body;
  const ccList = sanitizeCc(cc, to);

  try {
    const result = await sendAssignmentFormEmailServer({ to, cc: ccList, employeeName, formLink, shiftInfo });
    if (!result.sent) {
      return createErrorResponse(
        createAppError(new Error(result.error ?? 'E-Mail konnte nicht gesendet werden'), ErrorCode.INTERNAL_ERROR, {
          route: ROUTE,
        })
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return createErrorResponse(
      createAppError(e instanceof Error ? e : new Error(String(e)), ErrorCode.INTERNAL_ERROR, {
        route: ROUTE,
      })
    );
  }
}
