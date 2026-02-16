'use client';

import { logger } from '@/lib/logging';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useEmployeeNotifications } from '@/lib/hooks/useEmployeeNotifications';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const open = Boolean(anchorEl);

  // Hydration Guard: Warte bis nach dem ersten Client-Render
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Verwende den richtigen Hook basierend auf der User-Rolle
  // WICHTIG: Nur den benötigten Hook aufrufen, um SSR-Probleme zu vermeiden
  const isEmployee = user?.role === 'nurse';

  // Conditional hook calls - React erlaubt das nicht direkt, daher verwenden wir enabled-Flags
  // Aber wir können die Hooks immer aufrufen und nur die Ergebnisse basierend auf der Rolle verwenden
  const adminNotifications = useNotifications();
  const employeeNotifications = useEmployeeNotifications();

  // Während SSR: Verwende leere Arrays, um konsistentes Rendering zu gewährleisten
  const notifications = useMemo(() => {
    if (!isHydrated) return [];
    return isEmployee ? employeeNotifications.notifications : adminNotifications.notifications;
  }, [
    isHydrated,
    isEmployee,
    employeeNotifications.notifications,
    adminNotifications.notifications,
  ]);

  const isLoading = useMemo(() => {
    if (!isHydrated) return false;
    return isEmployee ? employeeNotifications.isLoading : adminNotifications.isLoading;
  }, [isHydrated, isEmployee, employeeNotifications.isLoading, adminNotifications.isLoading]);
  const markAsRead = isEmployee ? employeeNotifications.markAsRead : adminNotifications.markAsRead;
  const markAllAsRead = isEmployee
    ? employeeNotifications.markAllAsRead
    : adminNotifications.markAllAsRead;

  // Berechne ungelesene Benachrichtigungen
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Neueste 5 Benachrichtigungen
  const recentNotifications = useMemo(() => {
    return notifications.slice(0, 5);
  }, [notifications]);

  // Benachrichtigungsseite basierend auf Rolle
  const notificationsPath = isEmployee ? '/employee/benachrichtigungen' : '/admin/einstellungen'; // Admin hat keine dedizierte Benachrichtigungsseite, verwende Einstellungen

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notificationId: string, actionUrl?: string) => {
    // Markiere als gelesen
    try {
      await markAsRead(notificationId);
    } catch (error) {
      logger.error('Fehler beim Markieren als gelesen:', error);
    }

    handleClose();

    // Navigiere zur Action-URL falls vorhanden
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      logger.error('Fehler beim Markieren aller als gelesen:', error);
    }
  };

  const handleViewAll = () => {
    handleClose();
    router.push(notificationsPath);
  };

  // Während SSR oder wenn kein User: Rendere nichts (konsistent)
  if (!isHydrated || !user) {
    return null;
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        sx={{ color: 'rgba(0,0,0,0.8)' }}
        aria-label="Benachrichtigungen"
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 320,
            maxWidth: 400,
            maxHeight: 500,
            overflow: 'auto',
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Benachrichtigungen
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={handleMarkAllAsRead}
                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
              >
                Alle als gelesen
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : recentNotifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Keine Benachrichtigungen
            </Typography>
          </Box>
        ) : (
          <>
            {recentNotifications.map(notification => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                sx={{
                  py: 1.5,
                  px: 2,
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: notification.read ? 'transparent' : 'primary.main',
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: notification.read ? 400 : 600,
                        mb: 0.5,
                      }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                          locale: de,
                        })}
                      </Typography>
                    </>
                  }
                />
              </MenuItem>
            ))}
          </>
        )}

        {notifications.length > 5 && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                component={Link}
                href={notificationsPath}
                onClick={handleViewAll}
                sx={{ textTransform: 'none' }}
              >
                Alle anzeigen ({notifications.length})
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}
