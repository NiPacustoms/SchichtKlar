import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, adminDb, getRoleFromToken } from '@/lib/server/firebaseAdmin';
import {
  createAuthErrorResponse,
  createValidationErrorResponse,
} from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';
import { logger, errorHandler, createErrorResponse, isAppError } from '@/lib/errors';

export const runtime = 'nodejs';

const ROUTE = '/api/admin/user/[userId]/data-export';

/**
 * GET /api/admin/user/[userId]/data-export
 *
 * DSGVO Art. 15: Admin löst Datenexport für einen Nutzer aus.
 * Nur admin/dispatcher dürfen für andere User auslösen.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const decoded = await verifyIdToken(authHeader);
    if (!decoded || !adminDb) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const role = getRoleFromToken(decoded);
    if (role !== 'admin' && role !== 'dispatcher') {
      return createAuthErrorResponse('UNAUTHORIZED', ROUTE);
    }

    const { userId } = await params;
    if (!userId) {
      return createValidationErrorResponse('userId fehlt.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    const callerUid = decoded.uid;
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const companyId = (userData as { companyId?: string } | undefined)?.companyId ?? '';

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
        'Content-Disposition': `attachment; filename="jobflow-data-export-${userId}-${Date.now()}.json"`,
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
