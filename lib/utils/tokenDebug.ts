/**
 * Debug-Hilfsfunktionen für Token und Custom Claims Monitoring
 */

import { auth } from '@/lib/firebase';
import { logger } from '@/lib/utils/logger';

/**
 * Prüft den Token-Status und gibt Debug-Informationen aus
 * Nützlich für Monitoring und Troubleshooting
 */
export async function debugTokenStatus(): Promise<{
  authenticated: boolean;
  uid: string | null;
  companyId: string | null;
  role: string | null;
  tokenExpiry: Date | null;
  allClaims: Record<string, unknown>;
  needsRefresh: boolean;
}> {
  try {
    if (!auth?.currentUser) {
      return {
        authenticated: false,
        uid: null,
        companyId: null,
        role: null,
        tokenExpiry: null,
        allClaims: {},
        needsRefresh: true,
      };
    }

    const user = auth.currentUser;
    
    // Hole Token-Resultat (ohne Force-Refresh für Status-Check)
    const tokenResult = await user.getIdTokenResult(false);
    
    // Prüfe, ob Token bald abläuft (innerhalb der nächsten 5 Minuten)
    const expiryTime = tokenResult.expirationTime ? new Date(tokenResult.expirationTime).getTime() : null;
    const now = Date.now();
    const needsRefresh = expiryTime ? (expiryTime - now) < 5 * 60 * 1000 : false;

    return {
      authenticated: true,
      uid: user.uid,
      companyId: (tokenResult.claims.companyId as string | undefined) || null,
      role: (tokenResult.claims.role as string | undefined) || null,
      tokenExpiry: tokenResult.expirationTime ? new Date(tokenResult.expirationTime) : null,
      allClaims: tokenResult.claims,
      needsRefresh,
    };
  } catch (error) {
    logger.error('[tokenDebug] Error checking token status:', error);
    return {
      authenticated: false,
      uid: null,
      companyId: null,
      role: null,
      tokenExpiry: null,
      allClaims: {},
      needsRefresh: true,
    };
  }
}

/**
 * Erzwingt Token-Refresh und gibt Debug-Informationen aus
 */
export async function refreshTokenAndDebug(): Promise<{
  success: boolean;
  before: Awaited<ReturnType<typeof debugTokenStatus>>;
  after: Awaited<ReturnType<typeof debugTokenStatus>>;
  error?: string;
}> {
  const before = await debugTokenStatus();
  
  try {
    if (!auth?.currentUser) {
      return {
        success: false,
        before,
        after: before,
        error: 'No authenticated user',
      };
    }

    // Erzwinge Token-Refresh
    await auth.currentUser.getIdToken(true);
    
    // Hole neuen Status
    const after = await debugTokenStatus();
    
    return {
      success: true,
      before,
      after,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[tokenDebug] Error refreshing token:', error);
    return {
      success: false,
      before,
      after: before,
      error: errorMsg,
    };
  }
}

/**
 * Loggt Token-Status in die Konsole (nur in Development)
 */
export async function logTokenStatus(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const status = await debugTokenStatus();
  
  logger.group('[Token Debug]');
  logger.debug('Authenticated:', status.authenticated);
  if (status.authenticated) {
    logger.debug('UID:', status.uid);
    logger.debug('Company ID:', status.companyId || '❌ NOT SET');
    logger.debug('Role:', status.role || '❌ NOT SET');
    logger.debug('Token Expiry:', status.tokenExpiry?.toISOString() || 'unknown');
    logger.debug('Needs Refresh:', status.needsRefresh ? '⚠️ YES' : '✅ NO');
    logger.debug('All Claims:', status.allClaims);
  }
  logger.groupEnd();
}

export async function syncCustomClaims(): Promise<{ success: boolean; message?: string }> {
  if (!auth?.currentUser) {
    return { success: false, message: 'Kein Nutzer eingeloggt' };
  }

  try {
    const token = await auth.currentUser.getIdToken(true);
    const response = await fetch('/api/auth/sync-claims', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let message = 'Sync fehlgeschlagen';
      try {
        const body = await response.json();
        if (body?.message) {
          message = body.message;
        }
      } catch {
        // ignore
      }
      return { success: false, message };
    }

    await auth.currentUser.getIdToken(true);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unbekannter Fehler',
    };
  }
}

