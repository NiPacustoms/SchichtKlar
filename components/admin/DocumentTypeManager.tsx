'use client';

import { useState } from 'react';

import { GlassCard } from '@/components/ui/GlassCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { documentTypeService } from '@/lib/services';
import { Add, Delete, Edit, Save } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface DocumentTypeFormData {
  name: string;
  description: string;
}

interface DocumentType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string | number | Date;
}

export function DocumentTypeManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<DocumentTypeFormData>({
    name: '',
    description: '',
  });

  const {
    data: documentTypes = [],
    isLoading,
    error,
  } = useQuery<DocumentType[]>({
    queryKey: ['documentTypes'],
    queryFn: () => documentTypeService.getAllTypes(),
    // Query erst ausführen, wenn User authentifiziert ist (vermeidet permission-denied bei Prefetch/Timing)
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; createdBy: string }) =>
      documentTypeService.createType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string } }) =>
      documentTypeService.updateType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      handleCloseDialog();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => documentTypeService.deactivateType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    },
  });

  const handleOpenDialog = (type?: DocumentType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description || '',
      });
    } else {
      setEditingType(null);
      setFormData({ name: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingType(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = () => {
    if (!user?.id) return;

    if (editingType) {
      updateMutation.mutate({
        id: editingType.id,
        data: {
          name: formData.name,
          description: formData.description,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        description: formData.description,
        createdBy: user.id,
      });
    }
  };

  const handleDeactivate = (id: string) => {
    if (window.confirm('Möchten Sie diesen Dokumententyp wirklich deaktivieren?')) {
      deactivateMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <GlassCard>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Lade Dokumententypen...</Typography>
        </Box>
      </GlassCard>
    );
  }

  if (error && error instanceof Error) {
    return (
      <GlassCard>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Fehler beim Laden der Dokumententypen: {error.message}
          </Alert>
        </Box>
      </GlassCard>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Dokumententypen verwalten"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Neuer Typ
          </Button>
        }
      />

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Beschreibung</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Erstellt</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documentTypes.map(type => (
              <TableRow key={type.id}>
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {type.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {type.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={type.isActive ? 'Aktiv' : 'Inaktiv'}
                    color={type.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(type.createdAt).toLocaleDateString('de-DE')}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleOpenDialog(type)}
                    disabled={!type.isActive}
                    aria-label="Dokumententyp bearbeiten"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeactivate(type.id)}
                    color="error"
                    aria-label="Dokumententyp deaktivieren"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingType ? 'Dokumententyp bearbeiten' : 'Neuer Dokumententyp'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Beschreibung"
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              !formData.name ||
              createMutation.isPending ||
              updateMutation.isPending
            }
            startIcon={editingType ? <Save /> : <Add />}
          >
            {editingType ? 'Speichern' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

