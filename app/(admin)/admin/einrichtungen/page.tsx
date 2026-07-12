'use client';

import { FacilityCreateDialog } from '@/components/admin/FacilityCreateDialog';
import { FacilityEditDialog } from '@/components/admin/FacilityEditDialog';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GlassCard } from '@/components/ui/GlassCard';
import { radius } from '@/lib/design-tokens';
import { facilityService } from '@/lib/services';
import { Facility } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Add,
  Apartment,
  Business,
  Delete,
  Edit,
  Email,
  LocationOn,
  Person,
  Phone,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CardContent,
  IconButton,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
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
    <PageContainer maxWidth="wide">
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 28, sm: 32 },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.08,
              color: 'text.primary',
            }}
          >
            Einrichtungen
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Standorte, Stationen und Kontaktdaten verwalten
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            minHeight: 44,
            borderRadius: `${radius.md}px`,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Neue Einrichtung
        </Button>
      </Box>

      <Grid container spacing={2}>
          {facilities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, width: '100%' }}>
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
              sx={{ minHeight: 44, borderRadius: `${radius.md}px` }}
            >
              Erste Einrichtung erstellen
            </Button>
          </Box>
        ) : (
          facilities.map(facility => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={facility.id}>
              <GlassCard sx={{ height: '100%' }}>
                <CardContent
                  sx={{
                    p: 2.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:last-child': { pb: 2.5 },
                  }}
                >
                  {/* Kopf: Icon-Kachel + Name + Status-Badge */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        borderRadius: `${radius.md}px`,
                        bgcolor: facility.colorCode || 'primary.main',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Business />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 17,
                          fontWeight: 700,
                          letterSpacing: '-0.01em',
                          lineHeight: 1.25,
                        }}
                        noWrap
                      >
                        {facility.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary' }}
                        className="tabular-nums"
                      >
                        Debitor {facility.debtorNumber}
                      </Typography>
                    </Box>
                    {facility.status && (
                      <Box
                        sx={{
                          flexShrink: 0,
                          px: 1.25,
                          py: 0.4,
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          bgcolor: 'rgba(15,118,110,0.10)',
                          color: 'primary.main',
                        }}
                      >
                        {facility.status}
                      </Box>
                    )}
                  </Box>

                  {/* Kennzahlen / Meta-Zeilen */}
                  <Stack spacing={1.25}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {facility.address}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        className="tabular-nums"
                        noWrap
                      >
                        {facility.phone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {facility.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {facility.contactPerson}
                      </Typography>
                    </Box>
                    {facility.stations && facility.stations.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Apartment sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary">
                          <Box component="span" className="tabular-nums">
                            {facility.stations.length}
                          </Box>{' '}
                          Station(en)
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* Fuß: Steuernummer + Aktionen */}
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        {facility.taxId && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            Steuernummer: {facility.taxId}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ flexShrink: 0 }}>
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
                  </Box>
                </CardContent>
              </GlassCard>
            </Grid>
          ))
        )}
      </Grid>

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
    </PageContainer>
  );
}
