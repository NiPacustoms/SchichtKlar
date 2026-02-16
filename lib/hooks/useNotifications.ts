'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/lib/services/notifications';
import { toast } from '@/lib/utils/toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'schedule' | 'email' | 'phone' | 'message';
  read: boolean;
  important: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  reminderEnabled: boolean;
  alertEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  types: {
    [key: string]: boolean;
  };
}

export function useNotifications() {
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
    queryKey: ['notifications', userId],
    queryFn: () => notificationService.getAll(userId || undefined),
    enabled: !!userId,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      toast.success('Benachrichtigung als gelesen markiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Markieren: ' + error.message);
    },
  });

  // Mark as unread mutation
  const markAsUnreadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsUnread(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      toast.success('Benachrichtigung als ungelesen markiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Markieren: ' + error.message);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      toast.success('Alle Benachrichtigungen als gelesen markiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Markieren: ' + error.message);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      toast.success('Benachrichtigung gelöscht');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Löschen: ' + error.message);
    },
  });

  // Delete all notifications mutation
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: () => notificationService.deleteAll(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      toast.success('Alle Benachrichtigungen gelöscht');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Löschen: ' + error.message);
    },
  });

  // Update notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) => notificationService.updateSettings(userId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      toast.success('Einstellungen aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren: ' + error.message);
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

  const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
    if (!userId) {
      throw new Error('Kein Benutzer angemeldet');
    }
    return updateNotificationSettingsMutation.mutateAsync(settings);
  };

  // Get notification statistics
  const getNotificationStats = () => {
    if (!userId) {
      return { total: 0, unread: 0, read: 0, important: 0 };
    }

    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const read = notifications.filter(n => n.read).length;
    const important = notifications.filter(n => n.important).length;

    return { total, unread, read, important };
  };

  return {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    updateNotificationSettings,
    getNotificationStats,
    refetch,
    isUpdating: markAsReadMutation.isPending || markAsUnreadMutation.isPending || markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending || deleteAllNotificationsMutation.isPending,
  };
}