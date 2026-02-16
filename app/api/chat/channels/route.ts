import { NextRequest, NextResponse } from 'next/server';
import {
  verifyIdToken,
  adminDb,
  getRoleFromToken,
  getCompanyIdFromToken,
} from '@/lib/server/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/middleware/rateLimit';
import { validateRequest, createChannelSchema } from '@/lib/validations';
import {
  createAuthErrorResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ROUTE = '/api/chat/channels';

// GET /api/chat/channels - Alle Channels für einen User abrufen
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const decoded = await verifyIdToken(authHeader);
    if (!decoded) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const userId = decoded.uid;

    // Rate Limiting prüfen
    const rateLimitResponse = checkRateLimit(req, userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get('companyId');

    if (!adminDb) {
      return createErrorResponse(createAppError(new Error('Database not initialized'), ErrorCode.SERVICE_UNAVAILABLE, { route: ROUTE }));
    }

    // Hole companyId aus User-Dokument oder Custom Claims
    let companyId: string | null = companyIdParam;
    if (!companyId) {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        companyId = userDoc.data()?.companyId;
      }
      if (!companyId) {
        companyId = getCompanyIdFromToken(decoded);
      }
    }

    if (!companyId) {
      return createValidationErrorResponse('No companyId found.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    // Channels abrufen, an denen der User teilnimmt und zur gleichen Company gehören
    const channelsSnapshot = await adminDb
      .collection('channels')
      .where('companyId', '==', companyId)
      .where('participants', 'array-contains', userId)
      .orderBy('lastMessageAt', 'desc')
      .get();

    const channels = channelsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        lastMessageAt: data.lastMessageAt?.toDate?.() || data.lastMessageAt,
      };
    });

    const response = NextResponse.json({ channels }, { status: 200 });
    return addRateLimitHeaders(response, req, userId);
  } catch (error) {
    logger.error('Error in GET /api/chat/channels', error instanceof Error ? error : undefined, {
      route: ROUTE,
      timestamp: new Date(),
    }, { component: 'GET /api/chat/channels' });
    return createErrorResponse(createAppError(error instanceof Error ? error : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}

// POST /api/chat/channels - Neuen Channel erstellen
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

    const userId = decoded.uid;
    const role = getRoleFromToken(decoded);

    // Rate Limiting prüfen
    const rateLimitResponse = checkRateLimit(req, userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Request-Body validieren
    const validation = await validateRequest(req, createChannelSchema);
    if (!validation.success) {
      return validation.response;
    }
    const body = validation.data;
    const { participants, type, name } = body;
    const companyIdParam: string | undefined = undefined; // wird aus User-Dokument geholt

    const isAdminOrDispatcher = role === 'admin' || role === 'dispatcher';

    // Broadcast-Channels können nur von Admin oder Dispatcher erstellt werden
    if (type === 'broadcast' && !isAdminOrDispatcher) {
      return createErrorResponse(
        createAppError(new Error('Only admins and dispatchers can create broadcast channels'), ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, { route: ROUTE })
      );
    }

    if (!adminDb) {
      return createErrorResponse(createAppError(new Error('Database not initialized'), ErrorCode.SERVICE_UNAVAILABLE, { route: ROUTE }));
    }

    // Hole companyId aus User-Dokument oder Custom Claims
    let companyId: string | undefined = companyIdParam;
    if (!companyId) {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        companyId = userDoc.data()?.companyId;
      }
      if (!companyId) {
        companyId = getCompanyIdFromToken(decoded) || undefined;
      }
    }

    if (!companyId) {
      return createValidationErrorResponse('No companyId found.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    // Stelle sicher, dass der Ersteller in den Teilnehmern ist
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    const channelData = {
      type,
      participants,
      name: name || null,
      createdBy: userId,
      companyId: companyId,
      createdAt: Timestamp.now(),
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: {},
    };

    const docRef = await adminDb.collection('channels').add(channelData);

    const response = NextResponse.json({ channelId: docRef.id }, { status: 201 });
    return addRateLimitHeaders(response, req, userId);
  } catch (error) {
    logger.error('Error in POST /api/chat/channels', error instanceof Error ? error : undefined, {
      route: ROUTE,
      timestamp: new Date(),
    }, { component: 'POST /api/chat/channels' });
    return createErrorResponse(createAppError(error instanceof Error ? error : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}
