'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageContainer } from '@/components/layout/PageContainer';
import { userService } from '@/lib/services';
import { User } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { Add, Delete, Email, People, Phone, Work } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import ConfirmDestructiveDialog from '@/components/ui/ConfirmDestructiveDialog';

export default function StaffSimplePage() {
  const { user } = useAuth();

  // State für Dialoge und Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Echte Daten aus Firebase laden - nur für die eigene Firma
  const {
    data: staffResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users', 'staff', user?.companyId],
    queryFn: () => userService.getAll(1, 50, { companyId: user?.companyId }),
    enabled: !!user?.companyId, // Nur laden, wenn companyId vorhanden ist
  });

  const allStaff = useMemo(() => staffResponse?.data || [], [staffResponse?.data]);

  const queryClient = useQueryClient();

  // Mutations für CRUD-Operationen
  // Update-Mutation aktuell ungenutzt – wird bei Bedarf wieder aktiviert

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Mitarbeiter erfolgreich gelöscht!');
    },
    onError: (error: unknown) => {
      toast.error(
        'Fehler beim Löschen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler')
      );
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      userService.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status erfolgreich geändert!');
    },
    onError: (error: unknown) => {
      toast.error(
        'Fehler beim Ändern des Status: ' +
          (error instanceof Error ? error.message : 'Unbekannter Fehler')
      );
    },
  });

  // Handler-Funktionen
  const handleDeleteUser = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      deleteUserMutation.mutate(pendingDeleteId);
    }
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const handleToggleUserStatus = (id: string, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ id, active: !currentStatus });
  };

  // Einfache Filterung und Suche
  const filteredStaff = useMemo(() => {
    let filtered = allStaff;

    // Suchfilter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.phone?.toLowerCase().includes(searchLower) ||
          user.qualifications.some(q => q.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [allStaff, searchTerm]);

  if (isLoading) {
    return (
      <LoadingSpinner
        variant="fullscreen"
        message="Mitarbeiterdaten werden geladen..."
        size={60}
        showLogo={true}
      />
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Fehler beim Laden der Mitarbeiter</Typography>
      </Box>
    );
  }

  return (
    <Box className="min-height-viewport" sx={{ backgroundColor: 'background.default' }}>
      <PageContainer maxWidth="standard">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <People sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Mitarbeiter Admin (Einfach)
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" startIcon={<Add />} size="small" sx={{ mr: 0 }} disabled>
            Hinzufügen
          </Button>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                mb: 1,
              }}
            >
              Mitarbeiterverwaltung Admin (Einfach)
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Verwalte dein Team und überwache die Leistung der Mitarbeiter
            </Typography>
          </Box>

          {/* Einfache Suchfunktion */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Mitarbeiter suchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          <Grid container spacing={3}>
            {filteredStaff.map((member: User, index: number) => (
              <Grid size={{ xs: 12, md: 6 }} key={member.id || member.email || `staff-${index}`}>
                <Card className="glass">
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            mr: 2,
                            bgcolor: 'primary.main',
                          }}
                        >
                          {member.displayName
                            ?.split(' ')
                            .map((n: string) => n[0])
                            .join('') || 'U'}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              color: 'text.primary',
                              fontWeight: 600,
                            }}
                          >
                            {(() => {
                              const name = member.displayName || 'Unbekannt';
                              // Escape HTML-Zeichen, um XSS zu verhindern
                              return name.replace(/[<>&"']/g, char => {
                                const map: Record<string, string> = {
                                  '<': '&lt;',
                                  '>': '&gt;',
                                  '&': '&amp;',
                                  '"': '&quot;',
                                  "'": '&#x27;',
                                };
                                return map[char] || char;
                              });
                            })()}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {member.role === 'nurse'
                              ? 'Pflegekraft'
                              : 'Administrator'}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={member.active ? 'Aktiv' : 'Inaktiv'}
                        color={member.active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Email
                        sx={{
                          fontSize: 16,
                          color: 'text.secondary',
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {member.email}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Phone
                        sx={{
                          fontSize: 16,
                          color: 'text.secondary',
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {member.phone || 'Keine Telefonnummer'}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Work
                          sx={{
                            fontSize: 16,
                            color: 'text.secondary',
                            mr: 1,
                          }}
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {member.qualifications?.length || 0} Qualifikationen
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        color={member.active ? 'warning' : 'success'}
                        size="small"
                        sx={{ flex: 1, minWidth: '120px' }}
                        onClick={() => handleToggleUserStatus(member.id, member.active)}
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        {toggleUserStatusMutation.isPending
                          ? 'Ändere...'
                          : member.active
                            ? 'Deaktivieren'
                            : 'Aktivieren'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Delete />}
                        sx={{ flex: 1, minWidth: '120px' }}
                        onClick={() => handleDeleteUser(member.id)}
                        disabled={deleteUserMutation.isPending}
                      >
                        {deleteUserMutation.isPending ? 'Lösche...' : 'Löschen'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </PageContainer>
      <ConfirmDestructiveDialog
        open={confirmOpen}
        title="Mitarbeiter löschen"
        description="Diese Aktion ist irreversibel. Der Benutzer wird deaktiviert und personenbezogene Daten werden entfernt. Tippen Sie LÖSCHEN zur Bestätigung."
        confirmWord="LÖSCHEN"
        confirmLabel="Löschen"
        onClose={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}
