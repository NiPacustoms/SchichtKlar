import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth, verifyIdToken, getRoleFromToken } from '@/lib/server/firebaseAdmin';
import { logger } from '@/lib/logging';
import { Timestamp } from 'firebase-admin/firestore';
import {
  createAuthErrorResponse,
  createErrorResponse,
  createNotFoundErrorResponse,
  createValidationErrorResponse,
} from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

const ROUTE = '/api/users/[userId]';

/**
 * DELETE /api/users/[userId]
 *
 * Löscht einen Benutzer sowohl aus Firestore als auch aus Firebase Auth
 * Nur Admins können diese Route aufrufen
 */
export async function DELETE(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const decoded = await verifyIdToken(authorization);
    if (!decoded) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    // Prüfe, ob der Benutzer ein Admin ist
    const role = getRoleFromToken(decoded);
    if (role !== 'admin') {
      return createAuthErrorResponse('UNAUTHORIZED', ROUTE);
    }

    if (!adminDb || !adminAuth) {
      logger.warn('User delete API: adminDb or adminAuth not initialized');
      const appError = createAppError(
        new Error('Service temporarily unavailable'),
        ErrorCode.SERVICE_UNAVAILABLE,
        { route: ROUTE }
      );
      return createErrorResponse(appError);
    }

    const { userId } = await context.params;

    if (!userId) {
      return createValidationErrorResponse('User-ID ist erforderlich.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    // Verhindere, dass ein Admin sich selbst löscht
    if (userId === decoded.uid) {
      return createValidationErrorResponse('Sie können Ihr eigenes Konto nicht löschen.', ErrorCode.VALIDATION_INVALID_FORMAT, ROUTE);
    }

    // Lade User-Dokument, um companyId für Audit-Log zu erhalten
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return createNotFoundErrorResponse('Benutzer nicht gefunden.', ROUTE);
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId as string | undefined;

    // Prüfe, ob der Admin die Berechtigung hat, diesen User zu löschen (gleiche Company)
    const adminCompanyId = (decoded as { companyId?: string })?.companyId;
    if (adminCompanyId && companyId && adminCompanyId !== companyId) {
      return createAuthErrorResponse('UNAUTHORIZED', ROUTE);
    }

    // 1. Lösche Firestore-Dokument
    try {
      await adminDb.collection('users').doc(userId).delete();
      logger.info('User document deleted from Firestore', {}, { userId, companyId });
    } catch (error) {
      logger.error(
        'Failed to delete user document from Firestore',
        error instanceof Error ? error : new Error(String(error)),
        {},
        { userId }
      );
      // Weiter mit Auth-Löschung, auch wenn Firestore-Löschung fehlschlägt
    }

    // 2. Lösche Firebase Auth User
    try {
      await adminAuth.deleteUser(userId);
      logger.info('User deleted from Firebase Auth', {}, { userId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;

      // Wenn der User nicht in Auth existiert, ist das OK (möglicherweise wurde er bereits gelöscht)
      if (errorCode === 'auth/user-not-found') {
        logger.warn(
          'User not found in Firebase Auth (may have been already deleted)',
          {},
          { userId }
        );
      } else {
        logger.error(
          'Failed to delete user from Firebase Auth',
          error instanceof Error ? error : new Error(String(error)),
          {},
          { userId, errorCode }
        );
        // Wenn Auth-Löschung fehlschlägt, aber Firestore gelöscht wurde, geben wir trotzdem Erfolg zurück
        // mit einer Warnung
        return NextResponse.json(
          {
            ok: true,
            message: 'User document deleted, but Firebase Auth deletion failed',
            warning: errorMessage,
          },
          { status: 207 } // 207 Multi-Status
        );
      }
    }

    // 3. Audit-Log erstellen
    try {
      await adminDb.collection('auditLogs').add({
        actorUid: decoded.uid,
        companyId: companyId || adminCompanyId || 'unknown',
        action: 'user.delete',
        target: { collection: 'users', id: userId },
        before: userData ? { ...userData } : null,
        after: null,
        createdAt: Timestamp.now(),
      });
    } catch (auditLogError) {
      // Audit-Log-Fehler sollten den Prozess nicht blockieren
      logger.warn(
        'Failed to create audit log for user deletion',
        { action: 'user.delete', component: 'api/users/[userId]' },
        {
          userId,
          error: auditLogError instanceof Error ? auditLogError.message : String(auditLogError),
        }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'User deleted successfully',
      userId,
    });
  } catch (error) {
    logger.error(
      'User delete API error',
      error instanceof Error ? error : new Error(String(error)),
      {},
      { message: error instanceof Error ? error.message : 'Internal error' }
    );
    const appError = createAppError(
      error instanceof Error ? error : new Error('Ein unbekannter Fehler ist aufgetreten.'),
      ErrorCode.INTERNAL_ERROR,
      { route: ROUTE }
    );
    return createErrorResponse(appError);
  }
}
