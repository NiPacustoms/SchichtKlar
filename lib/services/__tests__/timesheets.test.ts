import { beforeEach, describe, expect, it, vi } from 'vitest';
import { timesheetService } from '../timesheets';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

describe('timesheetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a timesheet with calculated totalHours', async () => {
      const mockTimesheet = {
        userId: 'user123',
        date: '2024-01-15',
        startTime: '08:00',
        endTime: '16:00',
        breakMinutes: 30,
        notes: 'Test shift',
      };

      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue({ id: 'timesheet123' } as any);

      const result = await timesheetService.create(mockTimesheet);

      expect(result).toBe('timesheet123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          date: '2024-01-15',
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 30,
          notes: 'Test shift',
          totalHours: 7.5, // 8 hours - 0.5 hours break
          status: 'pending',
        })
      );
    });

    it('should handle break warning for long shifts', async () => {
      const mockTimesheet = {
        userId: 'user123',
        date: '2024-01-15',
        startTime: '08:00',
        endTime: '20:00', // 12 hours
        breakMinutes: 20, // Less than 30 minutes
        notes: 'Long shift',
      };

      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue({ id: 'timesheet123' } as any);

      const result = await timesheetService.create(mockTimesheet);

      expect(result).toBe('timesheet123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalHours: 11.67, // 12 hours - 0.33 hours break
          breakWarning: true,
        })
      );
    });
  });

  describe('update', () => {
    it('should update a timesheet with recalculated totalHours', async () => {
      const mockUpdate = {
        id: 'timesheet123',
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 60,
      };

      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await timesheetService.update(mockUpdate);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          startTime: '09:00',
          endTime: '17:00',
          breakMinutes: 60,
          totalHours: 7, // 8 hours - 1 hour break
          updatedAt: expect.anything(),
        })
      );
    });
  });

  describe('getByUser', () => {
    it('should fetch timesheets for a user', async () => {
      const mockTimesheets = [
        { id: '1', userId: 'user123', totalHours: 8 },
        { id: '2', userId: 'user123', totalHours: 7.5 },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockTimesheets.map(ts => ({ id: ts.id, data: () => ts })),
      } as any);

      const result = await timesheetService.getByUser('user123');

      expect(result).toEqual(mockTimesheets);
    });
  });
});
