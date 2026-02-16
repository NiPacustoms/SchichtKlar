/**
 * Proxy für createWithMatching (Pfad /api/cf, um Routing-Probleme zu umgehen).
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  createErrorResponse,
  createAuthErrorResponse,
  createValidationErrorResponse,
  createAppError,
  ErrorCode,
} from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getProjectId(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    ''
  );
}

type Payload = {
  facilityId: string;
  companyId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  qualification?: string;
  hours?: number;
  limit?: number;
  selectedUserIds?: string[];
};

function isPayload(body: unknown): body is Payload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.facilityId === 'string' &&
    typeof b.companyId === 'string' &&
    typeof b.startDate === 'string' &&
    typeof b.startTime === 'string' &&
    typeof b.endTime === 'string'
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
}

export async function POST(req: NextRequest) {
  const route = '/api/cf';
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return createAuthErrorResponse('UNAUTHENTICATED', route);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return createValidationErrorResponse('Invalid JSON body', undefined, route);
  }

  if (!isPayload(body)) {
    return createValidationErrorResponse(
      'Invalid payload: facilityId, companyId, startDate, startTime, endTime required',
      undefined,
      route
    );
  }

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
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({ data: body }),
    });

    const raw = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      if (!res.ok) {
        return createErrorResponse(
          createAppError(new Error(res.statusText || raw.slice(0, 200)), ErrorCode.INTERNAL_ERROR, {
            route,
          })
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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return createErrorResponse(
      createAppError(new Error(`Proxy request failed: ${message}`), ErrorCode.INTERNAL_ERROR, {
        route: '/api/cf',
      })
    );
  }
}
