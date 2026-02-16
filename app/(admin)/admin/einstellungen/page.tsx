'use client';

import { useState, useRef, useId } from 'react';
import { logger } from '@/lib/logging';
import { GlobalErrorBoundary } from '@/components/errors/GlobalErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import {
  useAdminSettings,
  Role,
  DocumentType as AdminDocumentType,
  EmailTemplate,
  SystemSettings,
} from '@/lib/hooks/useAdminSettings';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';
import { useFeatureFlags } from '@/lib/hooks/useFeatureFlags';
import { settingsService } from '@/lib/services/settingsService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/utils/toast';
import { FeatureFlags } from '@/lib/types/featureFlags';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Settings,
  Security,
  Description,
  Email,
  Notifications,
  Backup,
  Restore,
  Save,
  Refresh,
  Add,
  Edit,
  Delete,
  CloudUpload,
  CloudDownload,
  Warning,
  ToggleOn,
  People,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    branding,
    isLoading: brandingLoading,
    updateBranding,
    uploadLogo,
    deleteLogo,
    isUploading,
  } = useBrandingSettings(user?.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputId = useId();

  const {
    settings,
    roles,
    documentTypes,
    emailTemplates,
    systemInfo,
    isLoading,
    error,
    updateSettings,
    createRole,
    updateRole,
    deleteRole,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    backupData,
    restoreData,
    isUpdating,
    isCreating,
    isDeleting,
    isBackingUp,
    isRestoring,
  } = useAdminSettings();

  const { features, isLoading: featuresLoading } = useFeatureFlags();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [documentTypeDialogOpen, setDocumentTypeDialogOpen] = useState(false);
  const [emailTemplateDialogOpen, setEmailTemplateDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Role | AdminDocumentType | EmailTemplate | null>(
    null
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUpdateSettings = async (data: Partial<SystemSettings>) => {
    try {
      await updateSettings(data);
      setSettingsDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleUpdateFeatures = async (featureUpdates: Partial<FeatureFlags>) => {
    try {
      if (!user?.id) {
        toast.error('Benutzer-ID nicht gefunden');
        return;
      }

      // Optimistic Update: Sofortige UI-Aktualisierung
      queryClient.setQueryData(
        ['systemSettings'],
        (old: { features?: FeatureFlags } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            features: {
              ...old.features,
              ...featureUpdates,
            },
          };
        }
      );

      await settingsService.updateFeatureSettings(featureUpdates, user.id);

      // Invalidate queries to refresh feature flags
      await queryClient.invalidateQueries({ queryKey: ['systemSettings'] });

      toast.success('Features erfolgreich aktualisiert');
    } catch (error) {
      // Rollback bei Fehler
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Aktualisieren der Features: ${errorMessage}`);
      logger.error(
        'Fehler beim Aktualisieren der Features',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const handleCreateRole = async (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createRole(data);
      setRoleDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleUpdateRole = async (data: Partial<Role>) => {
    try {
      await updateRole((selectedItem as Role).id, data);
      setRoleDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleCreateDocumentType = async (
    data: Omit<AdminDocumentType, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await createDocumentType(data);
      setDocumentTypeDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleUpdateDocumentType = async (data: Partial<AdminDocumentType>) => {
    try {
      await updateDocumentType((selectedItem as AdminDocumentType).id, data);
      setDocumentTypeDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleDeleteDocumentType = async (documentTypeId: string) => {
    try {
      await deleteDocumentType(documentTypeId);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleCreateEmailTemplate = async (
    data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await createEmailTemplate(data);
      setEmailTemplateDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleUpdateEmailTemplate = async (data: Partial<EmailTemplate>) => {
    try {
      await updateEmailTemplate((selectedItem as EmailTemplate).id, data);
      setEmailTemplateDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleDeleteEmailTemplate = async (templateId: string) => {
    try {
      await deleteEmailTemplate(templateId);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleBackupData = async () => {
    try {
      await backupData();
      setBackupDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleRestoreData = async (file: File) => {
    try {
      await restoreData(file);
      setRestoreDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'dispatcher':
        return 'warning';
      case 'nurse':
        return 'info';
      case 'employee':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner message="Einstellungen werden geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bitte melde dich an, um die Einstellungen zu verwalten.</Alert>
      </Box>
    );
  }

  return (
    <GlobalErrorBoundary component="AdminSettingsPage">
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              mb: 1,
            }}
          >
            System-Einstellungen
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Verwalten Sie Systemkonfiguration, Rollen, Dokumenttypen und E-Mail-Templates
          </Typography>
        </Box>

        {/* Branding */}
        <Card className="glass" sx={{ mb: 4 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={branding?.companyLogo}
                  alt={branding?.companyName || 'Logo'}
                  sx={{ width: 80, height: 80, borderRadius: 2 }}
                  variant="rounded"
                >
                  {!branding?.companyLogo && (branding?.companyName?.[0]?.toUpperCase() || 'J')}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {branding?.companyName || 'Firma'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Firmenlogo und Branding
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: { md: 'auto' } }}>
                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  style={{ display: 'none' }}
                  accept="image/*"
                  type="file"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (isUploading) {
                      e.currentTarget.value = '';
                      return;
                    }
                    await uploadLogo(file);
                    if (e.currentTarget) e.currentTarget.value = '';
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  component="label"
                  htmlFor={fileInputId}
                  onClick={() => {
                    if (!fileInputRef.current) return;
                    try {
                      fileInputRef.current.click();
                    } catch (_) {
                      /* noop */
                    }
                  }}
                  sx={{ pointerEvents: 'auto' }}
                >
                  {isUploading ? 'Lädt…' : 'Logo hochladen'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => deleteLogo()}
                  disabled={brandingLoading || isDeleting || !branding?.companyLogo}
                >
                  {isDeleting ? 'Entferne…' : 'Logo entfernen'}
                </Button>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!branding?.showLogo}
                      onChange={e => updateBranding({ showLogo: e.target.checked })}
                      disabled={brandingLoading}
                    />
                  }
                  label="Logo anzeigen"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* System Status */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card className="glass">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                  {systemInfo.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  System-Status
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card className="glass">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {systemInfo.version}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Version
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card className="glass">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                  {systemInfo.uptime}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uptime
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card className="glass">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                  {systemInfo.storage}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Speicher
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Actions */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={() => setSettingsDialogOpen(true)}
            disabled={isUpdating}
          >
            {isUpdating ? 'Speichere...' : 'Einstellungen speichern'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => setBackupDialogOpen(true)}
            disabled={isBackingUp}
          >
            {isBackingUp ? 'Backup...' : 'Backup erstellen'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudDownload />}
            onClick={() => setRestoreDialogOpen(true)}
            disabled={isRestoring}
          >
            {isRestoring ? 'Restore...' : 'Restore'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Aktualisieren
          </Button>
        </Box>

        {/* Tabs */}
        <Paper className="glass" sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="System" icon={<Settings />} iconPosition="start" />
            <Tab label="Rollen & Rechte" icon={<Security />} iconPosition="start" />
            <Tab label="Dokumenttypen" icon={<Description />} iconPosition="start" />
            <Tab label="E-Mail-Templates" icon={<Email />} iconPosition="start" />
            <Tab label="Benachrichtigungen" icon={<Notifications />} iconPosition="start" />
            <Tab label="Backup & Restore" icon={<Backup />} iconPosition="start" />
            <Tab label="Features" icon={<ToggleOn />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Settings sx={{ mr: 1 }} />
                    Allgemeine Einstellungen
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText primary="System-Name" secondary={settings.systemName} />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Standard-Zeitzone" secondary={settings.timezone} />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Sprache" secondary={settings.language} />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Währung" secondary={settings.currency} />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Security sx={{ mr: 1 }} />
                    Sicherheits-Einstellungen
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Passwort-Policy"
                        secondary="Mindestens 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen"
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Session-Timeout"
                        secondary={`${settings.sessionTimeout} Minuten`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="2FA erforderlich"
                        secondary={settings.twoFactorRequired ? 'Ja' : 'Nein'}
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.twoFactorRequired}
                              onChange={() =>
                                handleUpdateSettings({
                                  twoFactorRequired: !settings.twoFactorRequired,
                                })
                              }
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Login-Versuche"
                        secondary={`Maximal ${settings.maxLoginAttempts} Versuche`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Card className="glass">
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Security sx={{ mr: 1 }} />
                  Rollen & Rechte verwalten
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setRoleDialogOpen(true)}
                  disabled={isCreating}
                >
                  {isCreating ? 'Erstelle...' : 'Neue Rolle'}
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rolle</TableCell>
                      <TableCell>Beschreibung</TableCell>
                      <TableCell>Berechtigungen</TableCell>
                      <TableCell>Benutzer</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map(role => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: `${getRoleColor(role.name)}.main` }}>
                              {role.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {role.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {role.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {role.permissions.slice(0, 3).map((permission, index) => (
                              <Chip key={index} label={permission} size="small" />
                            ))}
                            {role.permissions.length > 3 && (
                              <Chip label={`+${role.permissions.length - 3}`} size="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{role.userCount}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={role.status}
                            color={
                              getStatusColor(role.status) as
                                | 'primary'
                                | 'secondary'
                                | 'error'
                                | 'info'
                                | 'success'
                                | 'warning'
                                | 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedItem(role);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRole(role.id)}
                            color="error"
                            disabled={isDeleting}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Card className="glass">
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Description sx={{ mr: 1 }} />
                  Dokumenttypen verwalten
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setDocumentTypeDialogOpen(true)}
                  disabled={isCreating}
                >
                  {isCreating ? 'Erstelle...' : 'Neuer Dokumenttyp'}
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Kategorie</TableCell>
                      <TableCell>Gültigkeitsdauer</TableCell>
                      <TableCell>Pflicht</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documentTypes.map(docType => (
                      <TableRow key={docType.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {docType.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={docType.category} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{docType.validityPeriod} Tage</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={docType.required ? 'Ja' : 'Nein'}
                            color={docType.required ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={docType.status}
                            color={
                              getStatusColor(docType.status) as
                                | 'primary'
                                | 'secondary'
                                | 'error'
                                | 'info'
                                | 'success'
                                | 'warning'
                                | 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedItem(docType);
                              setDocumentTypeDialogOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDocumentType(docType.id)}
                            color="error"
                            disabled={isDeleting}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Card className="glass">
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Email sx={{ mr: 1 }} />
                  E-Mail-Templates verwalten
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setEmailTemplateDialogOpen(true)}
                  disabled={isCreating}
                >
                  {isCreating ? 'Erstelle...' : 'Neues Template'}
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Typ</TableCell>
                      <TableCell>Betreff</TableCell>
                      <TableCell>Letzte Änderung</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {emailTemplates.map(template => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {template.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={template.type} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {template.subject}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {format(template.updatedAt, 'dd.MM.yyyy', { locale: de })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={template.status}
                            color={
                              getStatusColor(template.status) as
                                | 'primary'
                                | 'secondary'
                                | 'error'
                                | 'info'
                                | 'success'
                                | 'warning'
                                | 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedItem(template);
                              setEmailTemplateDialogOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteEmailTemplate(template.id)}
                            color="error"
                            disabled={isDeleting}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Notifications sx={{ mr: 1 }} />
                    Benachrichtigungs-Einstellungen
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="E-Mail-Benachrichtigungen"
                        secondary="Automatische E-Mails bei wichtigen Ereignissen"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.emailNotifications}
                              onChange={() =>
                                handleUpdateSettings({
                                  emailNotifications: !settings.emailNotifications,
                                })
                              }
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="SMS-Benachrichtigungen"
                        secondary="SMS bei kritischen Ereignissen"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.smsNotifications}
                              onChange={() =>
                                handleUpdateSettings({
                                  smsNotifications: !settings.smsNotifications,
                                })
                              }
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Schicht-Erinnerungen"
                        secondary="Erinnerungen vor Schichtbeginn"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.shiftReminders}
                              onChange={() =>
                                handleUpdateSettings({
                                  smsNotifications: !settings.smsNotifications,
                                })
                              }
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Warning sx={{ mr: 1 }} />
                    Warnungen & Alerts
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Dokument-Ablauf"
                        secondary="Warnung vor ablaufenden Dokumenten"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.documentExpiryWarnings}
                              onChange={() =>
                                handleUpdateSettings({
                                  smsNotifications: !settings.smsNotifications,
                                })
                              }
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Schicht-Konflikte"
                        secondary="Warnung bei Schicht-Überschneidungen"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.shiftConflictWarnings}
                              onChange={() =>
                                handleUpdateSettings({
                                  smsNotifications: !settings.smsNotifications,
                                })
                              }
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="System-Updates"
                        secondary="Benachrichtigungen über System-Updates"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.systemUpdateNotifications}
                              onChange={() =>
                                handleUpdateSettings({
                                  smsNotifications: !settings.smsNotifications,
                                })
                              }
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Wartungsmodus"
                        secondary="Benachrichtigungen über Wartungsarbeiten"
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.maintenanceNotifications}
                              onChange={() =>
                                handleUpdateSettings({
                                  smsNotifications: !settings.smsNotifications,
                                })
                              }
                            />
                          }
                          label=""
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Backup sx={{ mr: 1 }} />
                    Backup erstellen
                  </Typography>

                  <Alert severity="info" sx={{ mb: 3 }}>
                    Erstellen Sie regelmäßig Backups Ihrer Daten, um Datenverluste zu vermeiden.
                  </Alert>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Letztes Backup"
                        secondary={
                          settings.lastBackup
                            ? format(settings.lastBackup, 'dd.MM.yyyy HH:mm', { locale: de })
                            : 'Nie'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Backup-Größe"
                        secondary={settings.backupSize || 'Unbekannt'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Backup-Typ" secondary="Vollständig" />
                    </ListItem>
                  </List>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<CloudUpload />}
                    onClick={() => setBackupDialogOpen(true)}
                    disabled={isBackingUp}
                    sx={{ mt: 2 }}
                  >
                    {isBackingUp ? 'Backup wird erstellt...' : 'Backup erstellen'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Restore sx={{ mr: 1 }} />
                    Daten wiederherstellen
                  </Typography>

                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Achtung: Das Wiederherstellen von Daten überschreibt alle aktuellen Daten!
                  </Alert>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Verfügbare Backups"
                        secondary={settings.availableBackups || 'Keine'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Backup-Format" secondary="JSON" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Wiederherstellungszeit" secondary="Ca. 5-10 Minuten" />
                    </ListItem>
                  </List>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<CloudDownload />}
                    onClick={() => setRestoreDialogOpen(true)}
                    disabled={isRestoring}
                    sx={{ mt: 2 }}
                  >
                    {isRestoring ? 'Wiederherstellung läuft...' : 'Daten wiederherstellen'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Features Tab */}
        <TabPanel value={activeTab} index={6}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Aktivieren oder deaktivieren Sie Features, die in der App angezeigt werden sollen.
                Änderungen werden sofort wirksam.
              </Alert>
            </Grid>

            {/* Admin Features */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Settings sx={{ mr: 1 }} />
                    Admin-Features
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText primary="Einsätze" secondary="Einsatzverwaltung" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={features?.enableAssignments ?? true}
                          onChange={e =>
                            handleUpdateFeatures({ enableAssignments: e.target.checked })
                          }
                          disabled={featuresLoading}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Audit-Logs" secondary="Audit-Protokollierung" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={features?.enableAuditLogs ?? true}
                          onChange={e =>
                            handleUpdateFeatures({ enableAuditLogs: e.target.checked })
                          }
                          disabled={featuresLoading}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Dokumenttypen"
                        secondary="Verwaltung von Dokumenttypen"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={features?.enableDocumentTypes ?? true}
                          onChange={e =>
                            handleUpdateFeatures({ enableDocumentTypes: e.target.checked })
                          }
                          disabled={featuresLoading}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Templates" secondary="Dokumenten-Templates" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={features?.enableTemplates ?? true}
                          onChange={e =>
                            handleUpdateFeatures({ enableTemplates: e.target.checked })
                          }
                          disabled={featuresLoading}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Employee Features */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <People sx={{ mr: 1 }} />
                    Mitarbeiter-Features
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText primary="Dokumente" secondary="Dokumentenverwaltung" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={features?.enableEmployeeDocuments ?? true}
                          onChange={e =>
                            handleUpdateFeatures({ enableEmployeeDocuments: e.target.checked })
                          }
                          disabled={featuresLoading}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Berichte" secondary="Eigene Berichte anzeigen" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={features?.enableEmployeeReports ?? true}
                          onChange={e =>
                            handleUpdateFeatures({ enableEmployeeReports: e.target.checked })
                          }
                          disabled={featuresLoading}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Einsätze" secondary="Eigene Einsätze anzeigen" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={features?.enableEmployeeAssignments ?? true}
                          onChange={e =>
                            handleUpdateFeatures({ enableEmployeeAssignments: e.target.checked })
                          }
                          disabled={featuresLoading}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Einrichtungen" secondary="Einrichtungen anzeigen" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={features?.enableEmployeeFacilities ?? true}
                          onChange={e =>
                            handleUpdateFeatures({ enableEmployeeFacilities: e.target.checked })
                          }
                          disabled={featuresLoading}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Benachrichtigungen"
                        secondary="Benachrichtigungs-Seite"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={features?.enableEmployeeNotifications ?? true}
                          onChange={e =>
                            handleUpdateFeatures({ enableEmployeeNotifications: e.target.checked })
                          }
                          disabled={featuresLoading}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Settings Dialog */}
        <Dialog
          open={settingsDialogOpen}
          onClose={() => setSettingsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Einstellungen bearbeiten</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="System-Name" defaultValue={settings.systemName} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Zeitzone</InputLabel>
                  <Select label="Zeitzone" defaultValue={settings.timezone}>
                    <MenuItem value="Europe/Berlin">Europa/Berlin</MenuItem>
                    <MenuItem value="Europe/London">Europa/London</MenuItem>
                    <MenuItem value="America/New_York">Amerika/New_York</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Sprache</InputLabel>
                  <Select label="Sprache" defaultValue={settings.language}>
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="fr">Français</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Währung</InputLabel>
                  <Select label="Währung" defaultValue={settings.currency}>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsDialogOpen(false)}>Abbrechen</Button>
            <Button
              onClick={() => handleUpdateSettings({})}
              variant="contained"
              disabled={isUpdating}
            >
              {isUpdating ? 'Speichere...' : 'Speichern'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Role Dialog */}
        <Dialog
          open={roleDialogOpen}
          onClose={() => setRoleDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{selectedItem ? 'Rolle bearbeiten' : 'Neue Rolle erstellen'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Rollen-Name"
                  placeholder="z.B. Admin, Disponent, Nurse"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Beschreibung"
                  multiline
                  rows={3}
                  placeholder="Beschreibung der Rolle..."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Berechtigungen</InputLabel>
                  <Select multiple label="Berechtigungen" defaultValue={[]}>
                    <MenuItem value="read">Lesen</MenuItem>
                    <MenuItem value="write">Schreiben</MenuItem>
                    <MenuItem value="delete">Löschen</MenuItem>
                    <MenuItem value="admin">Administration</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRoleDialogOpen(false)}>Abbrechen</Button>
            <Button
              onClick={() =>
                selectedItem
                  ? handleUpdateRole({
                      name: 'Updated Role',
                      description: 'Updated Description',
                    })
                  : handleCreateRole({
                      name: 'Test Role',
                      description: 'Test Description',
                      permissions: ['read'],
                      userCount: 0,
                      status: 'active',
                    })
              }
              variant="contained"
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? 'Speichere...' : 'Speichern'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Document Type Dialog */}
        <Dialog
          open={documentTypeDialogOpen}
          onClose={() => setDocumentTypeDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedItem ? 'Dokumenttyp bearbeiten' : 'Neuen Dokumenttyp erstellen'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Name"
                  placeholder="z.B. Führerschein, Gesundheitszeugnis"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Kategorie</InputLabel>
                  <Select label="Kategorie">
                    <MenuItem value="personal">Persönlich</MenuItem>
                    <MenuItem value="professional">Beruflich</MenuItem>
                    <MenuItem value="legal">Rechtlich</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Gültigkeitsdauer (Tage)"
                  type="number"
                  placeholder="365"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel control={<Switch />} label="Pflichtdokument" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDocumentTypeDialogOpen(false)}>Abbrechen</Button>
            <Button
              onClick={() =>
                selectedItem
                  ? handleUpdateDocumentType({
                      name: 'Updated Document Type',
                      category: 'professional',
                    })
                  : handleCreateDocumentType({
                      name: 'Test Document Type',
                      category: 'professional',
                      validityPeriod: 365,
                      required: false,
                      status: 'active',
                    })
              }
              variant="contained"
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? 'Speichere...' : 'Speichern'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Email Template Dialog */}
        <Dialog
          open={emailTemplateDialogOpen}
          onClose={() => setEmailTemplateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedItem ? 'E-Mail-Template bearbeiten' : 'Neues E-Mail-Template erstellen'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Template-Name"
                  placeholder="z.B. Schicht-Erinnerung, Krankmeldung"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Typ</InputLabel>
                  <Select label="Typ">
                    <MenuItem value="notification">Benachrichtigung</MenuItem>
                    <MenuItem value="reminder">Erinnerung</MenuItem>
                    <MenuItem value="confirmation">Bestätigung</MenuItem>
                    <MenuItem value="alert">Warnung</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Betreff" placeholder="Betreff der E-Mail" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="E-Mail-Inhalt"
                  multiline
                  rows={8}
                  placeholder="E-Mail-Inhalt mit Platzhaltern..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmailTemplateDialogOpen(false)}>Abbrechen</Button>
            <Button
              onClick={() =>
                selectedItem
                  ? handleUpdateEmailTemplate({
                      name: 'Updated Template',
                      type: 'notification',
                    })
                  : handleCreateEmailTemplate({
                      name: 'Test Template',
                      type: 'notification',
                      subject: 'Test Subject',
                      content: 'Test Content',
                      status: 'active',
                    })
              }
              variant="contained"
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? 'Speichere...' : 'Speichern'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Backup Dialog */}
        <Dialog
          open={backupDialogOpen}
          onClose={() => setBackupDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Backup erstellen</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Das Backup wird alle Systemdaten, Benutzer, Schichten und Dokumente enthalten.
            </Alert>

            <List>
              <ListItem>
                <ListItemText primary="Backup-Typ" secondary="Vollständig" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Geschätzte Größe" secondary="Ca. 50-100 MB" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Geschätzte Zeit" secondary="Ca. 2-5 Minuten" />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBackupDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleBackupData} variant="contained" disabled={isBackingUp}>
              {isBackingUp ? 'Backup wird erstellt...' : 'Backup erstellen'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Restore Dialog */}
        <Dialog
          open={restoreDialogOpen}
          onClose={() => setRestoreDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Daten wiederherstellen</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Achtung: Alle aktuellen Daten werden überschrieben!
            </Alert>

            <TextField
              fullWidth
              type="file"
              inputProps={{ accept: '.json' }}
              label="Backup-Datei auswählen"
              sx={{ mb: 3 }}
            />

            <List>
              <ListItem>
                <ListItemText primary="Wiederherstellungs-Typ" secondary="Vollständig" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Geschätzte Zeit" secondary="Ca. 5-10 Minuten" />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRestoreDialogOpen(false)}>Abbrechen</Button>
            <Button
              onClick={() => handleRestoreData(new File([], 'backup.json'))}
              variant="contained"
              disabled={isRestoring}
            >
              {isRestoring ? 'Wiederherstellung läuft...' : 'Wiederherstellen'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </GlobalErrorBoundary>
  );
}
