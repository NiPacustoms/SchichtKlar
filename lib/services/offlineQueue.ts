/**
 * Offline Queue Service für Zeiterfassung
 * Speichert Zeiterfassungs-Daten lokal, wenn offline, und synchronisiert bei Online-Wiederkehr
 */

import { db, getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logger } from '@/lib/logging';
import { createAppError, ErrorCode } from '@/lib/errors';

const QUEUE_STORAGE_KEY = 'jobflow_offline_queue';
const SYNC_IN_PROGRESS_KEY = 'jobflow_sync_in_progress';

export interface OfflineQueueItem {
  id: string;
  type: 'timesheet' | 'sick' | 'break' | 'assignment' | 'timeEntry' | 'signature';
  action: 'create' | 'update' | 'delete'; // CRUD operation type
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

class OfflineQueueService {
  private queue: OfflineQueueItem[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue();
      this.setupOnlineListener();
    }
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Error loading offline queue', error instanceof Error ? error : new Error(String(error)));
      this.queue = [];
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Error saving offline queue', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private setupOnlineListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncQueue();
      });
    }
  }

  /**
   * Fügt ein Item zur Offline-Queue hinzu
   */
  async addToQueue(
    type: OfflineQueueItem['type'],
    action: OfflineQueueItem['action'],
    data: Record<string, unknown>
  ): Promise<string> {
    const item: OfflineQueueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(item);
    this.saveQueue();

    // Versuche sofort zu synchronisieren, wenn online
    if (navigator.onLine) {
      await this.syncQueue();
    }

    return item.id;
  }

  /**
   * Synchronisiert die Queue mit Firestore
   */
  async syncQueue(): Promise<void> {
    if (!navigator.onLine || !db) {
      return;
    }

    // Verhindere parallele Syncs
    if (localStorage.getItem(SYNC_IN_PROGRESS_KEY) === 'true') {
      return;
    }

    localStorage.setItem(SYNC_IN_PROGRESS_KEY, 'true');

    try {
      const itemsToSync = [...this.queue];
      const syncedItems: string[] = [];
      const failedItems: OfflineQueueItem[] = [];

      for (const item of itemsToSync) {
        try {
          // Versuche Item zu synchronisieren
          await this.syncItem(item);
          syncedItems.push(item.id);
        } catch (error) {
          logger.error(`Error syncing item ${item.id}`, error instanceof Error ? error : new Error(String(error)));
          item.retries += 1;
          
          // Nach 3 Versuchen aus Queue entfernen
          if (item.retries < 3) {
            failedItems.push(item);
          }
        }
      }

      // Entferne synchronisierte Items
      this.queue = failedItems;
      this.saveQueue();

      if (syncedItems.length > 0) {
        logger.info(`Successfully synced ${syncedItems.length} items`);
      }
    } catch (error) {
      logger.error('Error syncing queue', error instanceof Error ? error : new Error(String(error)));
    } finally {
      localStorage.removeItem(SYNC_IN_PROGRESS_KEY);
    }
  }

  private async syncItem(item: OfflineQueueItem): Promise<void> {
    if (!db) {
      throw createAppError(
        new Error('Firestore not initialized'),
        ErrorCode.SERVICE_UNAVAILABLE,
        { component: 'offlineQueueService', action: 'syncItem' }
      );
    }

    // Import Firestore functions based on action type
    const { doc, updateDoc, deleteDoc } = await import('firebase/firestore');

    switch (item.type) {
      case 'timesheet':
        if (item.action === 'create') {
          await addDoc(collection(getDb(), 'timesheets'), {
            ...item.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            syncedFromOffline: true,
          });
        } else if (item.action === 'update' && item.data.id) {
          await updateDoc(doc(getDb(), 'timesheets', item.data.id as string), {
            ...item.data,
            updatedAt: serverTimestamp(),
            syncedFromOffline: true,
          });
        } else if (item.action === 'delete' && item.data.id) {
          await deleteDoc(doc(getDb(), 'timesheets', item.data.id as string));
        }
        break;
      case 'sick':
      case 'break':
        if (item.action === 'create') {
          await addDoc(collection(getDb(), 'times'), {
            ...item.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            syncedFromOffline: true,
          });
        } else if (item.action === 'update' && item.data.id) {
          await updateDoc(doc(getDb(), 'times', item.data.id as string), {
            ...item.data,
            updatedAt: serverTimestamp(),
            syncedFromOffline: true,
          });
        } else if (item.action === 'delete' && item.data.id) {
          await deleteDoc(doc(getDb(), 'times', item.data.id as string));
        }
        break;
      case 'assignment':
        if (item.action === 'create') {
          await addDoc(collection(getDb(), 'assignments'), {
            ...item.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            syncedFromOffline: true,
          });
        } else if (item.action === 'update' && item.data.id) {
          await updateDoc(doc(getDb(), 'assignments', item.data.id as string), {
            ...item.data,
            updatedAt: serverTimestamp(),
            syncedFromOffline: true,
          });
        } else if (item.action === 'delete' && item.data.id) {
          await deleteDoc(doc(getDb(), 'assignments', item.data.id as string));
        }
        break;
      default:
        throw createAppError(
          new Error(`Unknown queue item type: ${item.type}`),
          ErrorCode.VALIDATION_INVALID_FORMAT,
          { component: 'offlineQueueService', action: 'syncItem' }
        );
    }
  }

  /**
   * Gibt die aktuelle Queue zurück
   */
  getQueue(): OfflineQueueItem[] {
    return [...this.queue];
  }

  /**
   * Löscht die Queue
   */
  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }
}

export const offlineQueueService = new OfflineQueueService();

