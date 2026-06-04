import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { offlineQueueService, OfflineQueueItem } from '../offlineQueue';
import * as offlineStorage from '../offlineStorage';

vi.mock('../offlineStorage', () => ({
  getAllQueueItems: vi.fn(() => Promise.resolve([])),
  addQueueItem: vi.fn(() => Promise.resolve()),
  removeQueueItem: vi.fn(() => Promise.resolve()),
  updateQueueItem: vi.fn(() => Promise.resolve()),
  clearQueue: vi.fn(() => Promise.resolve()),
}));

describe('OfflineQueueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should add a timesheet to the queue when offline', async () => {
    const mockNavigator = { onLine: false };
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    const data = {
      date: '2024-05-28',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      facilityId: 'fac-123',
      notes: 'Test shift',
    };

    const queueId = await offlineQueueService.addToQueue('timesheet', 'create', data);

    expect(queueId).toBeDefined();
    expect(queueId).toMatch(/^offline_\d+_[a-z0-9]+$/);
    expect(offlineStorage.addQueueItem).toHaveBeenCalled();
  });

  it('should return correct pending count', async () => {
    const data = { date: '2024-05-28', startTime: '09:00', endTime: '17:00' };

    await offlineQueueService.addToQueue('timesheet', 'create', data);

    const count = offlineQueueService.getPendingCount();
    expect(count).toBeGreaterThan(0);
  });

  it('should return status with offline indicator', () => {
    const mockNavigator = { onLine: false };
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    const status = offlineQueueService.getStatus();

    expect(status).toHaveProperty('pendingCount');
    expect(status).toHaveProperty('isSyncing');
    expect(status).toHaveProperty('status');
    expect(['idle', 'syncing', 'offline']).toContain(status.status);
  });

  it('should handle update action for timesheet', async () => {
    const data = {
      id: 'ts-123',
      date: '2024-05-28',
      startTime: '10:00',
      endTime: '18:00',
      breakMinutes: 45,
    };

    const queueId = await offlineQueueService.addToQueue('timesheet', 'update', data);

    expect(queueId).toBeDefined();
    expect(offlineStorage.addQueueItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'timesheet',
        action: 'update',
        data,
      })
    );
  });

  it('should get queue items', async () => {
    const data = { date: '2024-05-28', startTime: '09:00', endTime: '17:00' };

    await offlineQueueService.addToQueue('timesheet', 'create', data);

    const queue = offlineQueueService.getQueue();

    expect(Array.isArray(queue)).toBe(true);
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0]).toHaveProperty('id');
    expect(queue[0]).toHaveProperty('type', 'timesheet');
    expect(queue[0]).toHaveProperty('action', 'create');
    expect(queue[0]).toHaveProperty('timestamp');
    expect(queue[0]).toHaveProperty('retries');
  });

  it('should track retries for failed items', async () => {
    const data = { date: '2024-05-28', startTime: '09:00', endTime: '17:00' };

    const queueId = await offlineQueueService.addToQueue('timesheet', 'create', data);
    const queue = offlineQueueService.getQueue();
    const item = queue.find((i) => i.id === queueId);

    expect(item).toBeDefined();
    expect(item?.retries).toBe(0);
  });
});
