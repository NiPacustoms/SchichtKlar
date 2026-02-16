import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '@/lib/services/companies';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { adminAuth, adminDb, verifyIdToken, getRoleFromToken } from '@/lib/server/firebaseAdmin';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/middleware/rateLimit';
import { validateRequest, registerAdminSchema } from '@/lib/validations';
import { createAuthErrorResponse, createErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ROUTE = '/api/auth/register-admin';

// Hinweis: In Produktion sollte hier ein Firebase Admin SDK Token-Check erfolgen.
// Aktuell wird erwartet, dass der Client bereits einen Firebase-Auth-User erstellt hat
// und dessen uid in der Anfrage mitsendet. Die Rolle wird serverseitig auf 'admin' gesetzt.

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

    // RBAC: Nur Admins dürfen; Ausnahme: Bootstrap, wenn erlaubt und noch kein Admin existiert
    const bootstrapEnabled = process.env.ENABLE_ADMIN_BOOTSTRAP === 'true';
    let adminExists = true;
    try {
      if (adminDb) {
        const snap = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
        adminExists = !snap.empty;
      } else if (db) {
        const snap = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'admin'), limit(1))
        );
        adminExists = !snap.empty;
      }
    } catch {
      // konservativ bleiben
      adminExists = true;
    }

    // Custom Claims prüfen (role kann in decoded.role oder decoded.customClaims.role sein)
    const requesterRole = getRoleFromToken(decoded);
    const isRequesterAdmin = requesterRole === 'admin';

    // Bei der ersten Admin-Registrierung hat der Benutzer noch keine Rolle
    // Bootstrap ermöglicht die erste Admin-Registrierung ohne bestehende Admin-Rolle
    if (!isRequesterAdmin) {
      if (!bootstrapEnabled || adminExists) {
        const message = !bootstrapEnabled
          ? 'Admin-Registrierung ist nicht aktiviert. Bitte kontaktieren Sie einen Administrator.'
          : 'Admin role required';
        return createErrorResponse(
          createAppError(new Error(message), ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, { route: ROUTE })
        );
      }
    }

    // Token-UID wird bereits aus decoded verwendet

    // 1) Company anlegen
    const company = await companyService.create(companyName, uid);

    // 2) User-Dokument setzen (serverseitig Rolle & companyId festlegen)
    if (!db) throw new Error('Firestore not initialized');
    await setDoc(
      doc(db, 'users', uid),
      {
        id: uid,
        email,
        displayName,
        role: 'admin',
        companyId: company.id,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 3) Custom Claims setzen (admin + companyId)
    if (adminAuth) {
      await adminAuth.setCustomUserClaims(uid, {
        role: 'admin',
        companyId: company.id,
      });
    }

    const response = NextResponse.json({ companyId: company.id }, { status: 201 });
    return addRateLimitHeaders(response, req);
  } catch (e: unknown) {
    logger.error('Error in register-admin', e instanceof Error ? e : undefined, {
      route: ROUTE,
      timestamp: new Date(),
    }, { component: 'POST /api/auth/register-admin' });
    return createErrorResponse(createAppError(e instanceof Error ? e : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}
