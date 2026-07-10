import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shiftService } from '../shifts';

// Mock Firebase – db muss truthy sein (Service-Guard `if (!db ...)`)
vi.mock('@/lib/firebase', () => ({
  db: {},
  getDb: vi.fn(() => ({})),
  auth: { currentUser: { uid: 'user123' } },
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
}));

vi.mock('@/lib/utils/companyId', () => ({
  getCompanyIdFromAuth: vi.fn(() => Promise.resolve('company123')),
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
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
}));

describe('shiftService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getCompanyIdFromAuth } = await import('@/lib/utils/companyId');
    vi.mocked(getCompanyIdFromAuth).mockResolvedValue('company123');
    // getDoc-Standard: Facility-/Shift-Dokument mit companyId & Kapazität
    const { getDoc } = await import('firebase/firestore');
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ companyId: 'company123', capacity: 5, assignedCount: 0 }),
    } as any);
  });

  describe('create', () => {
    it('legt eine Schicht an und liefert die neue ID', async () => {
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue({ id: 'shift123' } as any);

      const result = await shiftService.create({
        facilityId: 'facility123',
        startTime: '08:00',
        endTime: '16:00',
        date: '2024-01-15',
        requiredQualifications: ['nurse'],
        description: 'Test shift',
      } as any);

      expect(result).toBe('shift123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          facilityId: 'facility123',
          companyId: 'company123',
        })
      );
    });
  });

  describe('assignUser', () => {
    it('weist eine Schicht zu (erzeugt Assignment, aktualisiert Kapazität)', async () => {
      const { addDoc, updateDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue({ id: 'assignment123' } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await shiftService.assignUser('shift123', 'user123');

      expect(result).toBe('assignment123');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ assignedCount: 1 })
      );
    });
  });

  describe('getOpenShifts', () => {
    it('lädt offene Schichten', async () => {
      const mockShifts = [
        { id: '1', data: () => ({ status: 'open', facilityId: 'facility123', companyId: 'company123' }) },
        { id: '2', data: () => ({ status: 'open', facilityId: 'facility456', companyId: 'company123' }) },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({ docs: mockShifts } as any);

      const result = await shiftService.getOpenShifts();

      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual(['1', '2']);
    });
  });
});
