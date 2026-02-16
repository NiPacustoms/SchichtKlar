'use client';

import { logger } from '@/lib/logging';

import { AppLayout } from '@/components/layout/AppLayout';
import BottomNav from '@/components/layout/BottomNavigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { GlobalErrorBoundary } from '@/components/errors/GlobalErrorBoundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalErrorBoundary
      component="AdminLayout"
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        logger.error('AdminLayout Error:', error, errorInfo);
      }}
    >
      <AuthGuard requireAdmin={true}>
        <RoleGuard allowedRoles={['admin', 'dispatcher']}>
          <AppLayout hideHeader={false}>
            {children}
            <BottomNav />
          </AppLayout>
        </RoleGuard>
      </AuthGuard>
    </GlobalErrorBoundary>
  );
}
