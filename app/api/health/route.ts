import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { createErrorResponse } from '@/lib/errors/apiErrorResponse';
import { createAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const runtime = 'nodejs';

const ROUTE = '/api/health';

export async function GET() {
  try {
    const uptimeSeconds = Math.floor(process.uptime());
    const health: {
      status: string;
      timestamp: number;
      uptimeSeconds: number;
      env: string;
      firebase?: { connected: boolean; error?: string };
    } = {
      status: 'ok',
      timestamp: Date.now(),
      uptimeSeconds,
      env: process.env.NODE_ENV || 'unknown',
    };

    // Prüfe Firebase/Database-Verbindung
    try {
      if (adminDb) {
        // Teste Firestore-Verbindung durch einfache Query
        await adminDb.collection('_health').limit(1).get();
        health.firebase = { connected: true };
      } else {
        health.firebase = { connected: false, error: 'Firebase Admin not initialized' };
        health.status = 'degraded';
      }
    } catch (firebaseError) {
      const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'unknown';
      health.firebase = { connected: false, error: errorMessage };
      health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
  } catch (e: unknown) {
    return createErrorResponse(createAppError(e instanceof Error ? e : new Error('unknown'), ErrorCode.SERVICE_UNAVAILABLE, { route: ROUTE }));
  }
}
