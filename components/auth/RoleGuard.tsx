'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Box, Typography } from '@mui/material';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ('nurse' | 'admin')[];
  requireTenantId?: boolean;
  facilityScopeId?: string;
}

const REDIRECT_TARGETS: Record<'nurse' | 'admin', string> = {
  nurse: '/employee/arbeitsplatz',
  admin: '/admin/uebersicht',
};

export function RoleGuard({
  children,
  allowedRoles,
  requireTenantId,
  facilityScopeId,
}: RoleGuardProps) {
  const { user, loading } = useAuth();
  const { canAccessAdminArea } = usePermissions();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const allowedRolesSet = useMemo(() => new Set(allowedRoles), [allowedRoles]);
  const hasAccess =
    (user?.role ? allowedRolesSet.has(user.role) : false) ||
    (allowedRolesSet.has('admin') && canAccessAdminArea);

  useEffect(() => {
    if (loading || !user) return;

    if (!hasAccess) {
      const target = REDIRECT_TARGETS[user.role as keyof typeof REDIRECT_TARGETS];
      if (target && !isRedirecting) {
        setIsRedirecting(true);
        router.replace(target);
      }
      return;
    }

    if (isRedirecting) setIsRedirecting(false);
  }, [allowedRolesSet, loading, router, user, isRedirecting, hasAccess]);

  if (loading) {
    return <LoadingSpinner message="Berechtigungen werden geprüft..." />;
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', p: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>Zugriff verweigert</Typography>
          <Typography variant="body1" color="text.secondary">Bitte melden Sie sich an, um fortzufahren.</Typography>
        </Box>
      </Box>
    );
  }

  if (!hasAccess) {
    if (isRedirecting) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', p: 3 }}>
          <Box>
            <LoadingSpinner message="Weiterleitung..." />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Sie werden zum richtigen Bereich weitergeleitet...</Typography>
          </Box>
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', p: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>Zugriff verweigert</Typography>
          <Typography variant="body1" color="text.secondary">Sie haben keine Berechtigung für diesen Bereich.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Erforderliche Rolle: {allowedRoles.join(' oder ')}</Typography>
          {process.env.NODE_ENV === 'development' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Aktuelle Rolle: {user.role || 'unbekannt'}</Typography>
          )}
        </Box>
      </Box>
    );
  }

  if (requireTenantId && !user.companyId) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', p: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>Zugriff verweigert</Typography>
          <Typography variant="body1" color="text.secondary">Kein Mandantenkontext gefunden.</Typography>
        </Box>
      </Box>
    );
  }

  if (
    facilityScopeId &&
    Array.isArray(user.facilityIds) &&
    !user.facilityIds.includes(facilityScopeId)
  ) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', p: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>Zugriff verweigert</Typography>
          <Typography variant="body1" color="text.secondary">Ihnen fehlt die Berechtigung für diese Einrichtung.</Typography>
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
}
