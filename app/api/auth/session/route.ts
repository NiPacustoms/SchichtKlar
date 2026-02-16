import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, verifyIdToken } from '@/lib/server/firebaseAdmin';
import { logger } from '@/lib/errors';
import { createAuthErrorResponse, createErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = '__session';
const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000; // 5 Tage (Firebase max 2 Wochen)
const ROUTE = '/api/auth/session';

/**
 * POST: Session-Cookie setzen (nach Login).
 * Client sendet Firebase ID Token im Authorization-Header.
 * Setzt __session Cookie, damit die Middleware geschützte Routen erlaubt.
 */
export async function POST(req: NextRequest) {
  try {
    if (!adminAuth) {
      const appError = createAppError(
        new Error('Firebase Admin ist nicht konfiguriert.'),
        ErrorCode.SERVICE_UNAVAILABLE,
        { route: ROUTE }
      );
      return createErrorResponse(appError);
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const decoded = await verifyIdToken(authHeader);
    if (!decoded) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    });

    return res;
  } catch (error) {
    logger.error('Session cookie set failed', error instanceof Error ? error : undefined, {
      component: 'api:auth/session',
      action: 'POST',
    });
    const appError = createAppError(
      error instanceof Error ? error : new Error('Session konnte nicht gesetzt werden'),
      ErrorCode.INTERNAL_ERROR,
      { route: ROUTE }
    );
    return createErrorResponse(appError);
  }
}

/**
 * DELETE: Session-Cookie löschen (Logout).
 */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
