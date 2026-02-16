'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Box, Typography } from '@mui/material';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ('nurse' | 'admin' | 'dispatcher')[];
  requireTenantId?: boolean;
  facilityScopeId?: string; // wenn gesetzt, prüfe ob user Zugriff auf diese Facility besitzt
}

const REDIRECT_TARGETS: Record<'nurse' | 'admin' | 'dispatcher', string> = {
  nurse: '/employee/arbeitsplatz',
  admin: '/admin/uebersicht',
  dispatcher: '/admin/uebersicht',
};

export function RoleGuard({
  children,
  allowedRoles,
  requireTenantId,
  facilityScopeId,
}: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const allowedRolesSet = useMemo(() => new Set(allowedRoles), [allowedRoles]);

  // #region agent log
  // Log component entry with props and user state
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'RoleGuard.tsx:22',
        message: 'RoleGuard component render',
        data: {
          allowedRoles,
          requireTenantId,
          facilityScopeId,
          userRole: user?.role,
          userCompanyId: user?.companyId,
          userFacilityIds: user?.facilityIds,
          loading,
          isRedirecting,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
  }, [
    allowedRoles,
    requireTenantId,
    facilityScopeId,
    user?.role,
    user?.companyId,
    user?.facilityIds,
    loading,
    isRedirecting,
  ]);
  // #endregion

  // Automatische Weiterleitung: Wenn Admin/Dispatcher auf Employee-Seiten zugreift, weiterleiten
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'RoleGuard.tsx:29',
        message: 'useEffect entry',
        data: {
          loading,
          hasUser: !!user,
          userRole: user?.role,
          userRoleType: typeof user?.role,
          isRedirecting,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion

    if (loading || !user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'RoleGuard.tsx:30',
          message: 'Early return - loading or no user',
          data: { loading, hasUser: !!user },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'RoleGuard.tsx:34',
        message: 'Before role check',
        data: {
          userRole: user.role,
          userRoleInSet: allowedRolesSet.has(user.role),
          allowedRoles: Array.from(allowedRolesSet),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion

    if (!allowedRolesSet.has(user.role)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'RoleGuard.tsx:34',
          message: 'User role not in allowed set',
          data: {
            userRole: user.role,
            allowedRoles: Array.from(allowedRolesSet),
            redirectTarget: REDIRECT_TARGETS[user.role as keyof typeof REDIRECT_TARGETS],
            isRedirecting,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
        }),
      }).catch(() => {});
      // #endregion

      const target = REDIRECT_TARGETS[user.role as keyof typeof REDIRECT_TARGETS];

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'RoleGuard.tsx:35',
          message: 'Redirect target resolved',
          data: { userRole: user.role, target, hasTarget: !!target, isRedirecting },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
        }),
      }).catch(() => {});
      // #endregion

      if (target && !isRedirecting) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'RoleGuard.tsx:36',
            message: 'Initiating redirect',
            data: { target, userRole: user.role },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'B',
          }),
        }).catch(() => {});
        // #endregion
        setIsRedirecting(true);
        router.replace(target);
      }
      return;
    }

    if (isRedirecting) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'RoleGuard.tsx:43',
          message: 'Resetting isRedirecting flag',
          data: { userRole: user.role },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C',
        }),
      }).catch(() => {});
      // #endregion
      setIsRedirecting(false);
    }
  }, [allowedRolesSet, loading, router, user, isRedirecting]);

  if (loading) {
    return <LoadingSpinner message="Berechtigungen werden geprüft..." />;
  }

  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>
            Zugriff verweigert
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bitte melden Sie sich an, um fortzufahren.
          </Typography>
        </Box>
      </Box>
    );
  }

  // #region agent log
  // Log before role check in render
  if (user) {
    fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'RoleGuard.tsx:76',
        message: 'Render role check',
        data: {
          userRole: user.role,
          userRoleType: typeof user.role,
          roleInSet: allowedRolesSet.has(user.role),
          allowedRoles: Array.from(allowedRolesSet),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
  }
  // #endregion

  if (!allowedRolesSet.has(user.role)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'RoleGuard.tsx:76',
        message: 'Role check failed in render',
        data: { userRole: user.role, isRedirecting },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion

    if (isRedirecting) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            textAlign: 'center',
            p: 3,
          }}
        >
          <Box>
            <LoadingSpinner message="Weiterleitung..." />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Sie werden zum richtigen Bereich weitergeleitet...
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>
            Zugriff verweigert
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sie haben keine Berechtigung für diesen Bereich.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Erforderliche Rolle: {allowedRoles.join(' oder ')}
          </Typography>
          {process.env.NODE_ENV === 'development' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Aktuelle Rolle: {user.role || 'unbekannt'}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  if (requireTenantId && !user.companyId) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>
            Zugriff verweigert
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Kein Mandantenkontext gefunden.
          </Typography>
        </Box>
      </Box>
    );
  }

  // #region agent log
  // Log facility scope check
  fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'RoleGuard.tsx:145',
      message: 'Facility scope check',
      data: {
        facilityScopeId,
        userFacilityIds: user.facilityIds,
        isArray: Array.isArray(user.facilityIds),
        hasFacilityId: Array.isArray(user.facilityIds) && facilityScopeId !== undefined
          ? user.facilityIds.includes(facilityScopeId)
          : 'N/A',
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'D',
    }),
  }).catch(() => {});
  // #endregion

  if (
    facilityScopeId &&
    Array.isArray(user.facilityIds) &&
    !user.facilityIds.includes(facilityScopeId)
  ) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'RoleGuard.tsx:145',
        message: 'Facility access denied',
        data: { facilityScopeId, userFacilityIds: user.facilityIds },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      }),
    }).catch(() => {});
    // #endregion

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>
            Zugriff verweigert
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ihnen fehlt die Berechtigung für diese Einrichtung.
          </Typography>
        </Box>
      </Box>
    );
  }

  // #region agent log
  // Log successful access
  fetch('http://127.0.0.1:7242/ingest/c58dc490-b8b0-424a-83b5-56cf1974ad95', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'RoleGuard.tsx:160',
      message: 'Access granted',
      data: {
        userRole: user.role,
        allowedRoles: Array.from(allowedRolesSet),
        requireTenantId,
        facilityScopeId,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
    }),
  }).catch(() => {});
  // #endregion

  return <>{children}</>;
}
