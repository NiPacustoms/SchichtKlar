'use client';

import { TemplateManager } from '@/components/admin/TemplateManager';
import { PageContainer } from '@/components/layout/PageContainer';

export default function AdminTemplateManagementPage() {
  return (
    <PageContainer maxWidth="standard">
      <TemplateManager />
    </PageContainer>
  );
}
