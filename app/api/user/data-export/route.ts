import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, adminDb } from '@/lib/server/firebaseAdmin';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { logger } from '@/lib/logging';
import { createAuthErrorResponse, createErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

const ROUTE = '/api/user/data-export';

/**
 * GET /api/user/data-export
 *
 * DSGVO Art. 15: Auskunftsrecht
 * Exportiert alle personenbezogenen Daten eines Users
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);

    const decoded = await verifyIdToken(authHeader);
    if (!decoded || !adminDb) return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);

    const userId = decoded.uid;

    // Rate Limiting: checkRateLimit begrenzt Anfragen. Optional V2: eigener Limiter (z. B. 1 Export/Stunde).
    const rateLimitResponse = checkRateLimit(req, userId);
    if (rateLimitResponse) {
      // Zusätzliche Prüfung: Max 1 Export pro Stunde
      // In Produktion sollte dies über einen dedizierten Rate-Limiter erfolgen
      return rateLimitResponse;
    }

    // Alle User-Daten sammeln
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Timesheets
    const timesheetsSnapshot = await adminDb
      .collection('timesheets')
      .where('userId', '==', userId)
      .get();
    const timesheets = timesheetsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Assignments
    const assignmentsSnapshot = await adminDb
      .collection('assignments')
      .where('userId', '==', userId)
      .get();
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Documents
    const documentsSnapshot = await adminDb
      .collection('documents')
      .where('userId', '==', userId)
      .get();
    const documents = documentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Notifications
    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .get();
    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // FCM Tokens (nur eigene)
    const fcmTokensSnapshot = await adminDb
      .collection('fcmTokens')
      .where('userId', '==', userId)
      .get();
    const fcmTokens = fcmTokensSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Zusammenfassen
    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      data: {
        user: userData,
        timesheets,
        assignments,
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
  } catch (error) {
    logger.error(
      'Error exporting user data',
      error instanceof Error ? error : new Error(String(error))
    );
    const appError = createAppError(
      error instanceof Error ? error : new Error('Unknown error'),
      ErrorCode.INTERNAL_ERROR,
      { route: ROUTE }
    );
    return createErrorResponse(appError);
  }
}
