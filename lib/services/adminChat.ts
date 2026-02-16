import { db } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

const CHANNELS_COLLECTION = 'adminChannels';
const MESSAGES_COLLECTION = 'adminMessages';
const BROADCASTS_COLLECTION = 'adminBroadcasts';
const ANNOUNCEMENTS_COLLECTION = 'adminAnnouncements';
const USERS_COLLECTION = 'users';

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'announcement';
  memberCount: number;
  messageCount: number;
  lastMessage?: string | null;
  lastMessageAt?: Date | null;
  lastMessageSenderId?: string | null;
  hasAttachments?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  members: string[];
  unreadCount?: Record<string, number>;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  createdAt: Date;
  updatedAt: Date;
  edited: boolean;
  replyTo?: string;
  metadata?: Record<string, unknown>;
  readBy?: string[]; // Array of user IDs who have read this message
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  recipientCount: number;
  sentAt: Date;
  status: 'sent' | 'pending' | 'failed';
  createdBy: string;
  recipients: string[];
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  status: 'published' | 'scheduled' | 'draft';
  scheduledFor?: Date;
  publishedAt?: Date;
  createdBy: string;
}

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

export const adminChatService = {
  // Get all channels
  async getChannels(): Promise<Channel[]> {
    if (!db) return [];
    const q = query(
      collection(db, CHANNELS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const channels: Channel[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      channels.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        type: data.type,
        memberCount: data.memberCount || 0,
        messageCount: data.messageCount || 0,
        lastMessage: data.lastMessage ?? null,
        lastMessageAt: data.lastMessageAt?.toDate?.() || null,
        lastMessageSenderId: data.lastMessageSenderId ?? null,
        hasAttachments: data.hasAttachments ?? false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy,
        members: data.members || [],
        unreadCount: data.unreadCount || {},
      });
    });

    return channels;
  },

  // Get all messages
  async getMessages(): Promise<Message[]> {
    try {
      if (!db) return [];
      const q = query(
        collection(db, MESSAGES_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const messages: Message[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          channelId: data.channelId,
          userId: data.userId,
          content: data.content,
          type: data.type || 'text',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          edited: data.edited || false,
          replyTo: data.replyTo,
          metadata: data.metadata,
          readBy: data.readBy || [],
        });
      });

      return messages;
    } catch (error) {
      throw error;
    }
  },

  // Get all users
  async getUsers(): Promise<ChatUser[]> {
    try {
      if (!db) return [];
      const q = query(
        collection(db, USERS_COLLECTION),
        orderBy('displayName', 'asc')
      );

      const snapshot = await getDocs(q);
      const users: ChatUser[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          id: doc.id,
          displayName: data.displayName,
          email: data.email,
          role: data.role,
          status: data.status || 'offline',
          lastActivity: data.lastActivity?.toDate() || new Date(),
          channelCount: data.channelCount || 0,
          avatar: data.avatar,
        });
      });

      return users;
    } catch (error) {
      throw error;
    }
  },

  // Create channel
  async createChannel(data: {
    name: string;
    description: string;
    type: 'public' | 'private' | 'announcement';
    members: string[];
  }, userId?: string): Promise<string> {
    try {
      if (!db) throw new Error('Firestore nicht initialisiert');
      if (!userId) throw new Error('Kein Benutzer für Admin-Channel übergeben');
      const createdBy = userId;
      const unreadCount = data.members.reduce<Record<string, number>>((acc, memberId) => {
        if (memberId) {
          acc[memberId] = 0;
        }
        return acc;
      }, {});
      
      const channelData = {
        ...data,
        memberCount: data.members.length,
        messageCount: 0,
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
        lastMessageAt: null,
        lastMessageSenderId: null,
        hasAttachments: false,
        unreadCount,
      };

      const docRef = await addDoc(collection(db, CHANNELS_COLLECTION), channelData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Update channel
  async updateChannel(id: string, data: Partial<Channel>): Promise<void> {
    try {
      if (!db) return;
      const channelRef = doc(db, CHANNELS_COLLECTION, id);
      await updateDoc(channelRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Delete channel
  async deleteChannel(id: string): Promise<void> {
    if (!db) throw new Error('Firestore nicht initialisiert');
    await deleteDoc(doc(db, CHANNELS_COLLECTION, id));
  },

  // Send message
  async sendMessage(channelId: string, content: string, userId?: string): Promise<string> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    if (!userId) {
      throw new Error('Kein Benutzer für Admin-Chat-Nachricht übergeben');
    }

    try {
      const trimmed = content?.trim?.() ?? '';
      const preview = trimmed
        ? trimmed.length > 200
          ? `${trimmed.slice(0, 197)}…`
          : trimmed
        : '';

      const messageData = {
        channelId,
        userId,
        content,
        type: 'text',
        edited: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        readBy: [userId],
      };

      const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

      const channelRef = doc(db, CHANNELS_COLLECTION, channelId);
      await runTransaction(db, async transaction => {
        const channelSnap = await transaction.get(channelRef);
        if (!channelSnap.exists()) return;

        const data = channelSnap.data() as {
          members?: string[];
          unreadCount?: Record<string, number>;
        };

        const members: string[] = Array.isArray(data.members) ? data.members : [];
        const unreadCount: Record<string, number> = { ...(data.unreadCount || {}) };

        members.forEach(memberId => {
          if (!memberId) return;
          if (memberId === userId) {
            unreadCount[memberId] = 0;
          } else {
            unreadCount[memberId] = (unreadCount[memberId] || 0) + 1;
          }
        });

        transaction.update(channelRef, {
          messageCount: increment(1),
          updatedAt: serverTimestamp(),
          lastMessage: preview,
          lastMessageAt: serverTimestamp(),
          lastMessageSenderId: userId,
          hasAttachments: false,
          unreadCount,
          _lastMessageId: docRef.id,
        });
      });

      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Send broadcast
  async sendBroadcast(data: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    targetUsers: string[];
  }, userId?: string): Promise<string> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      if (!userId) throw new Error('Kein Benutzer für Admin-Broadcast übergeben');
      const broadcastUserId = userId;
      
      const broadcastData = {
        ...data,
        recipientCount: data.targetUsers.length,
        status: 'sent',
        sentAt: serverTimestamp(),
        createdBy: broadcastUserId,
        recipients: data.targetUsers,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, BROADCASTS_COLLECTION), broadcastData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Create announcement
  async createAnnouncement(data: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent';
    scheduledFor?: Date;
  }, userId?: string): Promise<string> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      if (!userId) throw new Error('Kein Benutzer für Admin-Ankündigung übergeben');
      const announcementUserId = userId;
      
      const announcementData = {
        ...data,
        status: data.scheduledFor ? 'scheduled' : 'published',
        publishedAt: data.scheduledFor ? undefined : serverTimestamp(),
        createdBy: announcementUserId,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), announcementData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Get channel by ID
  async getChannelById(_channelId: string): Promise<Channel | null> {
    if (!db) return null;
    try {
      const channelDoc = await getDoc(doc(db, CHANNELS_COLLECTION, _channelId));
      if (!channelDoc.exists()) {
        return null;
      }

      const data = channelDoc.data();
      return {
        id: channelDoc.id,
        name: data.name,
        description: data.description,
        type: data.type,
        memberCount: data.memberCount || 0,
        messageCount: data.messageCount || 0,
        lastMessage: data.lastMessage ?? null,
        lastMessageAt: data.lastMessageAt?.toDate?.() || null,
        lastMessageSenderId: data.lastMessageSenderId ?? null,
        hasAttachments: data.hasAttachments ?? false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy,
        members: data.members || [],
        unreadCount: data.unreadCount || {},
      };
    } catch (error) {
      throw error;
    }
  },

  // Get messages for channel
  async getChannelMessages(_channelId: string, limitCount: number = 50): Promise<Message[]> {
    if (!db) {
      return [];
    }
    try {
      const q = query(
        collection(db, MESSAGES_COLLECTION),
        where('channelId', '==', _channelId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const messages: Message[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          channelId: data.channelId,
          userId: data.userId,
          content: data.content,
          type: data.type || 'text',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          edited: data.edited || false,
          replyTo: data.replyTo,
          metadata: data.metadata,
          readBy: data.readBy || [],
        });
      });

      return messages;
    } catch (error) {
      throw error;
    }
  },

  // Get broadcasts
  async getBroadcasts(): Promise<Broadcast[]> {
    if (!db) {
      return [];
    }
    try {
      const q = query(
        collection(db, BROADCASTS_COLLECTION),
        orderBy('sentAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const broadcasts: Broadcast[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        broadcasts.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          priority: data.priority,
          recipientCount: data.recipientCount,
          sentAt: data.sentAt?.toDate() || new Date(),
          status: data.status,
          createdBy: data.createdBy,
          recipients: data.recipients || [],
        });
      });

      return broadcasts;
    } catch (error) {
      throw error;
    }
  },

  // Get announcements
  async getAnnouncements(): Promise<Announcement[]> {
    if (!db) {
      return [];
    }
    try {
      const q = query(
        collection(db, ANNOUNCEMENTS_COLLECTION),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const announcements: Announcement[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        announcements.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          status: data.status,
          scheduledFor: data.scheduledFor?.toDate(),
          publishedAt: data.publishedAt?.toDate(),
          createdBy: data.createdBy,
        });
      });

      return announcements;
    } catch (error) {
      throw error;
    }
  },

  // Update user status
  async updateUserStatus(_userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      const userRef = doc(db, USERS_COLLECTION, _userId);
      await updateDoc(userRef, {
        status,
        lastActivity: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Get channel statistics
  async getChannelStats(): Promise<{
    totalChannels: number;
    activeUsers: number;
    totalMessages: number;
    unreadMessages: number;
  }> {
    if (!db) {
      return {
        totalChannels: 0,
        activeUsers: 0,
        totalMessages: 0,
        unreadMessages: 0,
      };
    }
    try {
      const channelsQuery = query(collection(db, CHANNELS_COLLECTION));
      const channelsSnapshot = await getDocs(channelsQuery);

      const usersQuery = query(collection(db, USERS_COLLECTION));
      const usersSnapshot = await getDocs(usersQuery);

      const messagesQuery = query(collection(db, MESSAGES_COLLECTION));
      const messagesSnapshot = await getDocs(messagesQuery);

      const activeUsers = usersSnapshot.docs.filter(doc => 
        doc.data().status === 'online'
      ).length;

      const unreadMessages = channelsSnapshot.docs.reduce((acc, docSnap) => {
        const data = docSnap.data() as { unreadCount?: Record<string, number> };
        if (!data.unreadCount) return acc;
        return (
          acc +
          Object.values(data.unreadCount).reduce<number>((sum, value) => {
            return sum + (typeof value === 'number' ? value : 0);
          }, 0)
        );
      }, 0);

      return {
        totalChannels: channelsSnapshot.size,
        activeUsers,
        totalMessages: messagesSnapshot.size,
        unreadMessages,
      };
    } catch (error) {
      throw error;
    }
  },

  // Calculate unread messages count for a user
  async getUnreadCount(userId: string): Promise<number> {
    if (!db || !userId) return 0;
    try {
      const q = query(
        collection(db, CHANNELS_COLLECTION),
        where('members', 'array-contains', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.reduce((sum, docSnap) => {
        const data = docSnap.data() as { unreadCount?: Record<string, number> };
        const unread = data.unreadCount?.[userId] ?? 0;
        return sum + (typeof unread === 'number' ? unread : 0);
      }, 0);
    } catch (error) {
      return 0;
    }
  },

  // Realtime: Subscribe to channels
  subscribeToChannels(callback: (channels: Channel[]) => void): () => void {
    if (!db) {
      try { callback([]); } catch { /* ignore */ }
      return () => {};
    }

    const q = query(
      collection(db, CHANNELS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const channels: Channel[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        channels.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          type: data.type,
          memberCount: data.memberCount || 0,
          messageCount: data.messageCount || 0,
          lastMessage: data.lastMessage ?? null,
          lastMessageAt: data.lastMessageAt?.toDate?.() || null,
          lastMessageSenderId: data.lastMessageSenderId ?? null,
          hasAttachments: data.hasAttachments ?? false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy,
          members: data.members || [],
          unreadCount: data.unreadCount || {},
        });
      });
      callback(channels);
    }, (error) => {
      logger.error('Error subscribing to channels', error instanceof Error ? error : new Error(String(error)));
      callback([]);
    });
  },

  // Realtime: Subscribe to messages for a specific channel
  subscribeToChannelMessages(
    channelId: string,
    callback: (messages: Message[]) => void,
    limitCount: number = 50
  ): () => void {
    if (!db || !channelId) {
      try { callback([]); } catch { /* ignore */ }
      return () => {};
    }

    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('channelId', '==', channelId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          channelId: data.channelId,
          userId: data.userId,
          content: data.content,
          type: data.type || 'text',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          edited: data.edited || false,
          replyTo: data.replyTo,
          metadata: data.metadata,
          readBy: data.readBy || [],
        });
      });
      callback(messages);
    }, (error) => {
      logger.error('Error subscribing to messages', error instanceof Error ? error : new Error(String(error)));
      callback([]);
    });
  },

  // Realtime: Subscribe to broadcasts
  subscribeToBroadcasts(callback: (broadcasts: Broadcast[]) => void): () => void {
    if (!db) {
      try { callback([]); } catch { /* ignore */ }
      return () => {};
    }

    const q = query(
      collection(db, BROADCASTS_COLLECTION),
      orderBy('sentAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const broadcasts: Broadcast[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        broadcasts.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          priority: data.priority,
          recipientCount: data.recipientCount,
          sentAt: data.sentAt?.toDate() || new Date(),
          status: data.status,
          createdBy: data.createdBy,
          recipients: data.recipients || [],
        });
      });
      callback(broadcasts);
    }, (error) => {
      logger.error('Error subscribing to broadcasts', error instanceof Error ? error : new Error(String(error)));
      callback([]);
    });
  },

  // Realtime: Subscribe to announcements
  subscribeToAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
    if (!db) {
      try { callback([]); } catch { /* ignore */ }
      return () => {};
    }

    const q = query(
      collection(db, ANNOUNCEMENTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const announcements: Announcement[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        announcements.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          status: data.status,
          scheduledFor: data.scheduledFor?.toDate(),
          publishedAt: data.publishedAt?.toDate(),
          createdBy: data.createdBy,
        });
      });
      callback(announcements);
    }, (error) => {
      logger.error('Error subscribing to announcements', error instanceof Error ? error : new Error(String(error)));
      callback([]);
    });
  },

  // Mark message as read
  async markMessageAsRead(channelId: string, messageId: string, userId: string): Promise<void> {
    await adminChatService.markMessagesAsRead(channelId, [messageId], userId);
  },

  // Mark multiple messages as read
  async markMessagesAsRead(channelId: string, messageIds: string[], userId: string): Promise<void> {
    if (!db || !channelId || !Array.isArray(messageIds) || messageIds.length === 0 || !userId) return;
    try {
      let newlyRead = 0;

      for (const messageId of messageIds) {
        const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
        const messageDoc = await getDoc(messageRef);
        if (!messageDoc.exists()) continue;

        const data = messageDoc.data() as { readBy?: string[] };
        const readBy = Array.isArray(data.readBy) ? data.readBy : [];
        if (!readBy.includes(userId)) {
          await updateDoc(messageRef, {
            readBy: [...readBy, userId],
          });
          newlyRead += 1;
        }
      }

      if (newlyRead > 0) {
        const channelRef = doc(db, CHANNELS_COLLECTION, channelId);
        await runTransaction(db, async transaction => {
          const channelSnap = await transaction.get(channelRef);
          if (!channelSnap.exists()) return;

          const data = channelSnap.data() as { unreadCount?: Record<string, number> };
          const unreadCount = { ...(data.unreadCount || {}) };
          const current = unreadCount[userId] || 0;
          unreadCount[userId] = Math.max(current - newlyRead, 0);

          transaction.update(channelRef, { unreadCount });
        });
      }
    } catch (error) {
      logger.error('Error marking messages as read', error instanceof Error ? error : new Error(String(error)));
    }
  },
};
