import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, adminDb, getCompanyIdFromToken } from '@/lib/server/firebaseAdmin';
import {
  createAuthErrorResponse,
  createValidationErrorResponse,
  createErrorResponse,
} from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

const ROUTE = '/api/chat/users';

// GET /api/chat/users - Alle Benutzer für Chat-Auswahl abrufen (nur gleiche Company)
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

    if (!adminDb) {
      const appError = createAppError(
        new Error('Database not initialized'),
        ErrorCode.SERVICE_UNAVAILABLE,
        { route: ROUTE }
      );
      return createErrorResponse(appError);
    }

    const userId = decoded.uid;
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get('companyId');

    // Hole companyId aus User-Dokument oder Custom Claims
    let companyId = companyIdParam;
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
      return createValidationErrorResponse('Keine Mandanten-ID gefunden.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    // Nur aktive Benutzer derselben Company abrufen
    const usersSnapshot = await adminDb
      .collection('users')
      .where('companyId', '==', companyId)
      .where('active', '==', true)
      .get();

    // Formatiere User-Daten für ChatUser-Typ
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || data.name || data.email || 'Unbekannter Benutzer',
        email: data.email || '',
        avatar: data.avatar || data.photoURL || undefined,
        role: data.role || 'nurse',
        online: data.status === 'online' || data.online || false,
        lastSeen: data.lastSeen || data.lastActivity || undefined,
      };
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    const appError = createAppError(
      error instanceof Error ? error : new Error('Internal error'),
      ErrorCode.INTERNAL_ERROR,
      { route: ROUTE }
    );
    return createErrorResponse(appError);
  }
}
