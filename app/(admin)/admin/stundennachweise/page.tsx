'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { StatementOverview } from '@/components/admin/StatementOverview';
import { PageContainer } from '@/components/layout/PageContainer';

export default function AdminStundennachweisePage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageContainer maxWidth="wide">
        <StatementOverview />
      </PageContainer>
    </RoleGuard>
  );
}
