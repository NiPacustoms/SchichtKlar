import { NextRequest, NextResponse } from 'next/server';
import { invitationService } from '@/lib/services/invitations';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { checkRateLimit, addRateLimitHeaders } from '@/lib/middleware/rateLimit';
import { validateRequest, acceptInviteSchema } from '@/lib/validations';
import {
  createErrorResponse,
  createNotFoundErrorResponse,
  createValidationErrorResponse,
} from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

const ROUTE = '/api/auth/accept-invite';

/**
 * Betriebsmodell: Eingeladene Mitarbeiter erhalten Rolle nurse.
 * Admin registriert Firma (register-admin → admin), lädt ein; Annahme hier → nurse. Siehe docs/ROLLEN-UND-EINLADUNGEN.md.
 */
// POST /api/auth/accept-invite
// Body: { token: string, password: string, displayName?: string, firstName?, lastName? }
export async function POST(req: NextRequest) {
  try {
    // Rate Limiting prüfen (IP-basiert für Auth-Routen)
    const rateLimitResponse = checkRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Request-Body validieren
    const validation = await validateRequest(req, acceptInviteSchema);
    if (!validation.success) {
      return validation.response;
    }
    const body = validation.data;
    const { token, password, firstName, lastName } = body;
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : undefined;

    const invite = await invitationService.getByToken(token);
    if (!invite) return createNotFoundErrorResponse('Einladung nicht gefunden.', ROUTE);
    if (invite.acceptedAt)
      return createValidationErrorResponse('Einladung bereits verwendet.', ErrorCode.VALIDATION_DUPLICATE_VALUE, ROUTE);
    const now = Date.now();
    const exp = invite.expiresAt?.getTime?.() || 0;
    if (exp && now > exp)
      return createErrorResponse(createAppError(new Error('Einladung abgelaufen.'), ErrorCode.INVITATION_EXPIRED, { route: ROUTE }));

    // 1) Firebase Auth Benutzer anlegen (mit E-Mail aus Einladung)
    if (!auth) throw new Error('Auth not initialized');
    const cred = await createUserWithEmailAndPassword(auth!, invite.email, password);
    const user = cred.user;
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // E-Mail-Verifizierung senden
    try {
      const { sendEmailVerification } = await import('firebase/auth');
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/anmelden`,
        handleCodeInApp: false,
      };
      await sendEmailVerification(user, actionCodeSettings);
    } catch (emailError) {
      // E-Mail-Verifizierung ist nicht kritisch, nur loggen
      logger.warn('Failed to send email verification', {}, { error: emailError });
    }

    // 2) Firestore User-Dokument anlegen (serverseitig Rolle & companyId)
    if (!db) throw new Error('Firestore not initialized');
    await setDoc(
      doc(db, 'users', user.uid),
      {
        id: user.uid,
        email: invite.email,
        displayName: displayName || user.email?.split('@')[0] || 'Mitarbeiter',
        role: 'nurse',
        companyId: invite.companyId,
        active: true,
        qualifications: [],
        documents: [],
        address: {},
        contact: {},
        emergencyContact: {},
        bankAccount: {},
        education: {},
        driversLicense: {},
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

    // 3) Einladung als akzeptiert markieren (einmalig nutzbar)
    await invitationService.markAcceptedByToken(token);

    const response = NextResponse.json(
      { userId: user.uid, companyId: invite.companyId },
      { status: 201 }
    );
    return addRateLimitHeaders(response, req);
  } catch (e: unknown) {
    logger.error(
      'Error in accept-invite',
      e instanceof Error ? e : undefined,
      { route: ROUTE, timestamp: new Date() },
      { component: 'POST /api/auth/accept-invite' }
    );
    return createErrorResponse(createAppError(e instanceof Error ? e : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE }));
  }
}
