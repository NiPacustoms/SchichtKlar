import { NextRequest, NextResponse } from 'next/server';
import type { Firestore } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { requireAuthContext, HttpError } from '@/lib/server/requestContext';
import { parseShiftToUTC, checkOverlap } from '@/lib/utils/shiftTimeUtils';
import {
  errorHandler,
  createErrorResponse,
  createValidationErrorResponse,
  createAppError,
  ErrorCode,
  isAppError,
} from '@/lib/errors';

export const runtime = 'nodejs';

type AvailablePayload = {
  companyId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  qualification?: string;
};

type CreatePayload = AvailablePayload & {
  facilityId: string;
  hours?: number;
  limit?: number;
  selectedUserIds?: string[];
};

function isAvailablePayload(body: unknown): body is AvailablePayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.companyId === 'string' &&
    typeof b.startDate === 'string' &&
    typeof b.startTime === 'string' &&
    typeof b.endTime === 'string'
  );
}

function isCreatePayload(body: unknown): body is CreatePayload {
  return (
    isAvailablePayload(body) && typeof (body as Record<string, unknown>).facilityId === 'string'
  );
}

function getProjectId(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    ''
  );
}

async function isUserAvailableForSlot(
  db: Firestore,
  userId: string,
  startUTC: Date,
  endUTC: Date
): Promise<boolean> {
  const myAssignments = await db
    .collection('assignments')
    .where('userId', '==', userId)
    .where('status', 'in', ['assigned', 'accepted'])
    .get();

  for (const aDoc of myAssignments.docs) {
    const a = aDoc.data();
    const shiftId = a.shiftId;
    if (!shiftId) continue;
    const shiftSnap = await db
      .collection('shifts')
      .doc(shiftId as string)
      .get();
    if (!shiftSnap.exists) continue;
    const shift = shiftSnap.data()!;
    const shiftDate = (shift.date as { toDate?: () => Date })?.toDate?.() ?? new Date();
    const { startUTC: sStart, endUTC: sEnd } = parseShiftToUTC(
      shiftDate,
      (shift.startTime as string) || '08:00',
      (shift.endTime as string) || '16:00',
      'Europe/Berlin'
    );
    if (checkOverlap({ start: startUTC, end: endUTC }, { start: sStart, end: sEnd })) {
      return false;
    }
  }
  return true;
}

async function getAvailableEmployeeIds(
  db: Firestore,
  companyId: string,
  startDate: string,
  startTime: string,
  endTime: string,
  qualification?: string
): Promise<string[]> {
  const date = new Date(startDate);
  const { startUTC, endUTC } = parseShiftToUTC(date, startTime, endTime, 'Europe/Berlin');

  const usersSnap = await db.collection('users').where('role', '==', 'nurse').get();
  const available: string[] = [];

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    const userCompanyId = user.companyId as string | undefined;
    if (userCompanyId && userCompanyId !== companyId) continue;

    if (qualification) {
      const qualifications = (user.qualifications as string[]) || [];
      if (!qualifications.includes(qualification)) continue;
    }

    const availableForSlot = await isUserAvailableForSlot(db, userDoc.id, startUTC, endUTC);
    if (availableForSlot) {
      available.push(userDoc.id);
    }
  }

  return available;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: { Allow: 'POST, OPTIONS' } });
}

export async function POST(req: NextRequest) {
  const route = '/api/assignment/available-employees';
  const authHeader = req.headers.get('authorization');

  // Token verifizieren und companyId serverseitig ableiten (nur Admins dürfen
  // Verfügbarkeiten/Matching auslösen). Die companyId aus dem Request-Body wird
  // IGNORIERT und durch die echte des Aufrufers ersetzt (kein Fremd-Tenant).
  let ctx;
  try {
    ctx = await requireAuthContext(req, { role: 'admin' });
  } catch (e) {
    if (e instanceof HttpError) return e.response;
    throw e;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return createValidationErrorResponse('Invalid JSON body', undefined, route);
  }
  // companyId im Payload hart auf die des Aufrufers setzen.
  if (body && typeof body === 'object') {
    (body as Record<string, unknown>).companyId = ctx.companyId;
  }

  if (isCreatePayload(body)) {
    const projectId = getProjectId();
    if (!projectId) {
      return createErrorResponse(
        createAppError(new Error('Firebase project ID not configured'), ErrorCode.INTERNAL_ERROR, {
          route,
        })
      );
    }
    const cfUrl = `https://us-central1-${projectId}.cloudfunctions.net/createWithMatching`;
    try {
      const res = await fetch(cfUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader ?? '' },
        body: JSON.stringify({ data: body }),
      });
      const raw = await res.text();
      let json: Record<string, unknown> = {};
      try {
        json = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        if (!res.ok) {
          return createErrorResponse(
            createAppError(
              new Error(res.statusText || raw.slice(0, 200)),
              ErrorCode.INTERNAL_ERROR,
              { route }
            )
          );
        }
      }
      const err = json.error as { status?: string; message?: string } | undefined;
      if (err && typeof err === 'object') {
        const message = err.message ?? 'Cloud Function error';
        const code =
          err.status === 'unauthenticated'
            ? ErrorCode.AUTH_REQUIRED
            : err.status === 'permission-denied'
              ? ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS
              : err.status === 'invalid-argument'
                ? ErrorCode.VALIDATION_REQUIRED_FIELD
                : ErrorCode.INTERNAL_ERROR;
        return createErrorResponse(createAppError(new Error(message), code, { route }));
      }
      if (!res.ok) {
        const msg = (json.error as { message?: string } | undefined)?.message ?? res.statusText;
        const code =
          res.status === 401
            ? ErrorCode.AUTH_REQUIRED
            : res.status === 403
              ? ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS
              : ErrorCode.INTERNAL_ERROR;
        return createErrorResponse(createAppError(new Error(msg), code, { route }));
      }
      const result = json.result as
        | {
            success?: boolean;
            assignmentId?: string;
            candidateUserIds?: string[];
            candidateCount?: number;
          }
        | undefined;
      if (!result) {
        return createErrorResponse(
          createAppError(
            new Error('Invalid response from createWithMatching'),
            ErrorCode.INTERNAL_ERROR,
            { route }
          )
        );
      }
      return NextResponse.json({
        success: result.success,
        assignmentId: result.assignmentId,
        candidateCount:
          result.candidateCount ??
          (Array.isArray(result.candidateUserIds) ? result.candidateUserIds.length : 0),
      });
    } catch (_e) {
      const message = _e instanceof Error ? _e.message : String(_e);
      return createErrorResponse(
        createAppError(new Error(`Proxy request failed: ${message}`), ErrorCode.INTERNAL_ERROR, {
          route: '/api/assignment/available-employees',
        })
      );
    }
  }

  if (!isAvailablePayload(body)) {
    return createValidationErrorResponse(
      'Invalid payload: companyId, startDate, startTime, endTime required',
      undefined,
      route
    );
  }

  if (!adminDb) {
    return createErrorResponse(
      createAppError(new Error('Database not available'), ErrorCode.SERVICE_UNAVAILABLE, { route })
    );
  }

  try {
    const availableUserIds = await getAvailableEmployeeIds(
      adminDb,
      body.companyId,
      body.startDate,
      body.startTime,
      body.endTime,
      body.qualification
    );
    return NextResponse.json({ availableUserIds });
  } catch (e: unknown) {
    const appError = isAppError(e)
      ? e
      : errorHandler.handleFirebaseError(
          e,
          { route: '/api/assignment/available-employees' },
          { component: 'POST getAvailableEmployeeIds' }
        );
    return createErrorResponse(appError);
  }
}
