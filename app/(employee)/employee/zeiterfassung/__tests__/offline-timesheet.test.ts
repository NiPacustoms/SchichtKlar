import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineQueueService } from '@/lib/services/offlineQueue';

describe('Offline Timesheet Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should queue timesheet when user is offline', async () => {
    // Mock navigator.onLine to false
    const mockNavigator = { onLine: false };
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    const timesheetData = {
      date: new Date('2024-05-28'),
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      facilityId: 'facility-123',
      station: 'Station A',
      notes: 'Regular shift',
    };

    const queueId = await offlineQueueService.addToQueue('timesheet', 'create', timesheetData);

    // Verify that the item was queued
    expect(queueId).toBeDefined();

    const queue = offlineQueueService.getQueue();
    const queuedItem = queue.find((item) => item.id === queueId);

    expect(queuedItem).toBeDefined();
    expect(queuedItem?.type).toBe('timesheet');
    expect(queuedItem?.action).toBe('create');
    expect(queuedItem?.data).toEqual(expect.objectContaining({
      facilityId: 'facility-123',
      station: 'Station A',
    }));
  });

  it('should update timesheet in queue when offline', async () => {
    const mockNavigator = { onLine: false };
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    const updateData = {
      id: 'ts-existing',
      date: new Date('2024-05-28'),
      startTime: '08:30',
      endTime: '17:30',
      breakMinutes: 45,
      facilityId: 'facility-123',
      notes: 'Updated notes',
    };

    const queueId = await offlineQueueService.addToQueue('timesheet', 'update', updateData);

    const queue = offlineQueueService.getQueue();
    const queuedItem = queue.find((item) => item.id === queueId);

    expect(queuedItem?.action).toBe('update');
    expect(queuedItem?.data.id).toBe('ts-existing');
  });

  it('should track pending count of offline timesheets', async () => {
    const mockNavigator = { onLine: false };
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    const beforeCount = offlineQueueService.getPendingCount();

    const timesheetData = {
      date: new Date('2024-05-28'),
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      facilityId: 'facility-123',
    };

    await offlineQueueService.addToQueue('timesheet', 'create', timesheetData);

    const afterCount = offlineQueueService.getPendingCount();
    expect(afterCount).toBe(beforeCount + 1);
  });

  it('should provide sync status for UI', () => {
    const status = offlineQueueService.getStatus();

    expect(status).toEqual(
      expect.objectContaining({
        pendingCount: expect.any(Number),
        isSyncing: expect.any(Boolean),
        status: expect.stringMatching(/^(idle|syncing|offline)$/),
      })
    );
  });

  it('should indicate when offline', () => {
    const mockNavigator = { onLine: false };
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    const status = offlineQueueService.getStatus();
    expect(['offline', 'syncing']).toContain(status.status);
  });
});
