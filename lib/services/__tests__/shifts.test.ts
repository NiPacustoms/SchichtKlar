import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shiftService } from '../shifts';

vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
  getDb: vi.fn(() => ({})),
}));

vi.mock('@/lib/utils/companyId', () => ({
  getCompanyIdFromAuth: vi.fn(() => Promise.resolve('company123')),
}));

vi.mock('@/lib/services/auditLogService', () => ({
  writeAuditLog: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: { uid: 'admin123' } })),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: 'mock-ref' })),
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

function makeSnapshot(docs: { id: string; data: () => Record<string, unknown> }[]) {
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (cb: (doc: unknown) => void) => docs.forEach(cb),
  };
}

describe('shiftService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a shift and return the new doc ID', async () => {
      const { addDoc, getDoc } = await import('firebase/firestore');

      // create() lookups facility for companyId
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ companyId: 'company123' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'shift123' } as any);

      const result = await shiftService.create({
        facilityId: 'facility123',
        startTime: '08:00',
        endTime: '16:00',
        date: new Date('2024-01-15') as any,
        requiredQualifications: ['nurse'],
        maxCapacity: 5,
        description: 'Test shift',
        status: 'open',
      } as any);

      expect(result).toBe('shift123');
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe('assignUser', () => {
    it('should assign a user to a shift', async () => {
      const { addDoc, updateDoc, getDoc } = await import('firebase/firestore');

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ assignedCount: 0, capacity: 5, companyId: 'company123' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'assignment1' } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await shiftService.assignUser('shift123', 'user123');

      expect(result).toBe('assignment1');
      expect(addDoc).toHaveBeenCalledWith(
        undefined, // collection() returns undefined from mock
        expect.objectContaining({ shiftId: 'shift123', userId: 'user123', status: 'assigned' })
      );
    });
  });

  describe('getOpenShifts', () => {
    it('should fetch open shifts for a company', async () => {
      const { getDocs } = await import('firebase/firestore');
      const ts = { toDate: () => new Date('2024-01-15'), seconds: 0, nanoseconds: 0 };
      const mockShiftDocs = [
        { id: '1', data: () => ({ status: 'open', facilityId: 'f1', date: ts, startTime: '08:00', endTime: '16:00', companyId: 'company123', createdAt: ts, updatedAt: ts }) },
        { id: '2', data: () => ({ status: 'open', facilityId: 'f2', date: ts, startTime: '09:00', endTime: '17:00', companyId: 'company123', createdAt: ts, updatedAt: ts }) },
      ];

      vi.mocked(getDocs).mockResolvedValue(makeSnapshot(mockShiftDocs) as any);

      const result = await shiftService.getOpenShifts();

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('1');
    });
  });
});
