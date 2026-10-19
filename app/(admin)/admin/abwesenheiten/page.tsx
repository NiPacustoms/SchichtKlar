'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { AbsenceInbox } from '@/components/admin/AbsenceInbox';
import { PageContainer } from '@/components/layout/PageContainer';

export default function AdminAbwesenheitenPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageContainer maxWidth="wide">
        <AbsenceInbox />
      </PageContainer>
    </RoleGuard>
  );
}
