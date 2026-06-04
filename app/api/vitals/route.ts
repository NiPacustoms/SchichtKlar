import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const metric = await req.json();
    // Hier können Web Vitals an Sentry, Datadog, etc. weitergeleitet werden
    // Momentan nur loggen – Sentry-Integration via sentry.client.config.ts empfohlen
    if (process.env.NODE_ENV !== 'production') {
      console.log('[vitals]', metric);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
