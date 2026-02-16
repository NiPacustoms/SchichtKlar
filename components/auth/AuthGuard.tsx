'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger } from '@/lib/logging';

import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminSettingsService } from '@/lib/services/adminSettings';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, loading, firebaseUser } = useAuth();
  const router = useRouter();
  const isE2E =
    typeof window !== 'undefined' &&
    (window as unknown as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__ === true;
  const isAdmin = user?.role === 'admin' || user?.role === 'dispatcher';
  const [isSyncingClaims, setIsSyncingClaims] = useState(false);

  // Debug: Logge die Rolle wenn requireAdmin true ist
  useEffect(() => {
    if (requireAdmin && !loading && user) {
      logger.info('[AuthGuard] Prüfe Admin-Zugriff:', {
        role: user.role,
        isAdmin: isAdmin,
        email: user.email,
        id: user.id,
      });
    }
  }, [requireAdmin, loading, user, isAdmin]);

  // Load admin settings only if user is admin/dispatcher
  const { data: settings } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminSettingsService.getSettings(),
    enabled: isAdmin,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const twoFactorRequired = settings?.twoFactorRequired || false;

  // Sync claims if user is admin but claims might be missing
  useEffect(() => {
    if (requireAdmin && user && firebaseUser && !loading && !isE2E) {
      const checkAndSyncClaims = async () => {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const hasRoleClaim = Boolean(tokenResult.claims.role);
          const claimRole = tokenResult.claims.role as string | undefined;

          // Wenn User Admin-Rolle hat, aber Claims fehlen oder nicht übereinstimmen
          if (
            (user.role === 'admin' || user.role === 'dispatcher') &&
            (!hasRoleClaim || claimRole !== user.role)
          ) {
            setIsSyncingClaims(true);
            const token = await firebaseUser.getIdToken(true);
            const response = await fetch('/api/auth/sync-claims', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              // Token erneut aktualisieren, um neue Claims zu laden
              await firebaseUser.getIdToken(true);
              // Seite neu laden, um sicherzustellen, dass alles aktualisiert ist
              window.location.reload();
            } else {
              setIsSyncingClaims(false);
            }
          }
        } catch (error) {
          logger.error('Failed to sync claims:', error);
          setIsSyncingClaims(false);
        }
      };

      checkAndSyncClaims();
    }
  }, [requireAdmin, user, firebaseUser, loading, isE2E]);

  useEffect(() => {
    if (isE2E) {
      // Im E2E-Modus nicht clientseitig weg-redirecten, bis Mock-User gesetzt ist
      return;
    }
    if (!loading && !user) {
      router.push('/anmelden');
    }
  }, [loading, user, router, isE2E]);

  if (loading || isSyncingClaims || (!user && typeof window !== 'undefined')) {
    return (
      <LoadingSpinner
        variant="fullscreen"
        message={
          isSyncingClaims
            ? 'Berechtigungen werden synchronisiert...'
            : loading
              ? 'Authentifizierung wird überprüft...'
              : 'Weiterleitung zum Login...'
        }
        size={60}
        showLogo={true}
      />
    );
  }

  if (requireAdmin && !(user?.role === 'admin' || user?.role === 'dispatcher')) {
    // Debug: Logge die aktuelle Rolle
    logger.error('[AuthGuard] Zugriff verweigert - Rolle:', user?.role, 'User:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      companyId: user?.companyId,
    });

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-2">Sie haben keine Administratorrechte für diese Seite.</p>
          <p className="text-sm text-gray-500 mb-2">
            Aktuelle Rolle: <strong>{user?.role || 'unbekannt'}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-4">Erforderliche Rolle: admin oder dispatcher</p>

          {/* Debug-Informationen immer anzeigen */}
          <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
            <p>
              <strong>Debug-Informationen:</strong>
            </p>
            <p>User ID: {user?.id || 'N/A'}</p>
            <p>Email: {user?.email || 'N/A'}</p>
            <p>Rolle: {user?.role || 'NICHT GESETZT'}</p>
            <p>Company ID: {user?.companyId || 'NICHT GESETZT'}</p>
            <p className="mt-2">
              <a href="/debug-role" className="text-blue-600 underline">
                → Zur Debug-Seite gehen
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Enforce MFA for admins when required by system settings
  const mfaRequired = twoFactorRequired;
  const isPrivileged = user?.role === 'admin' || user?.role === 'dispatcher';
  const hasMfa = !!(
    firebaseUser &&
    'multiFactor' in firebaseUser &&
    (firebaseUser as any).multiFactor?.enrolledFactors?.length
  );
  if (requireAdmin && isPrivileged && mfaRequired && !hasMfa) {
    if (typeof window !== 'undefined') {
      // Redirect admin to secure setup page
      router.push('/admin/sicherheits-check');
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">2FA erforderlich</h1>
          <p className="text-gray-600">
            Bitte richte die Zwei-Faktor-Authentifizierung ein, um fortzufahren.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
