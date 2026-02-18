'use client';

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { adminSettingsService } from '@/lib/services/adminSettings';
import { PERMISSION_KEYS } from '@/lib/constants/permissions';

interface PermissionsContextType {
  /** Alle Berechtigungs-Keys des aktuellen Nutzers */
  permissions: string[];
  /** Prüft, ob der Nutzer eine Berechtigung hat */
  hasPermission: (key: string) => boolean;
  /** true wenn Nutzer den Admin-Bereich betreten darf (admin oder Custom-Rolle mit access_admin_area) */
  canAccessAdminArea: boolean;
  /** Lädt die Custom-Rolle (für Anzeige) */
  isLoading: boolean;
}

export const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const { data: customRole, isLoading } = useQuery({
    queryKey: ['adminRole', user?.customRoleId],
    queryFn: () => (user?.customRoleId ? adminSettingsService.getRoleById(user.customRoleId!) : Promise.resolve(null)),
    enabled: Boolean(user?.customRoleId),
    staleTime: 5 * 60 * 1000,
  });

  const permissions = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return [...PERMISSION_KEYS];
    if (user.customRoleId && customRole) return customRole.permissions ?? [];
    return [];
  }, [user, customRole]);

  const hasPermission = useCallback(
    (key: string) => permissions.includes(key),
    [permissions]
  );

  const canAccessAdminArea = useMemo(
    () => Boolean(user && (user.role === 'admin' || permissions.includes('access_admin_area'))),
    [user, permissions]
  );

  const value = useMemo<PermissionsContextType>(
    () => ({
      permissions,
      hasPermission,
      canAccessAdminArea,
      isLoading: Boolean(user?.customRoleId && isLoading),
    }),
    [permissions, hasPermission, canAccessAdminArea, user, isLoading]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextType {
  const ctx = useContext(PermissionsContext);
  if (ctx === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return ctx;
}
