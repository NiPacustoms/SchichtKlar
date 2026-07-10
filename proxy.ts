import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy für Schichtklar (Next.js 16+)
 *
 * Funktionalität:
 * 1. Zentrale Redirects (Doppelungen/englische URLs → kanonische Routen)
 * 2. Security Headers setzen (CSP, HSTS, X-Frame-Options, etc.)
 * 3. Route-Schutz für /admin/* und /employee/* Routen
 *
 * Standard-Runtime ist Node.js. Token-Verifikation erfolgt client-seitig oder in API Routes.
 */

/**
 * Redirect-Map: Nur deutsche Kurz-URLs → kanonische Routen (keine englischen URLs).
 */
const DE_REDIRECTS: Record<string, string> = {
  // Root-Level → Employee
  '/zeiterfassung': '/employee/zeiterfassung',
  '/zeiten': '/employee/zeiten',
  '/dienstplan': '/employee/dienstplan',
  '/profil': '/employee/profil',
  '/dokumente': '/employee/dokumente',
  '/documents': '/dokumente',
  '/accept-invite': '/einladung-annehmen',
  '/messenger': '/employee/arbeitsplatz',
  '/benachrichtigungen': '/employee/arbeitsplatz',
  '/nachrichten': '/employee/arbeitsplatz',
  // Root → Status/Wartung
  '/status': '/systemstatus',
  // Root → Admin
  '/einrichtungen': '/admin/einrichtungen',
  // Englische Root-URLs → deutsche Routen
  '/facilities': '/einrichtungen',
  '/profile': '/profil',
  '/schedule': '/admin/dienstplan',
  '/dashboard': '/employee/arbeitsplatz',
  '/maintenance': '/wartung',
  '/time': '/employee/zeiten',
  // Employee-Doppelungen → kanonisch
  '/employee/dashboard': '/employee/arbeitsplatz',
  '/employee/assignments': '/employee/einsaetze',
  // Auth/Legal (englische URLs → deutsche kanonische Routen)
  '/login': '/anmelden',
  '/register': '/registrieren',
  '/forgot-password': '/passwort-vergessen',
  '/admin-register': '/admin-registrieren',
  // Admin (englisch → deutsch)
  '/admin/dashboard': '/admin/schichten',
  '/admin/assignments': '/admin/einsaetze',
  '/admin/shifts': '/admin/schichten',
  '/admin/staff': '/admin/mitarbeiter',
  '/admin/audit-logs': '/admin/pruefprotokolle',
  // Legal
  '/legal/imprint': '/recht/impressum',
  '/legal/privacy': '/recht/datenschutz',
};

const PROTECTED_ROUTES = ['/admin', '/employee'];
const ADMIN_ROUTES = ['/admin'];
const EMPLOYEE_ROUTES = ['/employee'];

/** Cookie, der serverseitig bei Session-Set gesetzt wird – nur "admin" oder "nurse". */
const ROLE_COOKIE_NAME = 'jobflow_role';

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
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.cloudfunctions.net wss://*.firebaseio.com",
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Zentrale Redirects: alte/englische/Doppel-URLs → kanonische Routen
  const redirectTarget = DE_REDIRECTS[pathname];
  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  // Create response
  let response = NextResponse.next();

  // Set security headers for all responses
  response = setSecurityHeaders(response);

  // Skip proxy for public routes
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return response;
  }

  // Skip proxy for static files
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return response;
  }

  // Geschützte Routen: Auth + strikte Rollentrennung (niemand kann Routen übertreten)
  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    if (!hasAuthToken(request)) {
      const loginUrl = new URL('/anmelden', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const roleCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value;

    if (matchesRoute(pathname, ADMIN_ROUTES)) {
      if (roleCookie !== 'admin') {
        return NextResponse.redirect(new URL('/employee/arbeitsplatz', request.url));
      }
    }

    if (matchesRoute(pathname, EMPLOYEE_ROUTES)) {
      if (roleCookie === 'admin') {
        return NextResponse.redirect(new URL('/admin/uebersicht', request.url));
      }
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
