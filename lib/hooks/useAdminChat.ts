'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminChatService } from '@/lib/services/adminChat';
import type { Channel, Broadcast, Announcement } from '@/lib/services/adminChat';
import { toast } from '@/lib/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

// Re-export types from service
export type { Channel, Message, Broadcast, Announcement } from '@/lib/services/adminChat';

export interface ChatUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  lastActivity: Date;
  channelCount: number;
  avatar?: string;
}

export interface ChannelStats {
  totalChannels: number;
  activeUsers: number;
  totalMessages: number;
  unreadMessages: number;
  totalBroadcasts: number;
  totalAnnouncements: number;
  broadcasts: Broadcast[];
  announcements: Announcement[];
}

export function useAdminChat() {
  const queryClient = useQueryClient();
  const { user, firebaseUser } = useAuth();
  const userId = firebaseUser?.uid || user?.id;

  // Realtime channels subscription
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState<Error | null>(null);

  useEffect(() => {
    setChannelsLoading(true);
    setChannelsError(null);

    const unsubscribe = adminChatService.subscribeToChannels((newChannels) => {
      setChannels(newChannels);
      setChannelsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Get all messages
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: () => adminChatService.getMessages(),
  });

  // Get all users
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['adminChatUsers'],
    queryFn: () => adminChatService.getUsers(),
  });

  // Realtime broadcasts subscription
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [broadcastsLoading, setBroadcastsLoading] = useState(true);

  useEffect(() => {
    setBroadcastsLoading(true);

    const unsubscribe = adminChatService.subscribeToBroadcasts((newBroadcasts) => {
      setBroadcasts(newBroadcasts);
      setBroadcastsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Realtime announcements subscription
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  useEffect(() => {
    setAnnouncementsLoading(true);

    const unsubscribe = adminChatService.subscribeToAnnouncements((newAnnouncements) => {
      setAnnouncements(newAnnouncements);
      setAnnouncementsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      type: 'public' | 'private' | 'announcement';
      members: string[];
    }) => adminChatService.createChannel(data, userId),
    onSuccess: () => {
      // Channels werden automatisch über Realtime-Subscription aktualisiert
      toast.success('Kanal erfolgreich erstellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen des Kanals: ' + error.message);
    },
  });

  // Update channel mutation
  const updateChannelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Channel> }) =>
      adminChatService.updateChannel(id, data),
    onSuccess: () => {
      // Channels werden automatisch über Realtime-Subscription aktualisiert
      toast.success('Kanal erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren des Kanals: ' + error.message);
    },
  });

  // Delete channel mutation
  const deleteChannelMutation = useMutation({
    mutationFn: (id: string) => adminChatService.deleteChannel(id),
    onSuccess: () => {
      // Channels werden automatisch über Realtime-Subscription aktualisiert
      toast.success('Kanal erfolgreich gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen des Kanals: ' + error.message);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ channelId, content }: { channelId: string; content: string }) =>
      adminChatService.sendMessage(channelId, content, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      toast.success('Nachricht erfolgreich gesendet');
    },
    onError: (error) => {
      toast.error('Fehler beim Senden der Nachricht: ' + error.message);
    },
  });

  // Send broadcast mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: (data: {
      title: string;
      message: string;
      priority: 'low' | 'medium' | 'high';
      targetUsers: string[];
    }) => adminChatService.sendBroadcast(data, userId),
    onSuccess: () => {
      // Broadcasts werden automatisch über Realtime-Subscription aktualisiert
      toast.success('Broadcast erfolgreich gesendet');
    },
    onError: (error) => {
      toast.error('Fehler beim Senden des Broadcasts: ' + error.message);
    },
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: (data: {
      title: string;
      message: string;
      type: 'info' | 'warning' | 'urgent';
      scheduledFor?: Date;
    }) => adminChatService.createAnnouncement(data, userId),
    onSuccess: () => {
      // Announcements werden automatisch über Realtime-Subscription aktualisiert
      toast.success('Ankündigung erfolgreich erstellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen der Ankündigung: ' + error.message);
    },
  });

  // Helper functions
  const createChannel = async (data: {
    name: string;
    description: string;
    type: 'public' | 'private' | 'announcement';
    members: string[];
  }) => {
    return createChannelMutation.mutateAsync(data);
  };

  const updateChannel = async (id: string, data: Partial<Channel>) => {
    return updateChannelMutation.mutateAsync({ id, data });
  };

  const deleteChannel = async (id: string) => {
    return deleteChannelMutation.mutateAsync(id);
  };

  const sendMessage = async (channelId: string, content: string) => {
    return sendMessageMutation.mutateAsync({ channelId, content });
  };

  const sendBroadcast = async (data: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    targetUsers: string[];
  }) => {
    return sendBroadcastMutation.mutateAsync(data);
  };

  const createAnnouncement = async (data: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent';
    scheduledFor?: Date;
  }) => {
    return createAnnouncementMutation.mutateAsync(data);
  };

  // Get unread count
  const {
    data: unreadCount = 0,
  } = useQuery({
    queryKey: ['adminChatUnreadCount', userId],
    queryFn: () => userId ? adminChatService.getUnreadCount(userId) : Promise.resolve(0),
    enabled: !!userId,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  // Get channel statistics - nur noch echte Daten, keine Mock-Daten
  const getChannelStats = (): ChannelStats => {
    return {
      totalChannels: channels.length,
      activeUsers: users.filter(u => u.status === 'online').length,
      totalMessages: channels.reduce((sum, channel) => sum + (channel.messageCount || 0), 0),
      unreadMessages: unreadCount,
      totalBroadcasts: broadcasts.length,
      totalAnnouncements: announcements.length,
      broadcasts: broadcasts,
      announcements: announcements,
    };
  };

  return {
    channels,
    messages,
    users,
    isLoading: channelsLoading || messagesLoading || usersLoading || broadcastsLoading || announcementsLoading,
    error: channelsError || messagesError || usersError,
    createChannel,
    updateChannel,
    deleteChannel,
    sendMessage,
    sendBroadcast,
    createAnnouncement,
    getChannelStats,
    isSending: sendMessageMutation.isPending || sendBroadcastMutation.isPending,
    isCreating: createChannelMutation.isPending,
    isUpdating: updateChannelMutation.isPending,
    isDeleting: deleteChannelMutation.isPending,
  };
}
