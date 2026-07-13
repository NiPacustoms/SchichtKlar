import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, verifyIdToken } from '@/lib/server/firebaseAdmin';
import {
  createAuthErrorResponse,
  createErrorResponse,
  createNotFoundErrorResponse,
} from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ROUTE = '/api/auth/sync-claims';

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return createErrorResponse(
        createAppError(new Error('Firebase Admin ist nicht konfiguriert (Service Account fehlt).'), ErrorCode.SERVICE_UNAVAILABLE, { route: ROUTE })
      );
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const decoded = await verifyIdToken(authHeader);
    if (!decoded) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const userRef = adminDb.collection('users').doc(decoded.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return createNotFoundErrorResponse('User-Dokument nicht gefunden.', ROUTE);
    }

    const userData = userDoc.data() as { role?: string; companyId?: string } | undefined;
    const role = (userData?.role as string | undefined) || 'nurse';
    // Multi-Tenant: companyId ausschließlich aus dem User-Dokument übernehmen –
    // KEIN Fallback auf einen festen Mandanten. Fehlt sie, wird bewusst kein
    // companyId-Claim gesetzt (Fail-Safe: kein Zugriff statt Fremd-Mandant).
    const companyId = userData?.companyId as string | undefined;

    if (!companyId) {
      logger.warn(
        'sync-claims: User ohne companyId – setze keinen companyId-Claim',
        { route: ROUTE },
        { uid: decoded.uid }
      );
    }

    const newClaims: Record<string, unknown> = {
      ...(decoded.customClaims || {}),
      role,
    };
    if (companyId) {
      newClaims.companyId = companyId;
    }

    await adminAuth.setCustomUserClaims(decoded.uid, newClaims);

    return NextResponse.json({
      success: true,
      claims: newClaims,
    });
  } catch (error) {
    logger.error(
      'Failed to sync custom claims',
      error instanceof Error ? error : undefined,
      { route: ROUTE, timestamp: new Date() },
      { component: 'POST /api/auth/sync-claims' }
    );
    return createErrorResponse(createAppError(error instanceof Error ? error : new Error('Unknown error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}
