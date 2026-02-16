import { NextRequest, NextResponse } from 'next/server';
import { getRateLimiter, type RateLimitResult } from '@/lib/utils/rateLimit';

/**
 * Rate-Limiting-Konfigurationen für verschiedene API-Route-Typen
 */
export const RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 60 * 1000, // 1 Minute
    max: 5, // 5 Requests pro Minute pro IP
  },
  chat: {
    windowMs: 60 * 1000, // 1 Minute
    max: 60, // 60 Requests pro Minute pro User
  },
  admin: {
    windowMs: 60 * 1000, // 1 Minute
    max: 30, // 30 Requests pro Minute pro User
  },
  templates: {
    windowMs: 60 * 1000, // 1 Minute
    max: 20, // 20 Requests pro Minute pro User
  },
  health: {
    windowMs: 60 * 1000, // 1 Minute
    max: 10, // 10 Requests pro Minute pro IP
  },
  default: {
    windowMs: 60 * 1000, // 1 Minute
    max: 30, // 30 Requests pro Minute
  },
} as const;

type RateLimitConfigType = keyof typeof RATE_LIMIT_CONFIGS;

/**
 * Bestimmt den Rate-Limit-Typ basierend auf dem API-Pfad
 */
function getRateLimitType(pathname: string): RateLimitConfigType {
  if (pathname.startsWith('/api/auth/')) {
    return 'auth';
  }
  if (pathname.startsWith('/api/chat/')) {
    return 'chat';
  }
  if (pathname.startsWith('/api/admin/')) {
    return 'admin';
  }
  if (pathname.startsWith('/api/templates/')) {
    return 'templates';
  }
  if (pathname.startsWith('/api/health') || pathname.startsWith('/api/debug/')) {
    return 'health';
  }
  return 'default';
}

/**
 * Generiert einen Rate-Limit-Key basierend auf Request-Typ
 * Für IP-basierte Limits: verwendet IP-Adresse
 * Für User-basierte Limits: verwendet User-ID (falls verfügbar)
 */
function getRateLimitKey(
  request: NextRequest,
  type: RateLimitConfigType,
  userId?: string
): string {
  // Für User-basierte Limits (chat, admin, templates)
  if ((type === 'chat' || type === 'admin' || type === 'templates') && userId) {
    return `${type}:user:${userId}`;
  }

  // Für IP-basierte Limits (auth, health)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return `${type}:ip:${ip}`;
}

/**
 * Rate-Limiting-Middleware für API-Routen
 * 
 * @param request - Next.js Request-Objekt
 * @param userId - Optional: User-ID für User-basierte Rate Limits
 * @returns NextResponse mit Rate-Limit-Headers oder null wenn erlaubt
 */
export function checkRateLimit(
  request: NextRequest,
  userId?: string
): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const type = getRateLimitType(pathname);
  const config = RATE_LIMIT_CONFIGS[type];
  
  const limiter = getRateLimiter({
    windowMs: config.windowMs,
    max: config.max,
  });

  const key = getRateLimitKey(request, type, userId);
  const result: RateLimitResult = limiter.check(key);

  // Wenn Request erlaubt ist, null zurückgeben (keine Response)
  if (result.allowed) {
    return null;
  }

  // Rate Limit überschritten - 429 Response mit Headers
  const resetTime = Math.ceil(Date.now() / 1000) + result.retryAfterSeconds;
  
  return NextResponse.json(
    {
      message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': config.max.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString(),
        'Retry-After': result.retryAfterSeconds.toString(),
      },
    }
  );
}

/**
 * Helper-Funktion zum Hinzufügen von Rate-Limit-Headern zu erfolgreichen Responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
  userId?: string
): NextResponse {
  const pathname = request.nextUrl.pathname;
  const type = getRateLimitType(pathname);
  const config = RATE_LIMIT_CONFIGS[type];

  const limiter = getRateLimiter({
    windowMs: config.windowMs,
    max: config.max,
  });

  const key = getRateLimitKey(request, type, userId);
  const result: RateLimitResult = limiter.check(key);

  // Headers hinzufügen (auch wenn Request erlaubt ist, für Information)
  response.headers.set('X-RateLimit-Limit', config.max.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  
  const resetTime = Math.ceil(Date.now() / 1000) + result.retryAfterSeconds;
  response.headers.set('X-RateLimit-Reset', resetTime.toString());

  return response;
}

