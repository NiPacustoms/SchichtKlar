import { beforeEach, describe, expect, it, vi } from 'vitest';
import { timesheetService } from '../timesheets';

// In Node existiert global `navigator` ohne `onLine` – Service würde sonst
// in den Offline-Queue-Pfad laufen. Online-Zustand explizit simulieren.
vi.stubGlobal('navigator', { onLine: true });

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
  getDb: vi.fn(() => ({})),
  auth: { currentUser: { uid: 'user123' } },
}));

vi.mock('@/lib/utils/companyId', () => ({
  getCompanyIdFromAuth: vi.fn(() => Promise.resolve('company123')),
}));

vi.mock('../offlineQueue', () => ({
  offlineQueueService: {
    addToQueue: vi.fn(() => Promise.resolve('offline-id')),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ type: 'collection-ref' })),
  doc: vi.fn(() => ({ type: 'doc-ref' })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(() => ({ type: 'query' })),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
}));

describe('timesheetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a timesheet with calculated totalHours and draft status', async () => {
      const { addDoc, getDoc } = await import('firebase/firestore');

      // User-Dokument liefert die companyId
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ companyId: 'company123' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'timesheet123' } as any);

      const result = await timesheetService.create('user123', {
        date: new Date('2024-01-15'),
        startTime: '08:00',
        endTime: '16:00',
        breakMinutes: 30,
        notes: 'Test shift',
      });

      expect(result).toBe('timesheet123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          companyId: 'company123',
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 30,
          notes: 'Test shift',
          totalHours: 7.5, // 8 Stunden - 0,5 Stunden Pause
          status: 'draft',
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        })
      );
    });

    it('should handle overnight shifts and round totalHours to two decimals', async () => {
      const { addDoc, getDoc } = await import('firebase/firestore');

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ companyId: 'company123' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'timesheet123' } as any);

      const result = await timesheetService.create('user123', {
        date: new Date('2024-01-15'),
        startTime: '20:00',
        endTime: '08:00', // Nachtschicht über Mitternacht (12 Stunden)
        breakMinutes: 20,
        notes: 'Long shift',
      });

      expect(result).toBe('timesheet123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalHours: 11.67, // 12 Stunden - 20 Minuten Pause, gerundet
        })
      );
    });
  });

  describe('update', () => {
    it('should update a timesheet with recalculated totalHours', async () => {
      const { updateDoc, getDoc } = await import('firebase/firestore');

      // Bestehendes Timesheet im Status 'draft'
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          status: 'draft',
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 30,
        }),
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await timesheetService.update('timesheet123', {
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 60,
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          startTime: '09:00',
          endTime: '17:00',
          breakMinutes: 60,
          totalHours: 7, // 8 Stunden - 1 Stunde Pause
          updatedAt: expect.anything(),
        })
      );
    });

    it('should refuse to update approved timesheets (GoBD)', async () => {
      const { updateDoc, getDoc } = await import('firebase/firestore');

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          status: 'approved',
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 30,
        }),
      } as any);

      await expect(
        timesheetService.update('timesheet123', { notes: 'nachträglich' })
      ).rejects.toThrow(/Cannot update approved or submitted timesheet/);
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('getByUserId', () => {
    it('should fetch timesheets for a user', async () => {
      const { getDocs, where } = await import('firebase/firestore');
      const mockDocs = [
        {
          id: '1',
          data: () => ({
            userId: 'user123',
            totalHours: 8,
            startTime: '08:00',
            endTime: '16:30',
            breakMinutes: 30,
            status: 'approved',
            date: { toDate: () => new Date('2024-01-15') },
            createdAt: { toDate: () => new Date('2024-01-15') },
            updatedAt: { toDate: () => new Date('2024-01-15') },
          }),
        },
        {
          id: '2',
          data: () => ({
            userId: 'user123',
            totalHours: 7.5,
            startTime: '08:00',
            endTime: '16:00',
            breakMinutes: 30,
            status: 'draft',
            date: { toDate: () => new Date('2024-01-14') },
            createdAt: { toDate: () => new Date('2024-01-14') },
            updatedAt: { toDate: () => new Date('2024-01-14') },
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
        forEach: (callback: (doc: unknown) => void) => {
          mockDocs.forEach(callback);
        },
      } as any);

      const result = await timesheetService.getByUserId('user123');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: '1',
        userId: 'user123',
        totalHours: 8,
        status: 'approved',
      });
      expect(result[0]?.date).toEqual(new Date('2024-01-15'));
      expect(result[1]?.totalHours).toBe(7.5);
      expect(where).toHaveBeenCalledWith('userId', '==', 'user123');
    });
  });
});
