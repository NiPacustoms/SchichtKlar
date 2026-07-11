import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shiftService } from '../shifts';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
  getDb: vi.fn(() => ({})),
  auth: { currentUser: { uid: 'admin1' } },
}));

vi.mock('@/lib/utils/companyId', () => ({
  getCompanyIdFromAuth: vi.fn(() => Promise.resolve('company123')),
}));

vi.mock('@/lib/services/auditLogService', () => ({
  writeAuditLog: vi.fn(() => Promise.resolve()),
}));

// write.ts importiert firebase/auth dynamisch für das Audit-Log
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: { uid: 'admin1' } })),
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
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
}));

describe('shiftService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCompanyIdFromAuth).mockResolvedValue('company123');
  });

  describe('create', () => {
    it('should create a shift and resolve companyId from the facility', async () => {
      const { addDoc, getDoc } = await import('firebase/firestore');

      // Facility-Dokument liefert die companyId
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ companyId: 'company123' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'shift123' } as any);

      const mockShift = {
        title: 'Frühdienst',
        facilityId: 'facility123',
        startTime: '08:00',
        endTime: '16:00',
        date: '2024-01-15',
        requiredQualifications: ['nurse'],
        capacity: 5,
        maxStaff: 5,
        status: 'open' as const,
        description: 'Test shift',
      };

      const result = await shiftService.create(mockShift);

      expect(result).toBe('shift123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Frühdienst',
          facilityId: 'facility123',
          companyId: 'company123',
          startTime: '08:00',
          endTime: '16:00',
          date: '2024-01-15',
          requiredQualifications: ['nurse'],
          capacity: 5,
          maxStaff: 5,
          status: 'open',
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        })
      );
    });

    it('should throw if no companyId can be resolved', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);
      vi.mocked(getCompanyIdFromAuth).mockResolvedValue(null);

      await expect(
        shiftService.create({
          title: 'Frühdienst',
          facilityId: 'facility123',
          startTime: '08:00',
          endTime: '16:00',
          date: '2024-01-15',
          requiredQualifications: [],
          capacity: 1,
          maxStaff: 1,
          status: 'open',
        })
      ).rejects.toThrow();
    });
  });

  describe('assignUser', () => {
    it('should create an assignment and update shift capacity/status', async () => {
      const { addDoc, updateDoc, getDoc } = await import('firebase/firestore');

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ assignedCount: 0, capacity: 1, companyId: 'company123' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'assignment123' } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await shiftService.assignUser('shift123', 'user123');

      expect(result).toBe('assignment123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          shiftId: 'shift123',
          userId: 'user123',
          companyId: 'company123',
          status: 'assigned',
          assignedAt: expect.anything(),
        })
      );
      // Kapazität erreicht -> Schicht wird als 'filled' markiert
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          assignedCount: 1,
          status: 'filled',
          updatedAt: expect.anything(),
        })
      );
    });

    it('should throw if the shift is already at full capacity', async () => {
      const { addDoc, getDoc } = await import('firebase/firestore');

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ assignedCount: 2, capacity: 2, companyId: 'company123' }),
      } as any);

      await expect(shiftService.assignUser('shift123', 'user123')).rejects.toThrow();
      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  describe('getOpenShifts', () => {
    it('should fetch open shifts mapped to the Shift shape', async () => {
      const { getDocs, where } = await import('firebase/firestore');

      const mockDocs = [
        {
          id: 'shift1',
          data: () => ({
            title: 'Frühdienst',
            facilityId: 'facility123',
            status: 'open',
            date: '2030-01-01',
            startTime: '08:00',
            endTime: '16:00',
            requiredQualifications: ['nurse'],
            capacity: 2,
            maxStaff: 2,
          }),
        },
        {
          id: 'shift2',
          data: () => ({
            title: 'Spätdienst',
            facilityId: 'facility456',
            // Legacy-Status 'assigned' wird auf 'filled' normalisiert
            status: 'assigned',
            date: '2030-01-02',
            startTime: '14:00',
            endTime: '22:00',
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({ docs: mockDocs } as any);

      const result = await shiftService.getOpenShifts();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'shift1',
        title: 'Frühdienst',
        facilityId: 'facility123',
        status: 'open',
        date: '2030-01-01',
      });
      expect(result[1]?.status).toBe('filled'); // normalisiert aus 'assigned'
      expect(where).toHaveBeenCalledWith('companyId', '==', 'company123');
      expect(where).toHaveBeenCalledWith('status', '==', 'open');
    });

    it('should return empty array if no companyId found', async () => {
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getCompanyIdFromAuth).mockResolvedValue(null);

      const result = await shiftService.getOpenShifts();

      expect(result).toEqual([]);
      expect(getDocs).not.toHaveBeenCalled();
    });
  });
});
