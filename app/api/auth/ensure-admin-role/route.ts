import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, verifyIdToken } from '@/lib/server/firebaseAdmin';
import {
  logger,
  errorHandler,
  createErrorResponse,
  createAuthErrorResponse,
  createAppError,
  ErrorCode,
  isAppError,
} from '@/lib/errors';
import { SINGLE_COMPANY_ID } from '@/lib/constants/company';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

/**
 * Setzt die Rolle des aktuellen Benutzers auf Admin, wenn seine E-Mail in der
 * Bootstrap-Allow-Liste steht. Nützlich, wenn admin@jobflow.de als Employee
 * erkannt wird (z. B. weil das User-Dokument fehlte oder role: 'nurse' hatte).
 *
 * Voraussetzung: ENABLE_ADMIN_BOOTSTRAP=true und ADMIN_BOOTSTRAP_EMAIL=admin@jobflow.de
 * Einmal aufrufen (z. B. aus der Browser-Konsole), dann Seite neu laden.
 */
export async function POST(req: NextRequest) {
  try {
    const route = '/api/auth/ensure-admin-role';
    if (!adminAuth || !adminDb) {
      return createErrorResponse(
        createAppError(
          new Error('Firebase Admin ist nicht konfiguriert.'),
          ErrorCode.INTERNAL_ERROR,
          { route }
        )
      );
    }

    const bootstrapEnabled = process.env.ENABLE_ADMIN_BOOTSTRAP === 'true';
    const allowedEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
    if (!bootstrapEnabled || !allowedEmail) {
      return createAuthErrorResponse('UNAUTHORIZED', route);
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createAuthErrorResponse('UNAUTHENTICATED', route);
    }

    const decoded = await verifyIdToken(authHeader);
    if (!decoded) {
      return createAuthErrorResponse('UNAUTHENTICATED', route);
    }

    const email = (decoded.email || '').toLowerCase();
    if (email !== allowedEmail) {
      return createAuthErrorResponse('UNAUTHORIZED', route);
    }

    const uid = decoded.uid;
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    const existingData = userDoc.exists
      ? (userDoc.data() as { companyId?: string; displayName?: string } | undefined)
      : undefined;
    const companyId = existingData?.companyId || SINGLE_COMPANY_ID;

    await userRef.set(
      {
        id: uid,
        email: decoded.email || email,
        displayName: existingData?.displayName || decoded.name || email.split('@')[0] || 'Admin',
        role: 'admin',
        companyId,
        active: true,
        qualifications: [],
        documents: [],
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          shiftReminders: true,
          documentExpiry: true,
          systemAnnouncements: true,
        },
        updatedAt: FieldValue.serverTimestamp(),
        ...(userDoc.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );

    await adminAuth.setCustomUserClaims(uid, { role: 'admin', companyId });

    logger.info('ensure-admin-role: Rolle auf admin gesetzt', undefined, { uid, email });
    return NextResponse.json({
      success: true,
      message: 'Rolle auf Admin gesetzt. Bitte Seite neu laden.',
    });
  } catch (error: unknown) {
    const appError = isAppError(error)
      ? error
      : errorHandler.handleFirebaseError(
          error,
          { route: '/api/auth/ensure-admin-role' },
          { component: 'POST /api/auth/ensure-admin-role' }
        );
    logger.error('ensure-admin-role failed', appError, {
      component: 'api:auth/ensure-admin-role',
      action: 'POST',
    });
    return createErrorResponse(appError);
  }
}
