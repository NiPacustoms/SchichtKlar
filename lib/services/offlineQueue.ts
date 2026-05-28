/**
 * Offline Queue Service für Zeiterfassung
 * Persistiert in IndexedDB, synchronisiert bei Online-Wiederkehr.
 * Sync-Status für UI: getPendingCount(), isSyncing(), notifySyncStatus().
 */

import { db, getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logger } from '@/lib/logging';
import { createAppError, ErrorCode } from '@/lib/errors';
import * as offlineStorage from './offlineStorage';
import { retryWithBackoff, isRetryableError } from '@/lib/utils/retry';

export const OFFLINE_SYNC_STATUS_EVENT = 'jobflow-offline-sync-status';
export const OFFLINE_CONFLICT_EVENT = 'jobflow-offline-conflict';
const SYNC_STATUS_EVENT = OFFLINE_SYNC_STATUS_EVENT;

export type ConflictType = 'not_found' | 'validation' | 'duplicate' | 'stale' | 'unknown';

export interface OfflineConflict {
  itemId: string;
  type: ConflictType;
  message: string;
  errorCode?: string;
  timestamp: number;
}

export interface OfflineQueueItem {
  id: string;
  type: 'timesheet' | 'sick' | 'break' | 'assignment' | 'timeEntry' | 'signature';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
  conflict?: OfflineConflict;
}

export type OfflineSyncStatus = 'idle' | 'syncing' | 'offline';

class OfflineQueueService {
  private queue: OfflineQueueItem[] = [];
  private syncing = false;
  private conflicts: OfflineConflict[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue();
      this.setupOnlineListener();
    }
  }

  private notifyStatus(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: this.getStatus() }));
    }
  }

  private notifyConflict(conflict: OfflineConflict): void {
    if (typeof window !== 'undefined') {
      this.conflicts.push(conflict);
      window.dispatchEvent(new CustomEvent(OFFLINE_CONFLICT_EVENT, { detail: conflict }));
    }
  }

  private detectConflictType(error: unknown): ConflictType {
    const errorStr = String(error).toLowerCase();
    const errorCode = (error as any)?.code?.toLowerCase() || '';

    if (errorStr.includes('not found') || errorCode.includes('not-found')) return 'not_found';
    if (errorStr.includes('validation') || errorCode.includes('validation')) return 'validation';
    if (errorStr.includes('duplicate') || errorCode.includes('already-exists')) return 'duplicate';
    if (errorStr.includes('stale') || errorCode.includes('conflict')) return 'stale';

    return 'unknown';
  }

  private async loadQueue(): Promise<void> {
    try {
      this.queue = (await offlineStorage.getAllQueueItems()) as OfflineQueueItem[];
      this.notifyStatus();
      if (typeof navigator !== 'undefined' && navigator.onLine && this.queue.length > 0) {
        void this.syncQueue();
      }
    } catch (error) {
      logger.error('Error loading offline queue', error instanceof Error ? error : new Error(String(error)));
      this.queue = [];
    }
  }

  private async persistItem(item: OfflineQueueItem): Promise<void> {
    try {
      await offlineStorage.addQueueItem(item);
    } catch (error) {
      logger.error('Error persisting queue item', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async removePersistedItem(id: string): Promise<void> {
    try {
      await offlineStorage.removeQueueItem(id);
    } catch (error) {
      logger.error('Error removing queue item', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async updatePersistedRetries(id: string, retries: number): Promise<void> {
    try {
      await offlineStorage.updateQueueItem(id, { retries });
    } catch (error) {
      logger.error('Error updating queue item retries', error instanceof Error ? error : new Error(String(error)));
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
   * Fügt ein Item zur Offline-Queue hinzu (persistiert in IndexedDB)
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
    await this.persistItem(item);
    this.notifyStatus();

    if (navigator.onLine) {
      await this.syncQueue();
    }

    return item.id;
  }

  /** Anzahl ausstehender Einträge */
  getPendingCount(): number {
    return this.queue.length;
  }

  /** Ob gerade synchronisiert wird */
  isSyncing(): boolean {
    return this.syncing;
  }

  /** Status für UI (Sync-Status-Indikator) */
  getStatus(): { pendingCount: number; isSyncing: boolean; status: OfflineSyncStatus } {
    const status: OfflineSyncStatus = this.syncing ? 'syncing' : !navigator.onLine ? 'offline' : 'idle';
    return {
      pendingCount: this.queue.length,
      isSyncing: this.syncing,
      status,
    };
  }


  /**
   * Synchronisiert die Queue mit Firestore (liest aus IndexedDB, entfernt synced Items dort)
   */
  async syncQueue(): Promise<void> {
    if (!navigator.onLine || !db) {
      return;
    }
    if (this.syncing) return;

    this.syncing = true;
    this.notifyStatus();

    try {
      await this.loadQueue();
      const itemsToSync = [...this.queue];
      const syncedIds: string[] = [];
      const failedItems: OfflineQueueItem[] = [];

      for (const item of itemsToSync) {
        try {
          // Verwende Retry mit Exponential Backoff für transient errors
          await retryWithBackoff(
            () => this.syncItem(item),
            {
              maxRetries: 3,
              initialDelayMs: 1000,
              maxDelayMs: 16000,
              backoffMultiplier: 2,
              isRetryable: (error) => {
                // Konflikte sollen NICHT retried werden
                const conflictType = this.detectConflictType(error);
                const isConflict = ['not_found', 'validation', 'duplicate', 'stale'].includes(conflictType);
                if (isConflict) return false;
                // Nutze Standard-Retry-Logik für transient errors
                return isRetryableError(error);
              },
              onRetry: (attempt, error, delayMs) => {
                logger.info(`Retrying sync for item ${item.id} (attempt ${attempt}, delay: ${delayMs}ms)`, {
                  error: error.message,
                });
              },
            }
          );
          syncedIds.push(item.id);
          await this.removePersistedItem(item.id);
        } catch (error) {
          const conflictType = this.detectConflictType(error);
          const isConflict = ['not_found', 'validation', 'duplicate', 'stale'].includes(conflictType);

          logger.error(`Error syncing item ${item.id}`, error instanceof Error ? error : new Error(String(error)));

          if (isConflict) {
            // Konflikt erkannt: Speichere Fehler und benachrichtige UI
            const conflict: OfflineConflict = {
              itemId: item.id,
              type: conflictType,
              message: error instanceof Error ? error.message : String(error),
              errorCode: (error as any)?.code,
              timestamp: Date.now(),
            };
            item.conflict = conflict;
            failedItems.push(item);
            await this.updatePersistedRetries(item.id, item.retries);
            this.notifyConflict(conflict);
          } else {
            // Nach Retry-Erschöpfung: Behandle als Konflikt für UI
            const conflict: OfflineConflict = {
              itemId: item.id,
              type: 'unknown',
              message: `Sync fehlgeschlagen nach Retries: ${error instanceof Error ? error.message : String(error)}`,
              timestamp: Date.now(),
            };
            item.conflict = conflict;
            item.retries = 3;
            failedItems.push(item);
            await this.updatePersistedRetries(item.id, item.retries);
            this.notifyConflict(conflict);
          }
        }
      }

      this.queue = failedItems;
      if (syncedIds.length > 0) {
        logger.info(`Successfully synced ${syncedIds.length} items`);
      }
    } catch (error) {
      logger.error('Error syncing queue', error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.syncing = false;
      this.notifyStatus();
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
          const { id: _docId, ...updatePayload } = item.data;
          await updateDoc(doc(getDb(), 'timesheets', _docId as string), {
            ...updatePayload,
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
   * Löscht die Queue (Speicher + IndexedDB)
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    this.conflicts = [];
    try {
      await offlineStorage.clearQueue();
    } catch (error) {
      logger.error('Error clearing offline queue', error instanceof Error ? error : new Error(String(error)));
    }
    this.notifyStatus();
  }

  /**
   * Gibt alle Konflikte zurück
   */
  getConflicts(): OfflineConflict[] {
    return [...this.conflicts];
  }

  /**
   * Gibt Konflikte für ein spezifisches Item zurück
   */
  getConflictForItem(itemId: string): OfflineConflict | undefined {
    return this.conflicts.find((c) => c.itemId === itemId);
  }

  /**
   * Löst einen Konflikt auf durch Löschen des Queue-Items
   */
  async resolveConflict(itemId: string, delete_item: boolean = true): Promise<void> {
    if (delete_item) {
      this.queue = this.queue.filter((item) => item.id !== itemId);
      await this.removePersistedItem(itemId);
    }
    this.conflicts = this.conflicts.filter((c) => c.itemId !== itemId);
    this.notifyStatus();
  }

  /**
   * Versucht ein Konflikt-Item neu zu synchronisieren
   */
  async retryConflictItem(itemId: string): Promise<void> {
    const item = this.queue.find((i) => i.id === itemId);
    if (!item) return;

    // Setze retries zurück für Neuversuch
    item.retries = 0;
    item.conflict = undefined;
    await this.updatePersistedRetries(itemId, 0);

    // Versuche sofort zu synchen wenn online
    if (navigator.onLine) {
      try {
        await this.syncItem(item);
        this.queue = this.queue.filter((i) => i.id !== itemId);
        await this.removePersistedItem(itemId);
        this.conflicts = this.conflicts.filter((c) => c.itemId !== itemId);
      } catch (error) {
        // Error handling wird durch nextSync übernommen
      }
      this.notifyStatus();
    }
  }
}

export const offlineQueueService = new OfflineQueueService();

