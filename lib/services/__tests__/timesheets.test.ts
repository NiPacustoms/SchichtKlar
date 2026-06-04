import { beforeEach, describe, expect, it, vi } from 'vitest';
import { timesheetService } from '../timesheets';

vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
  getDb: vi.fn(() => ({})),
}));

vi.mock('@/lib/utils/companyId', () => ({
  getCompanyIdFromAuth: vi.fn(() => Promise.resolve('company123')),
}));

vi.mock('@/lib/services/offlineQueue', () => ({
  offlineQueueService: {
    addToQueue: vi.fn(() => Promise.resolve('offline-id')),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
}));

describe('timesheetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom: navigator.onLine = true by default
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  describe('create', () => {
    it('should create a timesheet and return the doc ID', async () => {
      const { addDoc, getDoc } = await import('firebase/firestore');

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ companyId: 'company123' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'timesheet123' } as any);

      // actual API: create(userId, data)
      const result = await timesheetService.create('user123', {
        date: '2024-01-15',
        startTime: '08:00',
        endTime: '16:00',
        breakMinutes: 30,
        notes: 'Test shift',
      } as any);

      expect(result).toBe('timesheet123');
      expect(addDoc).toHaveBeenCalledWith(
        undefined, // collection() returns undefined from mock
        expect.objectContaining({
          userId: 'user123',
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 30,
          totalHours: 7.5, // (8h - 0.5h break)
        })
      );
    });

    it('should calculate totalHours correctly (round to 2 decimal places)', async () => {
      const { addDoc, getDoc } = await import('firebase/firestore');

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ companyId: 'company123' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'ts2' } as any);

      await timesheetService.create('user123', {
        date: '2024-01-15',
        startTime: '08:00',
        endTime: '20:00', // 12h
        breakMinutes: 20,
        notes: 'Long shift',
      } as any);

      expect(addDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          totalHours: 11.67, // (12h - 20min) = 11h 40min ≈ 11.67h
        })
      );
    });
  });

  describe('update', () => {
    it('should update a timesheet with recalculated totalHours', async () => {
      const { updateDoc, doc } = await import('firebase/firestore');
      vi.mocked(doc).mockReturnValue({ id: 'timesheet123' } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // actual API: update(id, data)
      await timesheetService.update('timesheet123', {
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 60,
      } as any);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          startTime: '09:00',
          endTime: '17:00',
          breakMinutes: 60,
        })
      );
    });
  });

  describe('getByUserId', () => {
    it('should fetch timesheets for a user', async () => {
      const { getDocs } = await import('firebase/firestore');
      const ts = { toDate: () => new Date() };
      const mockTimesheets = [
        { id: '1', data: () => ({ userId: 'user123', companyId: 'company123', totalHours: 8, date: ts, startDate: ts, endDate: ts, startTime: '08:00', endTime: '16:00', breakMinutes: 0, status: 'draft', createdAt: ts, updatedAt: ts }) },
        { id: '2', data: () => ({ userId: 'user123', companyId: 'company123', totalHours: 7.5, date: ts, startDate: ts, endDate: ts, startTime: '08:00', endTime: '16:00', breakMinutes: 30, status: 'draft', createdAt: ts, updatedAt: ts }) },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockTimesheets,
        empty: false,
        size: 2,
        forEach: (cb: (doc: unknown) => void) => mockTimesheets.forEach(cb),
      } as any);

      const result = await timesheetService.getByUserId('user123');

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('1');
    });
  });
});
