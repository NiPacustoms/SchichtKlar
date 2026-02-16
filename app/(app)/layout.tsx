'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import BottomNav from '@/components/layout/BottomNavigation';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppLayout hideHeader={false}>
        {children}
        <BottomNav />
      </AppLayout>
    </AuthGuard>
  );
}
