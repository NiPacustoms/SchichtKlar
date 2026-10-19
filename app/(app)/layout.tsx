'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import BottomNav from '@/components/layout/BottomNavigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { usePermissions } from '@/contexts/PermissionsContext';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  // Gemeinsame Seiten (Profil, Benachrichtigungen …): Admins behalten ihre Seitenleiste
  const { canAccessAdminArea } = usePermissions();
  return (
    <AuthGuard>
      <AppLayout hideHeader={false} withSidebar={canAccessAdminArea} bottomNav={<BottomNav />}>
        {children}
      </AppLayout>
    </AuthGuard>
  );
}
