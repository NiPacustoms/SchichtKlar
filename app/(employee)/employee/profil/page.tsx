'use client';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { GlassCard } from '@/components/ui/GlassCard';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { UserUpdateForm } from '@/lib/types';
import { toast } from '@/lib/utils/toast';
import { logger } from '@/lib/logging';
import {
  AccessTime,
  Logout,
  Notifications,
  Download,
  Delete,
  Security,
  Settings,
} from '@mui/icons-material';
import {
  alpha,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Close, Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { canAccessAdminArea } = usePermissions();

  const {
    profile,
    isLoading,
    error,
    updateProfileMutation,
    updatePasswordMutation,
    updateNotificationSettingsMutation,
    getUserStats,
    getQualificationColor,
    validateEmail,
    validatePhone,
  } = useProfile();

  const [activeTab, setActiveTab] = useState(0);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const menuItems = [
    { icon: <AccessTime />, label: 'Arbeitszeiten', action: 'timesheet' },
    { icon: <Notifications />, label: 'Benachrichtigungen', action: 'notifications' },
    { icon: <Settings />, label: 'Einstellungen', action: 'settings' },
    { icon: <Security />, label: 'Sicherheit', action: 'security' },
  ];

  const handleProfileUpdate = (data: Record<string, unknown>) => {
    updateProfileMutation.mutate(data as Partial<UserUpdateForm>, {
      onSuccess: () => {
        toast.success('Profil erfolgreich aktualisiert!');
        // Formular wird automatisch durch useQuery invalidation aktualisiert
      },
      onError: error => {
        logger.error(
          'Fehler beim Aktualisieren des Profils',
          error instanceof Error ? error : new Error(String(error))
        );
        toast.error(
          'Fehler beim Aktualisieren des Profils: ' +
            (error instanceof Error ? error.message : 'Unbekannter Fehler')
        );
      },
    });
  };

  const _handlePasswordUpdate = (data: { currentPassword: string; newPassword: string }) => {
    updatePasswordMutation.mutate(data);
  };

  const _handleNotificationUpdate = (settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    shiftReminders: boolean;
    documentExpiry: boolean;
    systemAnnouncements: boolean;
  }) => {
    updateNotificationSettingsMutation.mutate(settings);
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner variant="skeleton" message="Profil wird geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user || !profile) {
    return (
      <Box
        className="min-height-viewport"
        sx={{
          backgroundColor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 700, mb: 2 }}>
            Schichtklar
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Bitte melde dich an, um fortzufahren
          </Typography>
        </Box>
      </Box>
    );
  }

  const stats = getUserStats();

  return (
    <>
      <PageContainer maxWidth="standard">
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: { xs: 28, sm: 32 },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.08,
              color: 'text.primary',
            }}
          >
            Mein Profil
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.75 }}>
            Verwalte deine persönlichen Daten und Einstellungen
          </Typography>
        </Box>

        {/* Tabs: Übersicht | Bearbeiten | Einstellungen */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => {
              setActiveTab(newValue);
              if (newValue !== 2) {
                setActiveSettingsTab(null);
              }
            }}
            textColor="primary"
            indicatorColor="primary"
            sx={{ minHeight: 48 }}
          >
            <Tab label="Übersicht" sx={{ textTransform: 'none', fontWeight: 500 }} />
            <Tab label="Bearbeiten" sx={{ textTransform: 'none', fontWeight: 500 }} />
            <Tab label="Einstellungen" sx={{ textTransform: 'none', fontWeight: 500 }} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && <Box>{stats && <ProfileStats user={profile} stats={stats} />}</Box>}

        {activeTab === 1 && (
          <Box>
            <ProfileForm
              user={profile}
              onSubmit={handleProfileUpdate}
              isLoading={updateProfileMutation.isPending}
              getQualificationColor={getQualificationColor}
              validateEmail={validateEmail}
              validatePhone={validatePhone}
            />
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Grid container spacing={3}>
              {/* Profile Info */}
              <Grid size={{ xs: 12, md: 4 }}>
                <GlassCard hover={false}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Avatar
                      sx={{
                        width: 96,
                        height: 96,
                        mx: 'auto',
                        mb: 1.5,
                        bgcolor: 'primary.main',
                        fontSize: '2.25rem',
                        fontWeight: 600,
                      }}
                    >
                      {profile.displayName?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography
                      sx={{
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        color: 'text.primary',
                      }}
                    >
                      {profile.displayName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      {canAccessAdminArea ? 'Administrator' : 'Pflegekraft'}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setActiveTab(1)}
                      sx={{ mt: 2 }}
                    >
                      Profil bearbeiten
                    </Button>
                  </CardContent>
                </GlassCard>

                {/* Persönliche Daten */}
                <Typography className="ios-section-label" component="div">
                  Persönliche Daten
                </Typography>
                <Box className="ios-group">
                  <Box className="ios-row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                      E-Mail
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 500,
                        textAlign: 'right',
                        wordBreak: 'break-word',
                      }}
                    >
                      {profile.email}
                    </Typography>
                  </Box>
                  {profile.phone ? (
                    <Box className="ios-row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                        Telefon
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {profile.phone}
                      </Typography>
                    </Box>
                  ) : null}
                  <Box className="ios-row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                      Rolle
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      {canAccessAdminArea ? 'Administrator' : 'Pflegekraft'}
                    </Typography>
                  </Box>
                </Box>

                {/* Qualifikationen */}
                {profile.qualifications?.length ? (
                  <>
                    <Typography className="ios-section-label" component="div">
                      Qualifikationen
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profile.qualifications.map(qualification => (
                        <Chip
                          key={qualification}
                          label={qualification}
                          sx={{
                            borderRadius: 999,
                            fontWeight: 600,
                            bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.dark',
                          }}
                        />
                      ))}
                    </Box>
                  </>
                ) : null}
              </Grid>

              {/* Settings Menu */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Card className="glass">
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 600,
                        mb: 2,
                      }}
                    >
                      Einstellungen
                    </Typography>
                    <List>
                      {menuItems.map((item, index) => (
                        <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            onClick={() => setActiveSettingsTab(item.action)}
                            selected={activeSettingsTab === item.action}
                            sx={{
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText',
                                '&:hover': {
                                  backgroundColor: 'primary.dark',
                                },
                                '& .MuiListItemIcon-root': {
                                  color: 'primary.contrastText',
                                },
                                '& .MuiListItemText-primary': {
                                  color: 'primary.contrastText',
                                },
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                color:
                                  activeSettingsTab === item.action
                                    ? 'primary.contrastText'
                                    : 'text.secondary',
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.label}
                              sx={{
                                '& .MuiListItemText-primary': {
                                  color:
                                    activeSettingsTab === item.action
                                      ? 'primary.contrastText'
                                      : 'text.primary',
                                  fontWeight: activeSettingsTab === item.action ? 600 : 400,
                                },
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>

                    {/* Settings Content */}
                    {activeSettingsTab && (
                      <Box sx={{ mt: 3 }}>
                        {activeSettingsTab === 'timesheet' && (
                          <Card className="glass">
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                Arbeitszeiten-Einstellungen
                              </Typography>
                              <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={
                                          profile.notificationSettings?.shiftReminders ?? true
                                        }
                                        onChange={async e => {
                                          try {
                                            await updateNotificationSettingsMutation.mutateAsync({
                                              ...(profile.notificationSettings || {
                                                emailNotifications: true,
                                                pushNotifications: true,
                                                shiftReminders: true,
                                                documentExpiry: true,
                                                systemAnnouncements: true,
                                              }),
                                              shiftReminders: e.target.checked,
                                            });
                                            toast.success('Einstellungen aktualisiert');
                                          } catch (error) {
                                            toast.error(
                                              'Fehler beim Aktualisieren: ' +
                                                (error instanceof Error
                                                  ? error.message
                                                  : 'Unbekannter Fehler')
                                            );
                                          }
                                        }}
                                      />
                                    }
                                    label="Schicht-Erinnerungen aktivieren"
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{ color: 'text.secondary', mt: 1, ml: 4 }}
                                  >
                                    Erhalten Sie Erinnerungen vor Beginn Ihrer Schichten
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        defaultChecked={true}
                                        onChange={_e => {
                                          // Feature später: Push/Benachrichtigung nach ArbZG-Frist (z. B. 6h ohne Pause)
                                          toast.info('Diese Funktion wird in Kürze verfügbar sein');
                                        }}
                                      />
                                    }
                                    label="Automatische Pausenerinnerung"
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{ color: 'text.secondary', mt: 1, ml: 4 }}
                                  >
                                    Erinnerung nach 6 Stunden Arbeitszeit
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <Divider sx={{ my: 2 }} />
                                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    Standard-Arbeitszeiten
                                  </Typography>
                                  <Alert severity="info">
                                    Die Konfiguration von Standard-Arbeitszeiten wird in Kürze
                                    verfügbar sein.
                                  </Alert>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        )}
                        {activeSettingsTab === 'notifications' && (
                          <Card className="glass">
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                Benachrichtigungseinstellungen
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={
                                        profile.notificationSettings?.emailNotifications ?? true
                                      }
                                      onChange={async e => {
                                        try {
                                          await updateNotificationSettingsMutation.mutateAsync({
                                            ...(profile.notificationSettings || {
                                              emailNotifications: true,
                                              pushNotifications: true,
                                              shiftReminders: true,
                                              documentExpiry: true,
                                              systemAnnouncements: true,
                                            }),
                                            emailNotifications: e.target.checked,
                                          });
                                          toast.success('Einstellungen aktualisiert');
                                        } catch (error) {
                                          toast.error(
                                            'Fehler beim Aktualisieren: ' +
                                              (error instanceof Error
                                                ? error.message
                                                : 'Unbekannter Fehler')
                                          );
                                        }
                                      }}
                                    />
                                  }
                                  label="E-Mail-Benachrichtigungen"
                                />
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={profile.notificationSettings?.shiftReminders ?? true}
                                      onChange={async e => {
                                        try {
                                          await updateNotificationSettingsMutation.mutateAsync({
                                            ...(profile.notificationSettings || {
                                              emailNotifications: true,
                                              pushNotifications: true,
                                              shiftReminders: true,
                                              documentExpiry: true,
                                              systemAnnouncements: true,
                                            }),
                                            shiftReminders: e.target.checked,
                                          });
                                          toast.success('Einstellungen aktualisiert');
                                        } catch (error) {
                                          toast.error(
                                            'Fehler beim Aktualisieren: ' +
                                              (error instanceof Error
                                                ? error.message
                                                : 'Unbekannter Fehler')
                                          );
                                        }
                                      }}
                                    />
                                  }
                                  label="Schicht-Erinnerungen"
                                />
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={profile.notificationSettings?.documentExpiry ?? true}
                                      onChange={async e => {
                                        try {
                                          await updateNotificationSettingsMutation.mutateAsync({
                                            ...(profile.notificationSettings || {
                                              emailNotifications: true,
                                              pushNotifications: true,
                                              shiftReminders: true,
                                              documentExpiry: true,
                                              systemAnnouncements: true,
                                            }),
                                            documentExpiry: e.target.checked,
                                          });
                                          toast.success('Einstellungen aktualisiert');
                                        } catch (error) {
                                          toast.error(
                                            'Fehler beim Aktualisieren: ' +
                                              (error instanceof Error
                                                ? error.message
                                                : 'Unbekannter Fehler')
                                          );
                                        }
                                      }}
                                    />
                                  }
                                  label="Dokument-Ablaufbenachrichtigungen"
                                />
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={
                                        profile.notificationSettings?.systemAnnouncements ?? true
                                      }
                                      onChange={async e => {
                                        try {
                                          await updateNotificationSettingsMutation.mutateAsync({
                                            ...(profile.notificationSettings || {
                                              emailNotifications: true,
                                              pushNotifications: true,
                                              shiftReminders: true,
                                              documentExpiry: true,
                                              systemAnnouncements: true,
                                            }),
                                            systemAnnouncements: e.target.checked,
                                          });
                                          toast.success('Einstellungen aktualisiert');
                                        } catch (error) {
                                          toast.error(
                                            'Fehler beim Aktualisieren: ' +
                                              (error instanceof Error
                                                ? error.message
                                                : 'Unbekannter Fehler')
                                          );
                                        }
                                      }}
                                    />
                                  }
                                  label="System-Ankündigungen"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                        {activeSettingsTab === 'settings' && (
                          <Card className="glass">
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                Allgemeine Einstellungen
                              </Typography>
                              <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <FormControl fullWidth>
                                    <InputLabel>Sprache</InputLabel>
                                    <Select
                                      value={profile.preferences?.language || 'de'}
                                      label="Sprache"
                                      onChange={async e => {
                                        try {
                                          await updateProfileMutation.mutateAsync({
                                            preferences: {
                                              ...(profile.preferences || {}),
                                              language: e.target.value,
                                            },
                                          });
                                          toast.success('Sprache aktualisiert');
                                        } catch (error) {
                                          toast.error(
                                            'Fehler beim Aktualisieren: ' +
                                              (error instanceof Error
                                                ? error.message
                                                : 'Unbekannter Fehler')
                                          );
                                        }
                                      }}
                                    >
                                      <MenuItem value="de">Deutsch</MenuItem>
                                      <MenuItem value="en">English</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <FormControl fullWidth>
                                    <InputLabel>Zeitzone</InputLabel>
                                    <Select
                                      value={profile.preferences?.timezone || 'Europe/Berlin'}
                                      label="Zeitzone"
                                      onChange={async e => {
                                        try {
                                          await updateProfileMutation.mutateAsync({
                                            preferences: {
                                              ...(profile.preferences || {}),
                                              timezone: e.target.value,
                                            },
                                          });
                                          toast.success('Zeitzone aktualisiert');
                                        } catch (error) {
                                          toast.error(
                                            'Fehler beim Aktualisieren: ' +
                                              (error instanceof Error
                                                ? error.message
                                                : 'Unbekannter Fehler')
                                          );
                                        }
                                      }}
                                    >
                                      <MenuItem value="Europe/Berlin">
                                        Europa/Berlin (MEZ/MESZ)
                                      </MenuItem>
                                      <MenuItem value="Europe/London">
                                        Europa/London (GMT/BST)
                                      </MenuItem>
                                      <MenuItem value="America/New_York">
                                        Amerika/New York (EST/EDT)
                                      </MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <FormControl fullWidth>
                                    <InputLabel>Datumsformat</InputLabel>
                                    <Select
                                      value={profile.preferences?.dateFormat || 'DD.MM.YYYY'}
                                      label="Datumsformat"
                                      onChange={async e => {
                                        try {
                                          await updateProfileMutation.mutateAsync({
                                            preferences: {
                                              ...(profile.preferences || {}),
                                              dateFormat: e.target.value,
                                            },
                                          });
                                          toast.success('Datumsformat aktualisiert');
                                        } catch (error) {
                                          toast.error(
                                            'Fehler beim Aktualisieren: ' +
                                              (error instanceof Error
                                                ? error.message
                                                : 'Unbekannter Fehler')
                                          );
                                        }
                                      }}
                                    >
                                      <MenuItem value="DD.MM.YYYY">
                                        DD.MM.YYYY (31.12.2024)
                                      </MenuItem>
                                      <MenuItem value="YYYY-MM-DD">
                                        YYYY-MM-DD (2024-12-31)
                                      </MenuItem>
                                      <MenuItem value="MM/DD/YYYY">
                                        MM/DD/YYYY (12/31/2024)
                                      </MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <FormControl fullWidth>
                                    <InputLabel>Zeitformat</InputLabel>
                                    <Select
                                      value={profile.preferences?.timeFormat || '24'}
                                      label="Zeitformat"
                                      onChange={async e => {
                                        try {
                                          await updateProfileMutation.mutateAsync({
                                            preferences: {
                                              ...(profile.preferences || {}),
                                              timeFormat: e.target.value as '12' | '24',
                                            },
                                          });
                                          toast.success('Zeitformat aktualisiert');
                                        } catch (error) {
                                          toast.error(
                                            'Fehler beim Aktualisieren: ' +
                                              (error instanceof Error
                                                ? error.message
                                                : 'Unbekannter Fehler')
                                          );
                                        }
                                      }}
                                    >
                                      <MenuItem value="24">24-Stunden (14:30)</MenuItem>
                                      <MenuItem value="12">12-Stunden (2:30 PM)</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        )}
                        {activeSettingsTab === 'security' && (
                          <Card className="glass">
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                Sicherheitseinstellungen
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                    Passwort ändern
                                  </Typography>
                                  <Button
                                    variant="outlined"
                                    startIcon={<Security />}
                                    onClick={() => {
                                      setPasswordDialogOpen(true);
                                      setPasswordForm({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: '',
                                      });
                                    }}
                                  >
                                    Passwort ändern
                                  </Button>
                                </Box>
                                <Divider />
                                <Box>
                                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                    DSGVO-Rechte
                                  </Typography>
                                  <Alert severity="info" sx={{ mb: 2 }}>
                                    Sie haben das Recht, Ihre personenbezogenen Daten einzusehen, zu
                                    exportieren oder zu löschen (DSGVO Art. 15, 17).
                                  </Alert>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Button
                                      variant="outlined"
                                      startIcon={<Download />}
                                      onClick={async () => {
                                        if (!user) return;
                                        setIsExporting(true);
                                        try {
                                          // Firebase Auth Token holen
                                          const { getAuth } = await import('firebase/auth');
                                          const auth = getAuth();
                                          const currentUser = auth.currentUser;
                                          if (!currentUser) {
                                            throw new Error('Nicht angemeldet');
                                          }
                                          const token = await currentUser.getIdToken();
                                          const response = await fetch('/api/user/data-export', {
                                            headers: {
                                              Authorization: `Bearer ${token}`,
                                            },
                                          });

                                          if (!response.ok) {
                                            const error = await response.json();
                                            throw new Error(
                                              error.message || 'Fehler beim Exportieren'
                                            );
                                          }

                                          const blob = await response.blob();
                                          const url = window.URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `schichtklar-data-export-${Date.now()}.json`;
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          window.URL.revokeObjectURL(url);
                                          toast.success(
                                            'Datenexport erfolgreich! Die Datei wurde heruntergeladen.'
                                          );
                                        } catch (error) {
                                          logger.error(
                                            'Error exporting data',
                                            error instanceof Error
                                              ? error
                                              : new Error(String(error))
                                          );
                                          toast.error(
                                            'Fehler beim Datenexport: ' +
                                              (error instanceof Error
                                                ? error.message
                                                : 'Unbekannter Fehler')
                                          );
                                        } finally {
                                          setIsExporting(false);
                                        }
                                      }}
                                      disabled={isExporting}
                                    >
                                      {isExporting
                                        ? 'Exportiere Daten...'
                                        : 'Meine Daten exportieren (DSGVO Art. 15)'}
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      color="error"
                                      startIcon={<Delete />}
                                      onClick={() => setDeleteDialogOpen(true)}
                                      disabled={isDeleting}
                                    >
                                      Konto löschen (DSGVO Art. 17)
                                    </Button>
                                  </Box>
                                  <Alert severity="warning" sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                      Hinweis zur Datenlöschung:
                                    </Typography>
                                    <Typography variant="body2">
                                      GoBD-konforme Daten (z. B. approved Timesheets)
                                      werden nicht gelöscht, sondern anonymisiert (10 Jahre
                                      Aufbewahrungspflicht). Alle anderen Daten werden dauerhaft
                                      gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                                    </Typography>
                                  </Alert>
                                </Box>
                                <Divider />
                                <Box>
                                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                    Sitzungsverwaltung
                                  </Typography>
                                  <Alert severity="info">
                                    Sitzungsverwaltung wird in Kürze verfügbar sein.
                                  </Alert>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Box>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Logout />}
                      fullWidth
                      onClick={signOut}
                    >
                      Abmelden
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </PageContainer>

      {/* Data Deletion Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteReason('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Konto löschen bestätigen</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Warnung: Diese Aktion kann nicht rückgängig gemacht werden!
            </Typography>
            <Typography variant="body2">
              Alle Ihre Daten werden gelöscht oder anonymisiert. GoBD-konforme Daten
              (approved Timesheets u. Ä.) werden anonymisiert statt gelöscht (10 Jahre
              Aufbewahrungspflicht).
            </Typography>
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Grund (optional)"
            value={deleteReason}
            onChange={e => setDeleteReason(e.target.value)}
            placeholder="Bitte geben Sie optional einen Grund für die Löschung an..."
            sx={{ mt: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Um die Löschung zu bestätigen, geben Sie bitte &quot;LÖSCHEN&quot; in das Feld unten
            ein:
          </Typography>
          <TextField
            fullWidth
            label="Bestätigung"
            placeholder="LÖSCHEN"
            sx={{ mt: 1 }}
            id="delete-confirmation"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteReason('');
            }}
          >
            Abbrechen
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={isDeleting}
            onClick={async () => {
              const confirmation = (
                document.getElementById('delete-confirmation') as HTMLInputElement
              )?.value;
              if (confirmation !== 'LÖSCHEN') {
                toast.error('Bitte geben Sie "LÖSCHEN" zur Bestätigung ein.');
                return;
              }

              if (!user) return;
              setIsDeleting(true);
              try {
                // Firebase Auth Token holen
                const { getAuth } = await import('firebase/auth');
                const auth = getAuth();
                const currentUser = auth.currentUser;
                if (!currentUser) {
                  throw new Error('Nicht angemeldet');
                }
                const token = await currentUser.getIdToken();
                const response = await fetch('/api/user/data-deletion', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    confirmDeletion: true,
                    reason: deleteReason || undefined,
                  }),
                });

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error.message || 'Fehler beim Löschen');
                }

                await response.json();
                toast.success(
                  'Ihre Daten wurden gelöscht oder anonymisiert. Sie werden nun abgemeldet.'
                );

                // Abmelden nach kurzer Verzögerung
                setTimeout(() => {
                  signOut();
                }, 2000);
              } catch (error) {
                logger.error(
                  'Error deleting data',
                  error instanceof Error ? error : new Error(String(error))
                );
                toast.error(
                  'Fehler beim Löschen: ' +
                    (error instanceof Error ? error.message : 'Unbekannter Fehler')
                );
                setIsDeleting(false);
              }
            }}
          >
            {isDeleting ? 'Lösche Daten...' : 'Endgültig löschen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Passwort ändern
            </Typography>
            <IconButton onClick={() => setPasswordDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              fullWidth
              label="Aktuelles Passwort"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Neues Passwort"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              helperText="Mindestens 6 Zeichen"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Neues Passwort bestätigen"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              error={
                passwordForm.newPassword !== '' &&
                passwordForm.newPassword !== passwordForm.confirmPassword
              }
              helperText={
                passwordForm.newPassword !== '' &&
                passwordForm.newPassword !== passwordForm.confirmPassword
                  ? 'Passwörter stimmen nicht überein'
                  : ''
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setPasswordDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword
              ) {
                toast.error('Bitte füllen Sie alle Felder aus');
                return;
              }
              if (passwordForm.newPassword.length < 6) {
                toast.error('Das neue Passwort muss mindestens 6 Zeichen lang sein');
                return;
              }
              if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                toast.error('Passwörter stimmen nicht überein');
                return;
              }
              updatePasswordMutation.mutate(
                {
                  currentPassword: passwordForm.currentPassword,
                  newPassword: passwordForm.newPassword,
                },
                {
                  onSuccess: () => {
                    toast.success('Passwort erfolgreich geändert');
                    setPasswordDialogOpen(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  },
                  onError: error => {
                    toast.error(
                      'Fehler beim Ändern des Passworts: ' +
                        (error instanceof Error ? error.message : 'Unbekannter Fehler')
                    );
                  },
                }
              );
            }}
            disabled={updatePasswordMutation.isPending}
          >
            {updatePasswordMutation.isPending ? 'Wird geändert...' : 'Passwort ändern'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
