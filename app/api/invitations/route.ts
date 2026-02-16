import { NextRequest, NextResponse } from 'next/server';
import { invitationService } from '@/lib/services/invitations';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { companyService } from '@/lib/services/companies';
import { isAdmin } from '@/lib/utils/authz';
import {
  createValidationErrorResponse,
  createNotFoundErrorResponse,
  createAuthErrorResponse,
  createErrorResponse,
} from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

const ROUTE = '/api/invitations';

// POST /api/invitations
// Body: { adminUid: string, email: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminUid, email } = body || {};
    if (!adminUid || !email) {
      return createValidationErrorResponse('adminUid und email erforderlich.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);
    }

    if (!db) throw new Error('Firestore not initialized');
    const adminDoc = await getDoc(doc(db, 'users', adminUid));
    if (!adminDoc.exists())
      return createNotFoundErrorResponse('Admin nicht gefunden.', ROUTE);
    const admin = adminDoc.data();
    if (!isAdmin(admin))
      return createAuthErrorResponse('UNAUTHORIZED', ROUTE);
    let companyId = admin.companyId as string | undefined;
    if (!companyId) {
      // Auto-Anlage einer Company und Verknüpfung mit dem Admin
      const companyName = admin.companyName || admin.displayName || 'Meine Firma';
      const newCompany = await companyService.create(companyName, adminUid);
      companyId = newCompany.id;
      await updateDoc(doc(db, 'users', adminUid), { companyId });
    }

    const invitation = await invitationService.create(companyId, email, adminUid);

    // Optional: Firmenname laden für E-Mail
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    const companyName = companyDoc.exists() ? companyDoc.data()?.name : 'Ihre Firma';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const acceptLink = `${baseUrl}/accept-invite?token=${encodeURIComponent(invitation.token)}`;
    // Hinweis: Versand der E-Mail erfolgt über Firebase Auth (Magic Link) clientseitig

    return NextResponse.json(
      {
        invitationId: invitation.id,
        token: invitation.token,
        expiresAt: invitation.expiresAt?.toISOString?.() || invitation.expiresAt,
        acceptLink,
        companyName,
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    const appError = createAppError(e instanceof Error ? e : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE });
    return createErrorResponse(appError);
  }
}

// GET /api/invitations?adminUid=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminUid = searchParams.get('adminUid');
    if (!adminUid) return createValidationErrorResponse('adminUid erforderlich.', ErrorCode.VALIDATION_REQUIRED_FIELD, ROUTE);

    if (!db) throw new Error('Firestore not initialized');
    const adminDoc = await getDoc(doc(db, 'users', adminUid));
    if (!adminDoc.exists())
      return createNotFoundErrorResponse('Admin nicht gefunden.', ROUTE);
    const admin = adminDoc.data();
    if (!isAdmin(admin)) return createAuthErrorResponse('UNAUTHORIZED', ROUTE);
    const companyId = admin.companyId as string | undefined;
    if (!companyId) return NextResponse.json({ data: [], total: 0 }, { status: 200 });

    const q = query(collection(db, 'invitations'), where('companyId', '==', companyId));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => {
      const x = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        email: x.email as string,
        companyId: x.companyId as string,
        token: x.token as string,
        createdAt: (x.createdAt as { toDate?: () => Date })?.toDate?.() || null,
        acceptedAt: (x.acceptedAt as { toDate?: () => Date })?.toDate?.() || null,
        expiresAt:
          (x.expiresAt as { toDate?: () => Date })?.toDate?.() ||
          (x.expiresAt ? new Date(x.expiresAt as string | number) : null),
      };
    });
    return NextResponse.json({ data, total: data.length }, { status: 200 });
  } catch (e: unknown) {
    const appError = createAppError(e instanceof Error ? e : new Error('Internal error'), ErrorCode.INTERNAL_ERROR, { route: ROUTE });
    return createErrorResponse(appError);
  }
}
