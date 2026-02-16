'use client';

import { FacilityCreateDialog } from '@/components/admin/FacilityCreateDialog';
import { FacilityEditDialog } from '@/components/admin/FacilityEditDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { facilityService } from '@/lib/services';
import { Facility } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Add,
  Business,
  Delete,
  Edit,
  Email,
  LocationOn,
  Phone,
  Receipt,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function AdminEinrichtungenPage() {
  const { user } = useAuth();

  // State für Dialoge
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(null);

  // Echte Daten aus Firebase laden - nur für die eigene Firma
  const {
    data: facilities = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['facilities', user?.companyId],
    queryFn: () => facilityService.getAll(user?.companyId),
    enabled: !!user?.companyId, // Nur laden, wenn companyId vorhanden ist
  });

  const queryClient = useQueryClient();

  // Mutations für CRUD-Operationen
  const deleteFacilityMutation = useMutation({
    mutationFn: (id: string) => facilityService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast.success('Einrichtung erfolgreich gelöscht!');
      setDeleteDialogOpen(false);
      setFacilityToDelete(null);
    },
    onError: (error: unknown) => {
      toast.error(
        'Fehler beim Löschen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler')
      );
    },
  });

  const handleEdit = (facility: Facility) => {
    setSelectedFacility(facility);
    setEditDialogOpen(true);
  };

  const handleDelete = (facility: Facility) => {
    setFacilityToDelete(facility);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (facilityToDelete) {
      deleteFacilityMutation.mutate(facilityToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
      >
        <LoadingSpinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Fehler beim Laden der Einrichtungen</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 3,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Business sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
          Einrichtungsverwaltung
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Neue Einrichtung
        </Button>
      </Box>

      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {facilities.map(facility => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={facility.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: facility.colorCode,
                        mr: 2,
                        width: 48,
                        height: 48,
                      }}
                    >
                      <Business />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {facility.name}
                      </Typography>
                      <Chip
                        label={`Debitor: ${facility.debtorNumber}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        icon={<Receipt />}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {facility.address}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {facility.phone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {facility.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Ansprechpartner: {facility.contactPerson}
                    </Typography>
                    {facility.stations && facility.stations.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        {facility.stations.length} Station(en)
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box>
                      {facility.taxId && (
                        <Typography variant="caption" color="text.secondary">
                          Steuernummer: {facility.taxId}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Tooltip title="Bearbeiten">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(facility)}
                          sx={{ mr: 1 }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Löschen">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(facility)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {facilities.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Keine Einrichtungen vorhanden
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Erstellen Sie Ihre erste Einrichtung, um zu beginnen.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Erste Einrichtung erstellen
            </Button>
          </Box>
        )}
      </Box>

      {/* Create Dialog */}
      <FacilityCreateDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />

      {/* Edit Dialog */}
      {selectedFacility && (
        <FacilityEditDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedFacility(null);
          }}
          facility={selectedFacility}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Einrichtung löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie die Einrichtung &quot;{facilityToDelete?.name}&quot; wirklich löschen? Diese
            Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={confirmDelete} color="error" disabled={deleteFacilityMutation.isPending}>
            {deleteFacilityMutation.isPending ? 'Löschen...' : 'Löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
