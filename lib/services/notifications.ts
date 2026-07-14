import { db, getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import type { TemplateChannel } from '@/lib/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
} from 'firebase/firestore';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';

const COLLECTION_NAME = 'notifications';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  important: boolean;
  userId: string;
  companyId: string; // Mandantenzugehörigkeit (required)
  createdAt: Date;
  updatedAt: Date;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
  channel?: TemplateChannel;
  templateKey?: string;
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
  channels?: {
    app?: boolean;
    email?: boolean;
    sms?: boolean;
  };
  typeChannels?: {
    [key: string]: {
      app?: boolean;
      email?: boolean;
      sms?: boolean;
    };
  };
  preferredLocale?: string;
}

export const notificationService = {
  // Get all notifications for current user
  async getAll(userId?: string): Promise<Notification[]> {
    if (!db) {
      return [];
    }
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        logger.warn('No companyId found, returning empty array');
        return [];
      }

      const notificationUserId = userId || 'current-user-id'; // Use provided userId or fallback
      
      const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', '==', notificationUserId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const notifications: Notification[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          read: data.read ?? false,
          important: data.important ?? false,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          metadata: data.metadata || undefined,
          channel: data.channel,
          companyId: data.companyId,
          templateKey: data.templateKey,
        });
      });

      return notifications;
    } catch (error) {
      throw error;
    }
  },

  // Get notifications with pagination
  async getPaginated(pageSize: number = 20, lastDoc?: { id: string } | undefined): Promise<{
    notifications: Notification[];
    hasMore: boolean;
    totalCount: number;
  }> {
    if (!db) {
      return {
        notifications: [],
        totalCount: 0,
        hasMore: false,
      };
    }
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        return {
          notifications: [],
          hasMore: false,
          totalCount: 0,
        };
      }

      const userId = 'current-user-id'; // This should come from auth context
      
      let q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const notifications: Notification[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          read: data.read ?? false,
          important: data.important ?? false,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          metadata: data.metadata || undefined,
          channel: data.channel,
          companyId: data.companyId,
          templateKey: data.templateKey,
        });
      });

      // Get total count
      const countQuery = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', '==', userId)
      );
      const countSnapshot = await getCountFromServer(countQuery);
      const totalCount = countSnapshot.data().count;

      return {
        notifications,
        hasMore: notifications.length === pageSize,
        totalCount,
      };
    } catch (error) {
      throw error;
    }
  },

  // Create notification
  async create(data: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      // Hole companyId aus dem User oder Auth
      let companyId = data.companyId;
      if (!companyId && data.userId) {
        const userDoc = await getDoc(doc(getDb(), 'users', data.userId));
        if (userDoc.exists()) {
          companyId = userDoc.data().companyId || '';
        }
      }
      if (!companyId) {
        const authCompanyId = await getCompanyIdFromAuth();
        companyId = authCompanyId || '';
      }
      if (!companyId) {
        throw new Error('No companyId found for notification');
      }

      const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), {
        ...data,
        companyId: companyId,
        read: data.read ?? false,
        important: data.important ?? false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      const notificationRef = doc(getDb(), COLLECTION_NAME, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Mark notification as unread
  async markAsUnread(notificationId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      const notificationRef = doc(getDb(), COLLECTION_NAME, notificationId);
      await updateDoc(notificationRef, {
        read: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId?: string): Promise<void> {
    try {
      const notificationUserId = userId || 'current-user-id'; // Use provided userId or fallback
      // Mandantenisolation: companyId-Filter ist unter den strikten Rules Pflicht.
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) return;

      const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', '==', notificationUserId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch: Promise<void>[] = [];

      snapshot.forEach(doc => {
        batch.push(updateDoc(doc.ref, {
          read: true,
          updatedAt: serverTimestamp(),
        }));
      });

      await Promise.all(batch);
    } catch (error) {
      throw error;
    }
  },

  // Delete notification
  async delete(notificationId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      await deleteDoc(doc(getDb(), COLLECTION_NAME, notificationId));
    } catch (error) {
      throw error;
    }
  },

  // Delete all notifications
  async deleteAll(userId?: string): Promise<void> {
    if (!db) {
      return;
    }
    try {
      const notificationUserId = userId || 'current-user-id'; // Use provided userId or fallback
      // Mandantenisolation: companyId-Filter ist unter den strikten Rules Pflicht.
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) return;

      const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', '==', notificationUserId)
      );

      const snapshot = await getDocs(q);
      const batch: Promise<void>[] = [];

      snapshot.forEach(doc => {
        batch.push(deleteDoc(doc.ref));
      });

      await Promise.all(batch);
    } catch (error) {
      throw error;
    }
  },

  // Update notification settings
  async updateSettings(userId: string | undefined, settings: Partial<NotificationSettings>): Promise<void> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      const settingsUserId = userId || 'current-user-id'; // Use provided userId or fallback
      const settingsRef = doc(getDb(), 'notificationSettings', settingsUserId);
      
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Get notification settings
  async getSettings(userId?: string): Promise<NotificationSettings> {
    if (!db) {
      return {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        reminderEnabled: true,
        alertEnabled: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '06:00',
        },
        types: {},
        channels: {
          app: true,
          email: true,
          sms: false,
        },
        typeChannels: {},
        preferredLocale: 'de',
      };
    }
    try {
      const settingsUserId = userId || 'current-user-id'; // Use provided userId or fallback
      const settingsRef = doc(getDb(), 'notificationSettings', settingsUserId);
      
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        const rawChannels = (data.channels || {}) as Record<string, unknown>;
        const rawTypeChannels = (data.typeChannels || {}) as Record<string, unknown>;
        return {
          emailEnabled: data.emailEnabled !== false,
          pushEnabled: data.pushEnabled !== false,
          smsEnabled: data.smsEnabled || false,
          reminderEnabled: data.reminderEnabled !== false,
          alertEnabled: data.alertEnabled !== false,
          quietHours: data.quietHours || {
            enabled: false,
            start: '22:00',
            end: '06:00',
          },
          types: data.types || {},
          channels: {
            app: rawChannels.app !== false,
            email: rawChannels.email !== false,
            sms: rawChannels.sms === true,
          },
          typeChannels: Object.entries(rawTypeChannels).reduce<Record<string, { app?: boolean; email?: boolean; sms?: boolean }>>((acc, [key, value]) => {
            if (value && typeof value === 'object') {
              const config = value as Record<string, unknown>;
              acc[key] = {
                app: config.app !== false,
                email: config.email !== false,
                sms: config.sms === true,
              };
            }
            return acc;
          }, {}),
          preferredLocale: typeof data.preferredLocale === 'string' ? data.preferredLocale : 'de',
        };
      }

      // Return default settings
      return {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        reminderEnabled: true,
        alertEnabled: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '06:00',
        },
        types: {},
        channels: {
          app: true,
          email: true,
          sms: false,
        },
        typeChannels: {},
        preferredLocale: 'de',
      };
    } catch (error) {
      throw error;
    }
  },

  // Send notification to user
  async sendNotification(userId: string, notification: {
    title: string;
    message: string;
    type: Notification['type'];
    important?: boolean;
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, unknown>;
    channel?: TemplateChannel;
    companyId?: string;
    templateKey?: string;
  }): Promise<string> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      // Hole companyId aus dem User oder Auth
      let companyId = notification.companyId;
      if (!companyId) {
        const userDoc = await getDoc(doc(getDb(), 'users', userId));
        if (userDoc.exists()) {
          companyId = userDoc.data().companyId || '';
        }
      }
      if (!companyId) {
        const authCompanyId = await getCompanyIdFromAuth();
        companyId = authCompanyId || '';
      }
      if (!companyId) {
        throw new Error('No companyId found for notification');
      }

      const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), {
        ...notification,
        userId,
        companyId: companyId,
        read: false,
        important: notification.important ?? false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Send notification to multiple users
  async sendBulkNotification(userIds: string[], notification: {
    title: string;
    message: string;
    type: Notification['type'];
    important?: boolean;
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, unknown>;
    channel?: TemplateChannel;
    companyId?: string;
    templateKey?: string;
  }): Promise<string[]> {
    if (!db) {
      return [];
    }
    try {
      // Hole companyId aus dem ersten User oder Auth
      let companyId = notification.companyId;
      if (!companyId && userIds.length > 0) {
        const userDoc = await getDoc(doc(getDb(), 'users', userIds[0]));
        if (userDoc.exists()) {
          companyId = userDoc.data().companyId || '';
        }
      }
      if (!companyId) {
        const authCompanyId = await getCompanyIdFromAuth();
        companyId = authCompanyId || '';
      }
      if (!companyId) {
        throw new Error('No companyId found for notification');
      }

      const batch: Promise<{ id: string }>[] = [];
      const notificationIds: string[] = [];

      for (const userId of userIds) {
        batch.push(
          addDoc(collection(getDb(), COLLECTION_NAME), {
            ...notification,
            userId,
            companyId: companyId,
            read: false,
            important: notification.important ?? false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).then(ref => ({ id: ref.id }))
        );
      }

      const results = await Promise.all(batch);
      results.forEach(result => notificationIds.push(result.id));

      return notificationIds;
    } catch (error) {
      throw error;
    }
  },

  // Get notification statistics
  async getStats(): Promise<{
    total: number;
    unread: number;
    read: number;
    important: number;
  }> {
    if (!db) {
      return {
        total: 0,
        unread: 0,
        read: 0,
        important: 0,
      };
    }
    try {
      const userId = 'current-user-id'; // This should come from auth context
      
      const totalQuery = query(
        collection(getDb(), COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const totalSnapshot = await getCountFromServer(totalQuery);

      const unreadQuery = query(
        collection(getDb(), COLLECTION_NAME),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const unreadSnapshot = await getCountFromServer(unreadQuery);

      const importantQuery = query(
        collection(getDb(), COLLECTION_NAME),
        where('userId', '==', userId),
        where('important', '==', true)
      );
      const importantSnapshot = await getCountFromServer(importantQuery);

      return {
        total: totalSnapshot.data().count,
        unread: unreadSnapshot.data().count,
        read: totalSnapshot.data().count - unreadSnapshot.data().count,
        important: importantSnapshot.data().count,
      };
    } catch (error) {
      throw error;
    }
  },
};
