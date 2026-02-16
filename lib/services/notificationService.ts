import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'shift' | 'document' | 'system';
  read: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
  data?: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'shift' | 'assignment' | 'document' | 'system';
  actionUrl?: string;
  actionText?: string;
}

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: Notification['type'];
  priority?: Notification['priority'];
  category?: Notification['category'];
  data?: Record<string, unknown>;
  actionUrl?: string;
  actionText?: string;
}

class NotificationService {
  private collection = 'notifications';

  // Erstelle neue Benachrichtigung
  async create(data: CreateNotificationData): Promise<string> {
    try {
      const notificationData = {
        ...data,
        read: false,
        createdAt: serverTimestamp(),
        priority: data.priority || 'medium',
        category: data.category || 'general',
      };

      const docRef = await addDoc(collection(getDb(), this.collection), notificationData);
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to create notification');
    }
  }

  // Alle Benachrichtigungen für einen User abrufen
  async getByUserId(userId: string, limitCount: number = 50): Promise<Notification[]> {
    try {
      const q = query(
        collection(getDb(), this.collection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      throw new Error('Failed to fetch notifications');
    }
  }

  // Ungelesene Benachrichtigungen abrufen
  async getUnreadByUserId(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(getDb(), this.collection),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      throw new Error('Failed to fetch unread notifications');
    }
  }

  // Benachrichtigung als gelesen markieren
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(getDb(), this.collection, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Failed to mark notification as read');
    }
  }

  // Alle Benachrichtigungen als gelesen markieren
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getUnreadByUserId(userId);
      const updatePromises = notifications.map(notification => 
        this.markAsRead(notification.id)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Benachrichtigung löschen
  async delete(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(getDb(), this.collection, notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      throw new Error('Failed to delete notification');
    }
  }

  // Alle Benachrichtigungen für User löschen
  async deleteAllForUser(userId: string): Promise<void> {
    try {
      const notifications = await this.getByUserId(userId);
      const deletePromises = notifications.map(notification => 
        this.delete(notification.id)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      throw new Error('Failed to delete all notifications for user');
    }
  }

  // Echtzeit-Listener für Benachrichtigungen
  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const q = query(
      collection(getDb(), this.collection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      callback(notifications);
    });
  }

  // Ungelesene Count abrufen
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadNotifications = await this.getUnreadByUserId(userId);
      return unreadNotifications.length;
    } catch (error) {
      return 0;
    }
  }

  // Bulk-Benachrichtigungen erstellen (für System-Notifications)
  async createBulk(notifications: CreateNotificationData[]): Promise<string[]> {
    try {
      const batch = notifications.map(data => ({
        ...data,
        read: false,
        createdAt: serverTimestamp(),
        priority: data.priority || 'medium',
        category: data.category || 'general',
      }));

      const docRefs = await Promise.all(
        batch.map(data => addDoc(collection(getDb(), this.collection), data))
      );

      return docRefs.map(ref => ref.id);
    } catch (error) {
      throw new Error('Failed to create bulk notifications');
    }
  }

  // Benachrichtigungen nach Typ filtern
  async getByType(userId: string, type: Notification['type']): Promise<Notification[]> {
    try {
      const q = query(
        collection(getDb(), this.collection),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      throw new Error('Failed to fetch notifications by type');
    }
  }

  // Benachrichtigungen nach Kategorie filtern
  async getByCategory(userId: string, category: Notification['category']): Promise<Notification[]> {
    try {
      const q = query(
        collection(getDb(), this.collection),
        where('userId', '==', userId),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      throw new Error('Failed to fetch notifications by category');
    }
  }
}

export const notificationService = new NotificationService();
