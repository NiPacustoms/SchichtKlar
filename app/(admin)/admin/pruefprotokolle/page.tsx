'use client';

import AuditLogViewer from '@/components/admin/AuditLogViewer';
import { PageContainer } from '@/components/layout/PageContainer';
import { Typography } from '@mui/material';

export default function AuditLogsPage() {
  // companyId wird automatisch aus dem AuthContext geholt
  return (
    <PageContainer maxWidth="wide">
      <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
        Audit Logs
      </Typography>
      <AuditLogViewer />
    </PageContainer>
  );
}
