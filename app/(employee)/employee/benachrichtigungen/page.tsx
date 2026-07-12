'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { useEmployeeNotifications } from '@/lib/hooks/useEmployeeNotifications';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
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
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormGroup,
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  MarkEmailRead,
  MarkEmailUnread,
  Delete,
  Search,
  Refresh,
  Settings,
  Info,
  Warning,
  Error,
  CheckCircle,
  Work,
  Sick,
  Message,
  Email,
  Sms,
  PushPin,
  Star,
  Archive,
  ExpandMore,
  Clear,
  SelectAll,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors, semanticColors } from '@/lib/design-tokens';

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
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EmployeeNotificationsPage() {
  const { user, loading: authLoading } = useAuth();

  const {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications: _deleteAllNotifications,
    getNotificationStats,
    updateNotificationSettings: _updateNotificationSettings,
    isUpdating,
    isDeleting,
  } = useEmployeeNotifications();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  type NotificationItem = {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    priority?: 'high' | 'normal' | 'low';
    starred?: boolean;
    createdAt: Date;
    details?: string;
  };
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setDetailsDialogOpen(true);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (_error) {
      // Error handling is done in the mutations
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      await markAsUnread(notificationId);
    } catch (_error) {
      // Error handling is done in the mutations
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (_error) {
      // Error handling is done in the mutations
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (_error) {
      // Error handling is done in the mutations
    }
  };

  const handleDeleteSelected = async () => {
    try {
      for (const notificationId of selectedNotifications) {
        await deleteNotification(notificationId);
      }
      setSelectedNotifications([]);
    } catch (_error) {
      // Error handling is done in the mutations
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    const filteredNotifications = getFilteredNotifications();
    setSelectedNotifications(filteredNotifications.map(n => n.id));
  };

  const handleDeselectAll = () => {
    setSelectedNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info color="info" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <Error color="error" />;
      case 'success':
        return <CheckCircle color="success" />;
      case 'shift':
        return <Work color="primary" />;
      case 'sick':
        return <Sick color="error" />;
      case 'message':
        return <Message color="secondary" />;
      case 'email':
        return <Email color="primary" />;
      case 'sms':
        return <Sms color="secondary" />;
      default:
        return <Notifications color="inherit" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'success':
        return 'success';
      case 'shift':
        return 'primary';
      case 'sick':
        return 'error';
      case 'message':
        return 'secondary';
      case 'email':
        return 'primary';
      case 'sms':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || notification.type === filterType;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'read' && notification.read) ||
        (filterStatus === 'unread' && !notification.read);
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  const stats = getNotificationStats();
  const filteredNotifications = getFilteredNotifications();

  if (authLoading || isLoading) {
    return <LoadingSpinner variant="skeleton" message="Benachrichtigungen werden geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Bitte melde dich an, um deine Benachrichtigungen zu verwalten.
        </Alert>
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="wide">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
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
          Benachrichtigungen
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Verwalten Sie Ihre Benachrichtigungen und Einstellungen
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gesamt
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {stats.unread}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ungelesen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {stats.read}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gelesen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="glass">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {stats.archived}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Archiviert
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<MarkEmailRead />}
          onClick={handleMarkAllAsRead}
          disabled={isUpdating || stats.unread === 0}
        >
          {isUpdating ? 'Markiere...' : 'Alle als gelesen markieren'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<SelectAll />}
          onClick={handleSelectAll}
          disabled={filteredNotifications.length === 0}
        >
          Alle auswählen
        </Button>
        <Button
          variant="outlined"
          startIcon={<SelectAll />}
          onClick={handleDeselectAll}
          disabled={selectedNotifications.length === 0}
        >
          Auswahl aufheben
        </Button>
        <Button
          variant="outlined"
          startIcon={<Delete />}
          onClick={handleDeleteSelected}
          disabled={selectedNotifications.length === 0 || isDeleting}
          color="error"
        >
          {isDeleting ? 'Lösche...' : `Ausgewählte löschen (${selectedNotifications.length})`}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Settings />}
          onClick={() => setSettingsDialogOpen(true)}
        >
          Einstellungen
        </Button>
        <Button variant="outlined" startIcon={<Refresh />} onClick={() => window.location.reload()}>
          Aktualisieren
        </Button>
      </Box>

      {/* Filters */}
      <Paper className="glass" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Benachrichtigungen filtern
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Benachrichtigungen suchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Typ</InputLabel>
              <Select value={filterType} label="Typ" onChange={e => setFilterType(e.target.value)}>
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="info">Information</MenuItem>
                <MenuItem value="warning">Warnung</MenuItem>
                <MenuItem value="error">Fehler</MenuItem>
                <MenuItem value="success">Erfolg</MenuItem>
                <MenuItem value="shift">Schicht</MenuItem>
                <MenuItem value="sick">Krankheit</MenuItem>
                <MenuItem value="message">Nachricht</MenuItem>
                <MenuItem value="email">E-Mail</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={e => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="unread">Ungelesen</MenuItem>
                <MenuItem value="read">Gelesen</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}
            >
              <Clear />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper className="glass" sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`Alle (${stats.total})`} icon={<Notifications />} iconPosition="start" />
          <Tab
            label={`Ungelesen (${stats.unread})`}
            icon={<NotificationsActive />}
            iconPosition="start"
          />
          <Tab label={`Gelesen (${stats.read})`} icon={<MarkEmailRead />} iconPosition="start" />
          <Tab label={`Archiviert (${stats.archived})`} icon={<Archive />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <Card className="glass">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Notifications sx={{ mr: 1 }} />
              Alle Benachrichtigungen
            </Typography>

            {filteredNotifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <NotificationsOff sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Keine Benachrichtigungen gefunden
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                    ? 'Versuchen Sie andere Filtereinstellungen'
                    : 'Sie haben noch keine Benachrichtigungen erhalten'}
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredNotifications.map(notification => (
                  <ListItem
                    key={notification.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                    onClick={() =>
                      handleNotificationClick({
                        ...notification,
                        priority:
                          notification.priority === 'medium'
                            ? 'normal'
                            : (notification.priority as 'high' | 'low' | 'normal' | undefined),
                      })
                    }
                  >
                    <Checkbox
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={e => {
                        e.stopPropagation();
                        handleSelectNotification(notification.id);
                      }}
                      sx={{ mr: 2 }}
                    />
                    <Avatar
                      sx={{ mr: 2, bgcolor: `${getNotificationColor(notification.type)}.main` }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: notification.read ? 400 : 600 }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && <Badge color="primary" variant="dot" />}
                          {notification.priority === 'high' && (
                            <PushPin color="error" fontSize="small" />
                          )}
                          {notification.starred && <Star color="warning" fontSize="small" />}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {notification.message}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={notification.type}
                              color={getNotificationColor(notification.type) as ChipProps['color']}
                              size="small"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {format(notification.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            if (notification.read) {
                              handleMarkAsUnread(notification.id);
                            } else {
                              handleMarkAsRead(notification.id);
                            }
                          }}
                        >
                          {notification.read ? <MarkEmailUnread /> : <MarkEmailRead />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                          color="error"
                          disabled={isDeleting}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Card className="glass">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <NotificationsActive sx={{ mr: 1 }} />
              Ungelesene Benachrichtigungen
            </Typography>

            {filteredNotifications.filter(n => !n.read).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Alle Benachrichtigungen gelesen
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sie haben keine ungelesenen Benachrichtigungen
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredNotifications
                  .filter(n => !n.read)
                  .map(notification => (
                    <ListItem
                      key={notification.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: 'action.hover',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.selected',
                        },
                      }}
                      onClick={() =>
                        handleNotificationClick({
                          ...notification,
                          priority:
                            notification.priority === 'medium'
                              ? 'normal'
                              : (notification.priority as 'high' | 'low' | 'normal' | undefined),
                        })
                      }
                    >
                      <Checkbox
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={e => {
                          e.stopPropagation();
                          handleSelectNotification(notification.id);
                        }}
                        sx={{ mr: 2 }}
                      />
                      <Avatar
                        sx={{ mr: 2, bgcolor: `${getNotificationColor(notification.type)}.main` }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {notification.title}
                            </Typography>
                            <Badge color="primary" variant="dot" />
                            {notification.priority === 'high' && (
                              <PushPin color="error" fontSize="small" />
                            )}
                            {notification.starred && <Star color="warning" fontSize="small" />}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {notification.message}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip
                                label={notification.type}
                                color={
                                  getNotificationColor(notification.type) as
                                    | 'default'
                                    | 'primary'
                                    | 'secondary'
                                    | 'error'
                                    | 'info'
                                    | 'success'
                                    | 'warning'
                                }
                                size="small"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {format(notification.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <MarkEmailRead />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            color="error"
                            disabled={isDeleting}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Card className="glass">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <MarkEmailRead sx={{ mr: 1 }} />
              Gelesene Benachrichtigungen
            </Typography>

            {filteredNotifications.filter(n => n.read).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <NotificationsOff sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Keine gelesenen Benachrichtigungen
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sie haben noch keine Benachrichtigungen gelesen
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredNotifications
                  .filter(n => n.read)
                  .map(notification => (
                    <ListItem
                      key={notification.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.selected',
                        },
                      }}
                      onClick={() =>
                        handleNotificationClick({
                          ...notification,
                          priority:
                            notification.priority === 'medium'
                              ? 'normal'
                              : (notification.priority as 'high' | 'low' | 'normal' | undefined),
                        })
                      }
                    >
                      <Checkbox
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={e => {
                          e.stopPropagation();
                          handleSelectNotification(notification.id);
                        }}
                        sx={{ mr: 2 }}
                      />
                      <Avatar
                        sx={{ mr: 2, bgcolor: `${getNotificationColor(notification.type)}.main` }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 400 }}>
                              {notification.title}
                            </Typography>
                            {notification.priority === 'high' && (
                              <PushPin color="error" fontSize="small" />
                            )}
                            {notification.starred && <Star color="warning" fontSize="small" />}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {notification.message}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip
                                label={notification.type}
                                color={
                                  getNotificationColor(notification.type) as ChipProps['color']
                                }
                                size="small"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {format(notification.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              handleMarkAsUnread(notification.id);
                            }}
                          >
                            <MarkEmailUnread />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            color="error"
                            disabled={isDeleting}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Card className="glass">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Archive sx={{ mr: 1 }} />
              Archivierte Benachrichtigungen
            </Typography>

            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Archive sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Keine archivierten Benachrichtigungen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Archivierte Benachrichtigungen werden hier angezeigt
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Notification Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{ bgcolor: `${getNotificationColor(selectedNotification?.type || 'info')}.main` }}
            >
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedNotification?.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedNotification &&
                  format(selectedNotification.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedNotification.message}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={selectedNotification.type}
                  color={getNotificationColor(selectedNotification.type) as ChipProps['color']}
                  size="small"
                />
                {selectedNotification.priority === 'high' && (
                  <Chip label="Hoch" color="error" size="small" />
                )}
                {selectedNotification.starred && (
                  <Chip label="Markiert" color="warning" size="small" />
                )}
              </Box>

              {selectedNotification.details && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1">Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2">{selectedNotification.details}</Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Schließen</Button>
          {selectedNotification && (
            <>
              <Button
                onClick={() => {
                  if (selectedNotification.read) {
                    handleMarkAsUnread(selectedNotification.id);
                  } else {
                    handleMarkAsRead(selectedNotification.id);
                  }
                  setDetailsDialogOpen(false);
                }}
                startIcon={selectedNotification.read ? <MarkEmailUnread /> : <MarkEmailRead />}
              >
                {selectedNotification.read ? 'Als ungelesen markieren' : 'Als gelesen markieren'}
              </Button>
              <Button
                onClick={() => {
                  handleDeleteNotification(selectedNotification.id);
                  setDetailsDialogOpen(false);
                }}
                color="error"
                startIcon={<Delete />}
              >
                Löschen
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Benachrichtigungs-Einstellungen</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Benachrichtigungstypen
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="E-Mail-Benachrichtigungen"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Push-Benachrichtigungen"
                />
                <FormControlLabel control={<Switch />} label="SMS-Benachrichtigungen" />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Schicht-Erinnerungen"
                />
                <FormControlLabel control={<Switch defaultChecked />} label="Krankmeldungen" />
                <FormControlLabel control={<Switch defaultChecked />} label="System-Updates" />
              </FormGroup>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Häufigkeit
              </Typography>
              <FormControl fullWidth>
                <InputLabel>E-Mail-Häufigkeit</InputLabel>
                <Select label="E-Mail-Häufigkeit" defaultValue="immediate">
                  <MenuItem value="immediate">Sofort</MenuItem>
                  <MenuItem value="hourly">Stündlich</MenuItem>
                  <MenuItem value="daily">Täglich</MenuItem>
                  <MenuItem value="weekly">Wöchentlich</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Stille Zeiten
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Von"
                    type="time"
                    defaultValue="22:00"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Bis"
                    type="time"
                    defaultValue="07:00"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={() => setSettingsDialogOpen(false)} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
