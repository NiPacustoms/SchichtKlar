'use client';

import { DocumentTypeManager } from '@/components/admin/DocumentTypeManager';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Alert } from '@mui/material';

export default function AdminDocumentTypesPage() {
  const { user } = useAuth();

  if (!user) {
    return (
    <Box sx={{ p: 3 }}>
          <Alert severity="error">Bitte melde dich an, um Dokumententypen zu verwalten.</Alert>
        </Box>
  );
  }

  return (
    <Box sx={{ p: 3 }}>
        <DocumentTypeManager />
      </Box>
  );
}

