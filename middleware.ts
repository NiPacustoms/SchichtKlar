import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware für JobFlow
 *
 * Funktionalität:
 * 1. Zentrale Redirects (Doppelungen/englische URLs → kanonische Routen)
 * 2. Security Headers setzen (CSP, HSTS, X-Frame-Options, etc.)
 * 3. Route-Schutz für /admin/* und /employee/* Routen
 *
 * WICHTIG: Läuft im Edge Runtime - Firebase Admin SDK ist hier NICHT verfügbar.
 * Token-Verifikation erfolgt client-seitig oder in API Routes.
 */

/**
 * Zentrale Redirect-Map: Von (alte/englische/Doppel-URL) → Nach (kanonische Route).
 * Bestehende Links funktionieren weiter; Pages für diese Pfade wurden entfernt.
 */
const EN_TO_DE_REDIRECTS: Record<string, string> = {
  // Root-Level → Employee
  '/zeiterfassung': '/employee/zeiterfassung',
  '/zeiten': '/employee/zeiten',
  '/dienstplan': '/employee/dienstplan',
  '/profil': '/employee/profil',
  '/dokumente': '/employee/dokumente',
  '/benachrichtigungen': '/employee/arbeitsplatz',
  '/nachrichten': '/employee/arbeitsplatz',
  '/messenger': '/employee/arbeitsplatz',
  // Englische URLs → Employee
  '/schedule': '/employee/dienstplan',
  '/time': '/employee/zeiten',
  '/profile': '/employee/profil',
  '/documents': '/employee/dokumente',
  // Root → Status/Wartung
  '/status': '/systemstatus',
  '/maintenance': '/wartung',
  // Root → Admin
  '/einrichtungen': '/admin/einrichtungen',
  '/facilities': '/admin/einrichtungen',
  // Root /dashboard (Re-Export wurde entfernt)
  '/dashboard': '/employee/arbeitsplatz',
  // Employee-Doppelungen → kanonisch
  '/employee/dashboard': '/employee/arbeitsplatz',
  '/employee/assignments': '/employee/einsaetze',
  // Auth/Legal
  '/legal/privacy': '/recht/datenschutz',
  '/legal/imprint': '/recht/impressum',
  '/admin-register': '/admin-registrieren',
  // Admin-Doppelungen
  '/admin/dashboard': '/admin/schichten',
  '/admin/shifts': '/admin/schichten',
  '/admin/assignments': '/admin/schichten',
  // Debug
  '/debug-umgebung': '/debug-env',
};

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/admin',
  '/employee',
];

// Admin-only routes
const ADMIN_ROUTES = [
  '/admin',
];

// Employee-only routes
const EMPLOYEE_ROUTES = [
  '/employee',
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/anmelden',
  '/registrieren',
  '/admin-registrieren',
  '/passwort-vergessen',
  '/einladung-annehmen',
  '/recht',
  '/legal',
  '/api',
  '/_next',
  '/favicon.ico',
  '/systemstatus',
  '/wartung',
];

/**
 * Check if a path matches any of the route patterns
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => pathname.startsWith(route));
}

/**
 * Set security headers
 */
function setSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com https://www.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}

/**
 * Check if user is authenticated (basic check via cookie/token)
 * In Edge Runtime, we can only check for presence of auth token, not verify it.
 * Full verification happens client-side or in API routes.
 */
function hasAuthToken(request: NextRequest): boolean {
  // Check for Firebase Auth token in cookies
  const authCookie = request.cookies.get('__session') || request.cookies.get('authToken');
  if (authCookie) return true;

  // Check for Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) return true;

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Zentrale Redirects: alte/englische/Doppel-URLs → kanonische Routen
  const redirectTarget = EN_TO_DE_REDIRECTS[pathname];
  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  // Create response
  let response = NextResponse.next();

  // Set security headers for all responses
  response = setSecurityHeaders(response);

  // Skip middleware for public routes
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return response;
  }

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return response;
  }

  // Check protected routes
  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    // Basic auth check (token presence only)
    // Full RBAC verification happens client-side via RoleGuard
    if (!hasAuthToken(request)) {
      // Redirect to login if no auth token found
      const loginUrl = new URL('/anmelden', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Route-specific checks (basic - full RBAC in RoleGuard)
    if (matchesRoute(pathname, ADMIN_ROUTES)) {
      // Admin routes: Basic check only, full role check in RoleGuard
      // In Edge Runtime, we can't verify the token's role claim
      // This is handled by RoleGuard component on the client side
    }

    if (matchesRoute(pathname, EMPLOYEE_ROUTES)) {
      // Employee routes: Basic check only, full role check in RoleGuard
      // In Edge Runtime, we can't verify the token's role claim
      // This is handled by RoleGuard component on the client side
    }
  }

  return response;
}

// Matcher configuration
// Match all routes except static files and API routes (unless they need protection)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
