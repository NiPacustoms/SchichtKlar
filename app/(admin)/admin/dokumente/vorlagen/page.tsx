'use client';

import dynamic from 'next/dynamic';
import { PageContainer } from '@/components/layout/PageContainer';
import { CircularProgress, Box } from '@mui/material';

const TemplateManager = dynamic(
  () => import('@/components/admin/TemplateManager').then((m) => ({ default: m.TemplateManager })),
  { loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> }
);

export default function AdminTemplateManagementPage() {
  return (
    <PageContainer maxWidth="standard">
      <TemplateManager />
    </PageContainer>
  );
}
