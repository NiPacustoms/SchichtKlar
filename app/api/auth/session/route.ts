import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, verifyIdToken } from '@/lib/server/firebaseAdmin';
import { logger } from '@/lib/errors';
import { createAuthErrorResponse, createErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = '__session';
const ROLE_COOKIE_NAME = 'schichtklar_role';
const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000; // 5 Tage
const ROUTE = '/api/auth/session';

export type RouteRole = 'admin' | 'nurse';

/**
 * Ermittelt die Routen-Rolle serverseitig (User-Dokument + ggf. Custom-Rolle mit access_admin_area).
 * Nur admin oder nurse – niemand kann Routen des anderen Bereichs betreten.
 */
async function resolveRouteRole(uid: string): Promise<RouteRole> {
  if (!adminDb) return 'nurse';
  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) return 'nurse';
  const data = userDoc.data() as { role?: string; customRoleId?: string } | undefined;
  const role = data?.role === 'admin' ? 'admin' : 'nurse';
  if (role === 'admin') return 'admin';
  const customRoleId = data?.customRoleId;
  if (!customRoleId) return 'nurse';
  const roleDoc = await adminDb.collection('adminRoles').doc(customRoleId).get();
  if (!roleDoc.exists) return 'nurse';
  const permissions = (roleDoc.data() as { permissions?: string[] } | undefined)?.permissions ?? [];
  return permissions.includes('access_admin_area') ? 'admin' : 'nurse';
}

/**
 * POST: Session-Cookie setzen (nach Login).
 * Setzt __session und schichtklar_role (admin|nurse) – Middleware erzwingt strikte Routentrennung.
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

    const [sessionCookie, routeRole] = await Promise.all([
      adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS }),
      resolveRouteRole(decoded.uid),
    ]);

    const res = NextResponse.json({ success: true });
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    };
    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, cookieOpts);
    res.cookies.set(ROLE_COOKIE_NAME, routeRole, cookieOpts);

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

const CLEAR_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 0,
};

/**
 * DELETE: Session- und Role-Cookie löschen (Logout).
 */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE_NAME, '', CLEAR_COOKIE);
  res.cookies.set(ROLE_COOKIE_NAME, '', CLEAR_COOKIE);
  return res;
}
