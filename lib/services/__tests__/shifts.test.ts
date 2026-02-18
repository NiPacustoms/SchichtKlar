import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shiftService } from '../shifts';

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

describe('shiftService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a shift with proper validation', async () => {
      const mockShift = {
        facilityId: 'facility123',
        startTime: '08:00',
        endTime: '16:00',
        date: '2024-01-15',
        requiredQualifications: ['nurse'],
        maxCapacity: 5,
        description: 'Test shift',
      };

      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue({ id: 'shift123' } as any);

      const result = await shiftService.create(mockShift);

      expect(result).toBe('shift123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          facilityId: 'facility123',
          startTime: '08:00',
          endTime: '16:00',
          date: '2024-01-15',
          requiredQualifications: ['nurse'],
          maxCapacity: 5,
          description: 'Test shift',
          status: 'open',
          createdAt: expect.anything(),
        })
      );
    });
  });

  describe('assign', () => {
    it('should assign a shift to a user', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await shiftService.assign('shift123', 'user123');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          assignedUserId: 'user123',
          status: 'assigned',
          assignedAt: expect.anything(),
        })
      );
    });
  });

  describe('getOpenShifts', () => {
    it('should fetch open shifts', async () => {
      const mockShifts = [
        { id: '1', status: 'open', facilityId: 'facility123' },
        { id: '2', status: 'open', facilityId: 'facility456' },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockShifts.map(shift => ({ id: shift.id, data: () => shift })),
      } as any);

      const result = await shiftService.getOpenShifts();

      expect(result).toEqual(mockShifts);
    });
  });
});
