'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { FacilityHoursDashboard } from '@/components/admin/FacilityHoursDashboard';
import { PageContainer } from '@/components/layout/PageContainer';

export default function AdminStundenPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageContainer maxWidth="wide">
        <FacilityHoursDashboard />
      </PageContainer>
    </RoleGuard>
  );
}
