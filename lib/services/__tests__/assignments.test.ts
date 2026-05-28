import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assignmentService } from '../assignments';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
  getDb: vi.fn(() => ({})),
}));

vi.mock('@/lib/utils/companyId', () => ({
  getCompanyIdFromAuth: vi.fn(() => Promise.resolve('company123')),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
}));

describe('assignmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should fetch an assignment by ID', async () => {
      const { getDoc, doc } = await import('firebase/firestore');
      const mockAssignment = {
        exists: () => true,
        id: 'assignment1',
        data: () => ({
          userId: 'user123',
          shiftId: 'shift123',
          companyId: 'company123',
          status: 'accepted',
          assignedAt: { toDate: () => new Date('2024-01-15') },
          acceptedAt: { toDate: () => new Date('2024-01-15') },
          createdAt: { toDate: () => new Date('2024-01-15') },
          updatedAt: { toDate: () => new Date('2024-01-15') },
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockAssignment as any);

      const result = await assignmentService.getById('assignment1');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user123');
      expect(result?.status).toBe('accepted');
      expect(doc).toHaveBeenCalled();
    });

    it('should return null if assignment does not exist', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await assignmentService.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByUserId', () => {
    it('should fetch assignments for a user', async () => {
      const { getDocs, query, collection, where, orderBy, limit } = await import('firebase/firestore');
      const mockAssignments = [
        {
          id: 'assignment1',
          data: () => ({
            userId: 'user123',
            shiftId: 'shift123',
            companyId: 'company123',
            status: 'accepted',
            assignedAt: { toDate: () => new Date('2024-01-15') },
            createdAt: { toDate: () => new Date('2024-01-15') },
            updatedAt: { toDate: () => new Date('2024-01-15') },
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAssignments,
        forEach: (callback: (doc: unknown) => void) => {
          mockAssignments.forEach(callback);
        },
      } as any);

      const result = await assignmentService.getByUserId('user123');

      expect(result).toHaveLength(1);
      expect(result[0]?.userId).toBe('user123');
      expect(query).toHaveBeenCalled();
    });

    it('should return empty array if no companyId found', async () => {
      const { getCompanyIdFromAuth } = await import('@/lib/utils/companyId');
      vi.mocked(getCompanyIdFromAuth).mockResolvedValueOnce(null);

      const result = await assignmentService.getByUserId('user123');

      expect(result).toEqual([]);
    });
  });

  describe('getByShiftId', () => {
    it('should fetch assignments for a shift', async () => {
      const { getDocs } = await import('firebase/firestore');
      const mockAssignments = [
        {
          id: 'assignment1',
          data: () => ({
            userId: 'user123',
            shiftId: 'shift123',
            companyId: 'company123',
            status: 'accepted',
            assignedAt: { toDate: () => new Date('2024-01-15') },
            createdAt: { toDate: () => new Date('2024-01-15') },
            updatedAt: { toDate: () => new Date('2024-01-15') },
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockAssignments,
        forEach: (callback: (doc: unknown) => void) => {
          mockAssignments.forEach(callback);
        },
      } as any);

      const result = await assignmentService.getByShiftId('shift123');

      expect(result).toHaveLength(1);
      expect(result[0]?.shiftId).toBe('shift123');
    });
  });
});
