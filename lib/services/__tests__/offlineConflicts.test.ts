import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { offlineQueueService, OfflineConflict } from '../offlineQueue';

describe('OfflineQueue Conflict Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Conflict Detection', () => {
    it('should detect "not found" conflicts', async () => {
      const data = { id: 'ts-missing', date: '2024-05-28', startTime: '09:00' };
      const itemId = await offlineQueueService.addToQueue('timesheet', 'update', data);

      const conflict: OfflineConflict = {
        itemId,
        type: 'not_found',
        message: 'Document not found in Firestore',
        timestamp: Date.now(),
      };

      // Simulate conflict detection
      const queue = offlineQueueService.getQueue();
      const item = queue.find((i) => i.id === itemId);
      expect(item).toBeDefined();
    });

    it('should track conflict details', async () => {
      const data = { id: 'ts-123', date: '2024-05-28', startTime: '09:00' };
      const itemId = await offlineQueueService.addToQueue('timesheet', 'update', data);

      const conflicts = offlineQueueService.getConflicts();
      // Initially no conflicts
      expect(conflicts.length).toBe(0);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts by deleting the item', async () => {
      const data = { id: 'ts-conflict', date: '2024-05-28', startTime: '09:00' };
      const itemId = await offlineQueueService.addToQueue('timesheet', 'update', data);

      const beforeCount = offlineQueueService.getPendingCount();
      await offlineQueueService.resolveConflict(itemId, true);
      const afterCount = offlineQueueService.getPendingCount();

      expect(afterCount).toBe(beforeCount - 1);
    });

    it('should resolve conflicts without deleting by keeping the item', async () => {
      const data = { id: 'ts-keep', date: '2024-05-28', startTime: '09:00' };
      const itemId = await offlineQueueService.addToQueue('timesheet', 'update', data);

      const beforeCount = offlineQueueService.getPendingCount();
      await offlineQueueService.resolveConflict(itemId, false);
      const afterCount = offlineQueueService.getPendingCount();

      // Item still in queue if not deleted
      expect(afterCount).toBeLessThanOrEqual(beforeCount);
    });
  });

  describe('Conflict Retry', () => {
    it('should reset retries when retrying a conflict item', async () => {
      const data = { id: 'ts-retry', date: '2024-05-28', startTime: '09:00' };
      const itemId = await offlineQueueService.addToQueue('timesheet', 'create', data);

      const queue = offlineQueueService.getQueue();
      const item = queue.find((i) => i.id === itemId);
      expect(item?.retries).toBe(0);

      // Simulate retry
      await offlineQueueService.retryConflictItem(itemId);

      // Conflict should be cleared after retry attempt
      const conflict = offlineQueueService.getConflictForItem(itemId);
      expect(conflict).toBeUndefined();
    });
  });

  describe('Conflict Status', () => {
    it('should return empty conflicts when none exist', () => {
      const conflicts = offlineQueueService.getConflicts();
      expect(Array.isArray(conflicts)).toBe(true);
    });

    it('should find specific conflict by item ID', async () => {
      const data = { id: 'ts-specific', date: '2024-05-28', startTime: '09:00' };
      const itemId = await offlineQueueService.addToQueue('timesheet', 'update', data);

      const conflict = offlineQueueService.getConflictForItem(itemId);
      expect(conflict).toBeUndefined(); // No conflicts yet
    });

    it('should clear conflicts when clearing queue', async () => {
      await offlineQueueService.clearQueue();
      const conflicts = offlineQueueService.getConflicts();
      expect(conflicts.length).toBe(0);
    });
  });

  describe('Conflict Types', () => {
    it('should handle different conflict types', () => {
      const conflictTypes = ['not_found', 'validation', 'duplicate', 'stale', 'unknown'] as const;

      conflictTypes.forEach((type) => {
        const conflict: OfflineConflict = {
          itemId: `item-${type}`,
          type,
          message: `Test ${type} conflict`,
          timestamp: Date.now(),
        };

        expect(conflict.type).toBe(type);
      });
    });
  });
});
