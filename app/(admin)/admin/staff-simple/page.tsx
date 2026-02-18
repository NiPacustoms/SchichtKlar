'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageContainer } from '@/components/layout/PageContainer';
import { useRole } from '@/contexts/RoleContext';
import { useTheme } from '@/contexts/ThemeContext';
import { userService } from '@/lib/services';
import { User } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import { Add, Delete, Email, People, Phone, Work } from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';

export default function StaffSimplePage() {
  const { mode: _mode } = useTheme();
  const { currentRole, setCurrentRole } = useRole();
  const isDark = false; // Nur Light Mode verfügbar

  // State für Dialoge und Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Echte Daten aus Firebase laden
  const {
    data: staffResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users', 'staff'],
    queryFn: () => userService.getAll(),
  });

  const allStaff = useMemo(() => staffResponse?.data || [], [staffResponse?.data]);
  const queryClient = useQueryClient();

  // Mutations für CRUD-Operationen
  const _updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Mitarbeiter erfolgreich aktualisiert!');
    },
    onError: (error: unknown) => {
      toast.error(
        'Fehler beim Aktualisieren: ' +
          (error instanceof Error ? error.message : 'Unbekannter Fehler')
      );
    },
  });

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
    if (window.confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) {
      deleteUserMutation.mutate(id);
    }
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
    <Box className="min-height-viewport" sx={{ backgroundColor: 'background.default', pb: 10 }}>
      <AppBar
        position="static"
        className="glass"
        sx={{
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.15)',
          mb: 3,
        }}
      >
        <Toolbar>
          <People sx={{ color: isDark ? 'primary.main' : '#005f73', mr: 2 }} />
          <Typography
            variant="h6"
            sx={{ color: isDark ? 'primary.main' : '#005f73', fontWeight: 600, flexGrow: 1 }}
          >
            Mitarbeiter Admin (Einfach)
          </Typography>
          <Button variant="contained" startIcon={<Add />} size="small" sx={{ mr: 2 }} disabled>
            Hinzufügen
          </Button>
          <FormControl size="small">
            <Select
              value={currentRole}
              onChange={e => setCurrentRole(e.target.value as 'nurse' | 'admin')}
              aria-label="Rolle auswählen"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '& .MuiSelect-select': {
                  color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)',
                },
              }}
            >
              <MenuItem value="nurse">Krankenschwester</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
            </Select>
          </FormControl>
        </Toolbar>
      </AppBar>

      <PageContainer maxWidth="standard" sx={{ pt: 8, mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)',
              fontWeight: 700,
              mb: 1,
            }}
          >
            Mitarbeiterverwaltung Admin (Einfach)
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
          >
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
          {filteredStaff.map((member: User) => (
            <Grid size={{ xs: 12, md: 6 }} key={member.id || `staff-${Math.random()}`}>
              <Card
                className="glass"
                sx={{
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
                  boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.15)',
                }}
              >
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
                            color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.95)',
                            fontWeight: 600,
                          }}
                        >
                          {member.displayName || 'Unbekannt'}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
                        >
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
                        color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)',
                        mr: 1,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
                    >
                      {member.email}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone
                      sx={{
                        fontSize: 16,
                        color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)',
                        mr: 1,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
                    >
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
                          color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)',
                          mr: 1,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.7)' }}
                      >
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
      </PageContainer>
    </Box>
  );
}
