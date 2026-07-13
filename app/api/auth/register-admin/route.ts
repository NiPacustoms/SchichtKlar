import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb, verifyIdToken } from '@/lib/server/firebaseAdmin';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/middleware/rateLimit';
import { validateRequest, registerAdminSchema } from '@/lib/validations';
import { createAuthErrorResponse, createErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ROUTE = '/api/auth/register-admin';

/**
 * Betriebsmodell: Admin registriert seine Firma → Rolle admin.
 * Siehe docs/ROLLEN-UND-EINLADUNGEN.md. Mitarbeiter werden per Einladung angelegt (accept-invite → nurse).
 */

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting prüfen (IP-basiert für Auth-Routen)
    const rateLimitResponse = checkRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Token verifizieren ZUERST (vor Body-Parsing, um 400 zu vermeiden)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    const decoded = await verifyIdToken(authHeader).catch(() => null);
    if (!decoded) {
      return createAuthErrorResponse('UNAUTHENTICATED', ROUTE);
    }

    // Request-Body validieren
    const validation = await validateRequest(req, registerAdminSchema);
    if (!validation.success) {
      return validation.response;
    }
    const body = validation.data;
    const { email, companyName, firstName, lastName, displayName: bodyDisplayName } = body;
    const uid = decoded.uid;
    // displayName aus Body verwenden, oder aus firstName/lastName erstellen, oder Fallback auf email
    const displayName =
      bodyDisplayName ||
      (firstName && lastName
        ? `${firstName} ${lastName}`.trim()
        : firstName || lastName || email || 'Admin');

    // Multi-Tenant-Self-Service: Jeder authentifizierte Nutzer darf genau EINE eigene
    // Firma registrieren und wird deren Admin. Die frühere globale „adminExists"-/
    // Bootstrap-Prüfung war single-tenant und blockierte jede weitere Firma – entfernt.
    // Schutz: Wer bereits einer Firma zugeordnet ist, kann sich nicht erneut registrieren.
    let existingCompanyId: string | undefined;
    try {
      if (adminDb) {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists) {
          existingCompanyId = (userDoc.data() as { companyId?: string } | undefined)?.companyId;
        }
      }
    } catch {
      // Im Zweifel (Leseproblem) neuen Nutzer zulassen – Firestore-Rules schützen zusätzlich.
    }
    if (existingCompanyId) {
      return createErrorResponse(
        createAppError(
          new Error('Dieses Konto ist bereits einer Firma zugeordnet.'),
          ErrorCode.FIREBASE_ALREADY_EXISTS,
          { route: ROUTE }
        )
      );
    }

    // Serverseitig ausschließlich mit dem Admin-SDK schreiben (Client-SDK ist
    // serverseitig nicht initialisierbar).
    if (!adminDb) {
      throw new Error('Admin Firestore ist nicht verfügbar.');
    }

    // 1) Company anlegen (eigene, isolierte companyId → Multi-Tenant)
    const companyRef = await adminDb.collection('companies').add({
      name: companyName,
      createdByUserId: uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    const companyId = companyRef.id;

    // 2) User-Dokument setzen (Rolle & companyId serverseitig festlegen)
    await adminDb.collection('users').doc(uid).set(
      {
        id: uid,
        email,
        displayName,
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
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 3) Custom Claims setzen (admin + companyId)
    if (adminAuth) {
      await adminAuth.setCustomUserClaims(uid, {
        role: 'admin',
        companyId,
      });
    }

    const response = NextResponse.json({ companyId }, { status: 201 });
    return addRateLimitHeaders(response, req);
  } catch (e: unknown) {
    logger.error('Error in register-admin', e instanceof Error ? e : undefined, {
      route: ROUTE,
      timestamp: new Date(),
    }, { component: 'POST /api/auth/register-admin' });
    return createErrorResponse(createAppError(e instanceof Error ? e : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}
