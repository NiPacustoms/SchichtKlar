import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { requireAuthContext, HttpError } from '@/lib/server/requestContext';
import {
  createAuthErrorResponse,
  createValidationErrorResponse,
} from '@/lib/errors/apiErrorResponse';
import { ErrorCode } from '@/lib/errors/ErrorTypes';
import { logger, errorHandler, createErrorResponse, isAppError } from '@/lib/errors';

export const runtime = 'nodejs';

const ROUTE = '/api/admin/user/[userId]/data-export';

/**
 * GET /api/admin/user/[userId]/data-export
 *
 * DSGVO Art. 15: Admin löst Datenexport für einen Nutzer aus.
 * Nur admin darf für andere User auslösen.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  let ctx;
  try {
    ctx = await requireAuthContext(req, { role: 'admin' });
  } catch (e) {
    if (e instanceof HttpError) return e.response;
    throw e;
  }

  try {
    if (!adminDb) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const { userId } = await params;
    if (!userId) {
      return createValidationErrorResponse('userId fehlt.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    const callerUid = ctx.uid;
    const decoded = { uid: ctx.uid };
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const companyId = (userData as { companyId?: string } | undefined)?.companyId ?? '';

    // Mandantenisolation: Nur Nutzer der eigenen Company exportierbar.
    if (!userDoc.exists || companyId !== ctx.companyId) {
      return createAuthErrorResponse('UNAUTHORIZED', ROUTE);
    }

    await adminDb.collection('auditLogs').add({
      actorUid: callerUid,
      companyId: companyId || undefined,
      action: 'admin.data_export',
      target: { collection: 'users', id: userId },
      createdAt: new Date(),
      metadata: { requestedBy: callerUid, targetUserId: userId },
    });

    const timesheetsSnapshot = await adminDb
      .collection('timesheets')
      .where('userId', '==', userId)
      .get();
    const timesheets = timesheetsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const assignmentsSnapshot = await adminDb
      .collection('assignments')
      .where('userId', '==', userId)
      .get();
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const messagesSnapshot = await adminDb
      .collection('messages')
      .where('userId', '==', userId)
      .get();
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const documentsSnapshot = await adminDb
      .collection('documents')
      .where('userId', '==', userId)
      .get();
    const documents = documentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .get();
    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const fcmTokensSnapshot = await adminDb
      .collection('fcmTokens')
      .where('userId', '==', userId)
      .get();
    const fcmTokens = fcmTokensSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      requestedBy: decoded.uid,
      data: {
        user: userData,
        timesheets,
        assignments,
        messages,
        documents,
        notifications,
        fcmTokens,
      },
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="schichtklar-data-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error: unknown) {
    const appError = isAppError(error)
      ? error
      : errorHandler.handleFirebaseError(
          error,
          { route: '/api/admin/user/[userId]/data-export' },
          { component: 'GET /api/admin/user/[userId]/data-export' }
        );
    logger.error('Error exporting user data (admin)', appError);
    return createErrorResponse(appError);
  }
}
