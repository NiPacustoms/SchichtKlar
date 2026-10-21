'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/**
 * Kurz-URLs (z. B. /einrichtungen) führen je nach Rolle in den passenden
 * Bereich: Disposition → Admin-Seite, Pflegekraft → Mitarbeiterseite.
 */
export function RoleRedirect({ admin, employee }: { admin: string; employee: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/anmelden');
    else router.replace(user.role === 'admin' ? admin : employee);
  }, [user, loading, router, admin, employee]);
  return <LoadingSpinner />;
}
