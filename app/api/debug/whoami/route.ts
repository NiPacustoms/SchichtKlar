import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, getRoleFromToken } from '@/lib/server/firebaseAdmin';
import { createAuthErrorResponse, createErrorResponse, createNotFoundErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

const ROUTE = '/api/debug/whoami';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return createNotFoundErrorResponse('Not available in production', ROUTE);
  }

  try {
    const decoded = await verifyIdToken(req.headers.get('authorization') || undefined);
    if (!decoded) return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    const { uid, email, role, firebase, auth_time, exp } = decoded as unknown as {
      uid: string;
      email?: string;
      role?: string;
      firebase?: unknown;
      auth_time?: number;
      exp?: number;
    };
    const tokenRole = getRoleFromToken(decoded);
    return NextResponse.json(
      { uid, email, role: role || tokenRole || null, auth_time, exp, firebase },
      { status: 200 }
    );
  } catch (e: unknown) {
    return createErrorResponse(createAppError(e instanceof Error ? e : new Error('error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}
