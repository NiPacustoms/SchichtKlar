'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { employeeNotificationsService } from '@/lib/services/employeeNotifications';
import { toast } from '@/lib/utils/toast';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'shift' | 'sick' | 'message' | 'email' | 'sms';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  starred: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  details?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  shiftReminders: boolean;
  sickNotifications: boolean;
  systemUpdates: boolean;
  emailFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHoursStart: string;
  quietHoursEnd: string;
}

export function useEmployeeNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  // Get all notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employeeNotifications', userId, user?.companyId],
    queryFn: () => employeeNotificationsService.getAll(userId, user?.companyId || undefined),
    enabled: !!userId,
  });

  // Get notification settings
  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ['employeeNotificationSettings', userId],
    queryFn: () => employeeNotificationsService.getSettings(userId),
    enabled: !!userId,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => employeeNotificationsService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeNotifications', userId] });
      toast.success('Benachrichtigung als gelesen markiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Markieren als gelesen: ' + error.message);
    },
  });

  // Mark as unread mutation
  const markAsUnreadMutation = useMutation({
    mutationFn: (notificationId: string) => employeeNotificationsService.markAsUnread(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeNotifications', userId] });
      toast.success('Benachrichtigung als ungelesen markiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Markieren als ungelesen: ' + error.message);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => employeeNotificationsService.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeNotifications', userId] });
      toast.success('Alle Benachrichtigungen als gelesen markiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Markieren aller Benachrichtigungen: ' + error.message);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => employeeNotificationsService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeNotifications', userId] });
      toast.success('Benachrichtigung gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen der Benachrichtigung: ' + error.message);
    },
  });

  // Delete all notifications mutation
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: () => employeeNotificationsService.deleteAllNotifications(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeNotifications', userId] });
      toast.success('Alle Benachrichtigungen gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen aller Benachrichtigungen: ' + error.message);
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<NotificationSettings>) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return employeeNotificationsService.updateSettings(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeNotificationSettings', userId] });
      toast.success('Einstellungen erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren der Einstellungen: ' + error.message);
    },
  });

  // Helper functions
  const markAsRead = async (notificationId: string) => {
    return markAsReadMutation.mutateAsync(notificationId);
  };

  const markAsUnread = async (notificationId: string) => {
    return markAsUnreadMutation.mutateAsync(notificationId);
  };

  const markAllAsRead = async () => {
    if (!userId) {
      throw new Error('Kein Benutzer angemeldet');
    }
    return markAllAsReadMutation.mutateAsync();
  };

  const deleteNotification = async (notificationId: string) => {
    return deleteNotificationMutation.mutateAsync(notificationId);
  };

  const deleteAllNotifications = async () => {
    if (!userId) {
      throw new Error('Kein Benutzer angemeldet');
    }
    return deleteAllNotificationsMutation.mutateAsync();
  };

  const updateNotificationSettings = async (data: Partial<NotificationSettings>) => {
    if (!userId) {
      throw new Error('Kein Benutzer angemeldet');
    }
    return updateSettingsMutation.mutateAsync(data);
  };

  // Get notification statistics
  const getNotificationStats = (): NotificationStats => {
    if (!userId) {
      return { total: 0, unread: 0, read: 0, archived: 0, byType: {}, byPriority: {} };
    }

    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const read = notifications.filter(n => n.read).length;
    const archived = notifications.filter(n => n.archived).length;

    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    notifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
    });

    return {
      total,
      unread,
      read,
      archived,
      byType,
      byPriority,
    };
  };

  return {
    notifications,
    settings: settings || {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      shiftReminders: true,
      sickNotifications: true,
      systemUpdates: true,
      emailFrequency: 'immediate',
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    },
    isLoading: isLoading || settingsLoading,
    error: error || settingsError,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    updateNotificationSettings,
    getNotificationStats,
    refetch,
    isUpdating: markAsReadMutation.isPending || markAsUnreadMutation.isPending || markAllAsReadMutation.isPending || updateSettingsMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending || deleteAllNotificationsMutation.isPending,
  };
}
