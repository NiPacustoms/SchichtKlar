'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { TimesheetReview } from '@/components/admin/TimesheetReview';
import { PageContainer } from '@/components/layout/PageContainer';

export default function AdminZeitnachweisePage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageContainer maxWidth="wide">
        <TimesheetReview />
      </PageContainer>
    </RoleGuard>
  );
}
