'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { FacilityHoursDashboard } from '@/components/admin/FacilityHoursDashboard';
import { Container } from '@mui/material';

export default function AdminStundenPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'dispatcher']}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <FacilityHoursDashboard />
      </Container>
    </RoleGuard>
  );
}
