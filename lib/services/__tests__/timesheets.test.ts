import { beforeEach, describe, expect, it, vi } from 'vitest';
import { timesheetService } from '../timesheets';

// Mock Firebase – db muss truthy sein (Service-Guard `if (!db ...)`)
vi.mock('@/lib/firebase', () => ({
  db: {},
  getDb: vi.fn(() => ({})),
  auth: { currentUser: { uid: 'user123' } },
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
}));

describe('timesheetService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // getDoc-Standard: liefert User-/Timesheet-Dokument mit den benötigten Feldern
    const { getDoc } = await import('firebase/firestore');
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        companyId: 'company123',
        startTime: '08:00',
        endTime: '16:00',
        breakMinutes: 30,
        status: 'draft',
      }),
    } as any);
  });

  describe('create', () => {
    it('berechnet totalHours und liefert die neue ID', async () => {
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue({ id: 'timesheet123' } as any);

      const result = await timesheetService.create('user123', {
        userId: 'user123',
        date: '2024-01-15',
        startTime: '08:00',
        endTime: '16:00',
        breakMinutes: 30,
        notes: 'Test shift',
      } as any);

      expect(result).toBe('timesheet123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 30,
          totalHours: 7.5, // 8h - 0.5h Pause
          status: 'draft',
        })
      );
    });

    it('berechnet totalHours für lange Schichten korrekt', async () => {
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue({ id: 'timesheet123' } as any);

      const result = await timesheetService.create('user123', {
        userId: 'user123',
        date: '2024-01-15',
        startTime: '08:00',
        endTime: '20:00', // 12h
        breakMinutes: 20,
        notes: 'Long shift',
      } as any);

      expect(result).toBe('timesheet123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalHours: 11.67, // 12h - 0.33h Pause
        })
      );
    });
  });

  describe('update', () => {
    it('rechnet totalHours bei Zeitänderung neu und schreibt (void)', async () => {
      const { updateDoc } = await import('firebase/firestore');
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
          totalHours: 7, // 8h - 1h Pause
        })
      );
    });
  });

  describe('getByUserId', () => {
    it('lädt die Timesheets eines Nutzers', async () => {
      const mockTimesheets = [
        { id: '1', data: () => ({ userId: 'user123', totalHours: 8 }) },
        { id: '2', data: () => ({ userId: 'user123', totalHours: 7.5 }) },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockTimesheets,
        forEach: (cb: (d: unknown) => void) => mockTimesheets.forEach(cb),
      } as any);

      const result = await timesheetService.getByUserId('user123');

      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toEqual(['1', '2']);
    });
  });
});
