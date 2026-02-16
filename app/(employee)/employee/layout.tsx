'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import BottomNav from '@/components/layout/BottomNavigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['nurse']}>
        <AppLayout hideHeader={false}>
          {children}
          <BottomNav />
        </AppLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
