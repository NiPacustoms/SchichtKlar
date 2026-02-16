import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { createNotFoundErrorResponse } from '@/lib/errors/apiErrorResponse';

export const runtime = 'nodejs';

const ROUTE = '/api/debug/admin-status';

export async function GET(_req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return createNotFoundErrorResponse('Not available in production', ROUTE);
  }

  try {
    const initialized = admin.apps.length > 0;
    const app = initialized ? admin.app() : null;
    const opts = app ? (app.options as Record<string, unknown>) : {};
    const projectId =
      (opts as { projectId?: string })?.projectId ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      null;
    return NextResponse.json({ initialized, projectId }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ initialized: false, error: message }, { status: 200 });
  }
}
