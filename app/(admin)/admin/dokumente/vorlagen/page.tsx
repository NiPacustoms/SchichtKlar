'use client';

import { TemplateManager } from '@/components/admin/TemplateManager';
import { Box } from '@mui/material';

export default function AdminTemplateManagementPage() {
  return (
    <Box sx={{ p: 3 }}>
      <TemplateManager />
    </Box>
  );
}
