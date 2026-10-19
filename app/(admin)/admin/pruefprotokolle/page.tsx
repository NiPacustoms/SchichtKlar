'use client';

import AuditLogViewer from '@/components/admin/AuditLogViewer';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

export default function AuditLogsPage() {
  // companyId wird automatisch aus dem AuthContext geholt
  return (
    <PageContainer maxWidth="wide">
      <PageHeader
        title="Prüfprotokolle"
        subtitle="Unveränderliches Protokoll aller Änderungen – für Prüfungen nach GoBD und AÜG"
      />
      <AuditLogViewer />
    </PageContainer>
  );
}
