import { db, getDb } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

const COLLECTION_NAME = 'employeeNotifications';
const SETTINGS_COLLECTION = 'employeeNotificationSettings';

const requireUserId = (userId?: string) => {
  if (!userId) {
    throw new Error('userId ist erforderlich, um Benachrichtigungen abzurufen.');
  }
  return userId;
};

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

export const employeeNotificationsService = {
  // Get all notifications for current user
  async getAll(userId?: string, companyId?: string): Promise<Notification[]> {
    if (!db) {
      return [];
    }
    try {
      const notificationUserId = requireUserId(userId);
      
      // Baue Query mit companyId Filter, falls verfügbar
      // companyId wird als Parameter übergeben, um SSR-Probleme zu vermeiden
      let q;
      if (companyId) {
        q = query(
          collection(db, COLLECTION_NAME),
          where('userId', '==', notificationUserId),
          where('companyId', '==', companyId), // WICHTIG: Filter nach companyId
          orderBy('createdAt', 'desc')
        );
      } else {
        // Fallback: Nur nach userId filtern (für Migration)
        q = query(
          collection(db, COLLECTION_NAME),
          where('userId', '==', notificationUserId),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const notifications: Notification[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as {
          userId: string;
          title: string;
          message: string;
          type: Notification['type'];
          priority?: Notification['priority'];
          read?: boolean;
          starred?: boolean;
          archived?: boolean;
          createdAt?: { toDate: () => Date };
          updatedAt?: { toDate: () => Date };
          details?: string;
          actionUrl?: string;
          metadata?: Record<string, unknown>;
        };
        notifications.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 'medium',
          read: data.read || false,
          starred: data.starred || false,
          archived: data.archived || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          details: data.details,
          actionUrl: data.actionUrl,
          metadata: data.metadata,
        });
      });

      return notifications;
    } catch (error) {
      throw error;
    }
  },

  // Get notification settings
  async getSettings(userId?: string): Promise<NotificationSettings> {
    if (!db) {
      return {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        shiftReminders: true,
        sickNotifications: true,
        systemUpdates: true,
        emailFrequency: 'immediate',
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };
    }
    try {
      const settingsUserId = requireUserId(userId);
      
      const q = query(
        collection(db, SETTINGS_COLLECTION),
        where('userId', '==', settingsUserId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Return default settings if none exist
        return {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          shiftReminders: true,
          sickNotifications: true,
          systemUpdates: true,
          emailFrequency: 'immediate',
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
        };
      }

      const data = snapshot.docs[0].data() as Partial<NotificationSettings> & { emailNotifications?: boolean; pushNotifications?: boolean };
      return {
        emailNotifications: data.emailNotifications !== false,
        pushNotifications: data.pushNotifications !== false,
        smsNotifications: data.smsNotifications || false,
        shiftReminders: data.shiftReminders !== false,
        sickNotifications: data.sickNotifications !== false,
        systemUpdates: data.systemUpdates !== false,
        emailFrequency: data.emailFrequency || 'immediate',
        quietHoursStart: data.quietHoursStart || '22:00',
        quietHoursEnd: data.quietHoursEnd || '07:00',
      };
    } catch (error) {
      throw error;
    }
  },

  // Update notification settings
  async updateSettings(userId: string | undefined, data: Partial<NotificationSettings>): Promise<void> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      const settingsUserId = requireUserId(userId);
      
      const q = query(
        collection(db, SETTINGS_COLLECTION),
        where('userId', '==', settingsUserId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Create new settings document
        await addDoc(collection(db, SETTINGS_COLLECTION), {
          userId: settingsUserId,
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update existing settings document
        const docRef = doc(db, SETTINGS_COLLECTION, snapshot.docs[0].id);
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      }
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
    if (!db) {
      return;
    }
    try {
      const notificationUserId = requireUserId(userId);
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', notificationUserId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          read: true,
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      throw error;
    }
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    await deleteDoc(doc(getDb(), COLLECTION_NAME, notificationId));
  },

  // Delete all notifications
  async deleteAllNotifications(userId?: string): Promise<void> {
    if (!db) {
      return;
    }
    const notificationUserId = requireUserId(userId);
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', notificationUserId)
      );

      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
  },

  // Create notification
  async createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      const notificationData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), notificationData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Get unread notifications count
  async getUnreadCount(userId?: string): Promise<number> {
    if (!db) {
      return 0;
    }
    const resolvedUserId = requireUserId(userId);
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', resolvedUserId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
  },

  // Get notifications by type
  async getByType(type: Notification['type'], userId?: string): Promise<Notification[]> {
    if (!db) {
      return [];
    }
    try {
      const resolvedUserId = requireUserId(userId);
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', resolvedUserId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const notifications: Notification[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as {
          userId: string;
          title: string;
          message: string;
          type: Notification['type'];
          priority?: Notification['priority'];
          read?: boolean;
          starred?: boolean;
          archived?: boolean;
          createdAt?: { toDate: () => Date };
          updatedAt?: { toDate: () => Date };
          details?: string;
          actionUrl?: string;
          metadata?: Record<string, unknown>;
        };
        notifications.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 'medium',
          read: data.read || false,
          starred: data.starred || false,
          archived: data.archived || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          details: data.details,
          actionUrl: data.actionUrl,
          metadata: data.metadata,
        });
      });

      return notifications;
    } catch (error) {
      throw error;
    }
  },

  // Get notifications by priority
  async getByPriority(priority: Notification['priority'], userId?: string): Promise<Notification[]> {
    if (!db) {
      return [];
    }
    try {
      const resolvedUserId = requireUserId(userId);
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', resolvedUserId),
        where('priority', '==', priority),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const notifications: Notification[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as {
          userId: string;
          title: string;
          message: string;
          type: Notification['type'];
          priority?: Notification['priority'];
          read?: boolean;
          starred?: boolean;
          archived?: boolean;
          createdAt?: { toDate: () => Date };
          updatedAt?: { toDate: () => Date };
          details?: string;
          actionUrl?: string;
          metadata?: Record<string, unknown>;
        };
        notifications.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 'medium',
          read: data.read || false,
          starred: data.starred || false,
          archived: data.archived || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          details: data.details,
          actionUrl: data.actionUrl,
          metadata: data.metadata,
        });
      });

      return notifications;
    } catch (error) {
      throw error;
    }
  },

  // Star notification
  async starNotification(notificationId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      const notificationRef = doc(getDb(), COLLECTION_NAME, notificationId);
      await updateDoc(notificationRef, {
        starred: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Unstar notification
  async unstarNotification(notificationId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      const notificationRef = doc(getDb(), COLLECTION_NAME, notificationId);
      await updateDoc(notificationRef, {
        starred: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Archive notification
  async archiveNotification(notificationId: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      const notificationRef = doc(getDb(), COLLECTION_NAME, notificationId);
      await updateDoc(notificationRef, {
        archived: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Unarchive notification
  async unarchiveNotification(notificationId: string): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      const notificationRef = doc(getDb(), COLLECTION_NAME, notificationId);
      await updateDoc(notificationRef, {
        archived: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Get notification statistics
  async getStats(userId?: string): Promise<{
    total: number;
    unread: number;
    read: number;
    archived: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    if (!db) {
      return {
        total: 0,
        unread: 0,
        read: 0,
        archived: 0,
        byType: {},
        byPriority: {},
      };
    }
    try {
      const resolvedUserId = requireUserId(userId);
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', resolvedUserId)
      );

      const snapshot = await getDocs(q);
      const notifications: Notification[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as {
          userId: string;
          title: string;
          message: string;
          type: Notification['type'];
          priority?: Notification['priority'];
          read?: boolean;
          starred?: boolean;
          archived?: boolean;
          createdAt?: { toDate: () => Date };
          updatedAt?: { toDate: () => Date };
          details?: string;
          actionUrl?: string;
          metadata?: Record<string, unknown>;
        };
        notifications.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 'medium',
          read: data.read || false,
          starred: data.starred || false,
          archived: data.archived || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          details: data.details,
          actionUrl: data.actionUrl,
          metadata: data.metadata,
        });
      });

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
    } catch (error) {
      throw error;
    }
  },

  // Send notification
  async sendNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority?: string;
    details?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    if (!db) {
      throw new Error('Firestore nicht initialisiert');
    }
    try {
      const notificationData = {
        ...data,
        priority: data.priority || 'medium',
        read: false,
        starred: false,
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), notificationData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Bulk operations
  async bulkMarkAsRead(notificationIds: string[]): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      const updatePromises = notificationIds.map(id => 
        updateDoc(doc(getDb(), COLLECTION_NAME, id), {
          read: true,
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      throw error;
    }
  },

  async bulkDelete(notificationIds: string[]): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const deletePromises = notificationIds.map(id => 
        deleteDoc(doc(getDb(), COLLECTION_NAME, id))
      );

      await Promise.all(deletePromises);
  },

  async bulkArchive(notificationIds: string[]): Promise<void> {
    if (!db) {
      throw new Error('Database not initialized');
    }
    try {
      const updatePromises = notificationIds.map(id => 
        updateDoc(doc(getDb(), COLLECTION_NAME, id), {
          archived: true,
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      throw error;
    }
  },
};
