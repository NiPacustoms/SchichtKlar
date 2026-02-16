import { NextRequest, NextResponse } from 'next/server';
import {
  verifyIdToken,
  adminDb,
  getRoleFromToken,
  getCompanyIdFromToken,
} from '@/lib/server/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  createAuthErrorResponse,
  createErrorResponse,
  createNotFoundErrorResponse,
  createValidationErrorResponse,
} from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ROUTE = '/api/chat/direct';

// POST /api/chat/direct - Direkt-Chat zwischen zwei Benutzern finden oder erstellen
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const decoded = await verifyIdToken(authHeader);
    if (!decoded) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const userId1 = decoded.uid;
    const role1 = getRoleFromToken(decoded);
    const body = await req.json();
    const { userId2 } = body as { userId2?: string };

    if (!userId2) {
      return createValidationErrorResponse('userId2 required.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    if (!adminDb) {
      return createErrorResponse(createAppError(new Error('Database not initialized'), ErrorCode.SERVICE_UNAVAILABLE, { route: ROUTE }));
    }

    // Stelle sicher, dass Ziel-User existiert und Rolle geladen wird
    const targetUserDoc = await adminDb.collection('users').doc(userId2).get();
    if (!targetUserDoc.exists) {
      return createNotFoundErrorResponse('Target user not found.', ROUTE);
    }
    const targetData = targetUserDoc.data() as { role?: string } | undefined;
    const role2 = targetData?.role || 'nurse';

    const isAdminOrDispatcher = role1 === 'admin' || role1 === 'dispatcher';
    const targetIsAdminOrDispatcher = role2 === 'admin' || role2 === 'dispatcher';

    // Mitarbeiter dürfen nur Admin/Dispatcher kontaktieren
    if (!isAdminOrDispatcher && !targetIsAdminOrDispatcher) {
      return createErrorResponse(
        createAppError(new Error('Employees may only start chats with admins or dispatchers'), ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, { route: ROUTE })
      );
    }

    // Selbstkontakt verhindern
    if (userId1 === userId2) {
      return createValidationErrorResponse('Cannot create direct chat with yourself.', ErrorCode.VALIDATION_INVALID_FORMAT, ROUTE);
    }

    // Suche nach existierendem Direkt-Chat
    const channelsSnapshot = await adminDb
      .collection('channels')
      .where('type', '==', 'direct')
      .where('participants', 'array-contains', userId1)
      .get();

    for (const channelDoc of channelsSnapshot.docs) {
      const channelData = channelDoc.data();
      const participants = channelData.participants || [];
      if (participants.includes(userId2)) {
        return NextResponse.json({ channelId: channelDoc.id }, { status: 200 });
      }
    }

    // Hole companyId aus User-Dokument oder Custom Claims
    let companyId = getCompanyIdFromToken(decoded);
    if (!companyId) {
      const userDoc = await adminDb.collection('users').doc(userId1).get();
      if (userDoc.exists) {
        companyId = userDoc.data()?.companyId;
      }
    }
    if (!companyId) {
      return createValidationErrorResponse('No companyId found.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    // Erstelle neuen Direkt-Chat
    const channelData = {
      type: 'direct' as const,
      participants: [userId1, userId2],
      name: null,
      createdBy: isAdminOrDispatcher ? userId1 : userId2,
      companyId: companyId,
      createdAt: Timestamp.now(),
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: {},
    };

    const docRef = await adminDb.collection('channels').add(channelData);

    return NextResponse.json({ channelId: docRef.id }, { status: 201 });
  } catch (error) {
    logger.error(
      'Fehler beim Erstellen/Abrufen des Direkt-Chats',
      error instanceof Error ? error : undefined,
      { route: ROUTE, timestamp: new Date() },
      { component: 'POST /api/chat/direct' }
    );
    return createErrorResponse(createAppError(error instanceof Error ? error : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}
