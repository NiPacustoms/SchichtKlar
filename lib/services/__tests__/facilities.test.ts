import { beforeEach, describe, expect, it, vi } from 'vitest';
import { facilityService } from '../facilities';

// Mock Firebase
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
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
}));

// Helper: Firestore QuerySnapshot mit forEach (wie echte Firestore API)
function makeSnapshot(docs: { id: string; data: () => Record<string, unknown> }[]) {
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (cb: (doc: unknown) => void) => docs.forEach(cb),
  };
}

describe('facilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all facilities for a company', async () => {
      const { getDocs, query, collection, where, orderBy } = await import('firebase/firestore');
      const mockFacilities = [
        {
          id: 'facility1',
          data: () => ({
            name: 'Krankenhaus A',
            companyId: 'company123',
            address: 'Teststraße 1',
            contactPerson: 'Max Mustermann',
            phone: '0123456789',
            stations: [],
            colorCode: '#4CAF50',
            debtorNumber: 'DEBT001',
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') },
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue(makeSnapshot(mockFacilities) as any);

      const result = await facilityService.getAll('company123');

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Krankenhaus A');
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('companyId', '==', 'company123');
    });

    it('should return empty array if no companyId provided', async () => {
      const { getCompanyIdFromAuth } = await import('@/lib/utils/companyId');
      vi.mocked(getCompanyIdFromAuth).mockResolvedValueOnce(null);

      const result = await facilityService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch a facility by ID', async () => {
      const { getDoc, doc } = await import('firebase/firestore');
      const mockFacility = {
        exists: () => true,
        id: 'facility1',
        data: () => ({
          name: 'Krankenhaus A',
          companyId: 'company123',
          address: 'Teststraße 1',
          contactPerson: 'Max Mustermann',
          phone: '0123456789',
          stations: [],
          colorCode: '#4CAF50',
          debtorNumber: 'DEBT001',
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockFacility as any);

      const result = await facilityService.getById('facility1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Krankenhaus A');
      expect(doc).toHaveBeenCalled();
    });

    it('should return null if facility does not exist', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await facilityService.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new facility and return the new doc ID', async () => {
      const { addDoc } = await import('firebase/firestore');
      const mockFacilityData = {
        name: 'Krankenhaus B',
        address: 'Teststraße 2',
        contactPerson: 'Jane Doe',
        phone: '0987654321',
        stations: [],
        colorCode: '#FF5722',
        debtorNumber: 'DEBT002',
      };

      vi.mocked(addDoc).mockResolvedValue({ id: 'facility2' } as any);

      // create() returns the new doc ID (string), not the Facility object
      const result = await facilityService.create(mockFacilityData);

      expect(result).toBe('facility2');
      expect(addDoc).toHaveBeenCalledWith(
        undefined, // collection() returns undefined from mock
        expect.objectContaining({ name: 'Krankenhaus B', companyId: 'company123' })
      );
    });

    it('should throw error if companyId is missing', async () => {
      const { getCompanyIdFromAuth } = await import('@/lib/utils/companyId');
      vi.mocked(getCompanyIdFromAuth).mockResolvedValueOnce(null);

      await expect(
        facilityService.create({
          name: 'Test',
          address: 'Test',
          contactPerson: 'Test',
          phone: '123',
          stations: [],
          colorCode: '#000',
          debtorNumber: 'TEST',
        })
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update an existing facility', async () => {
      const { updateDoc, doc, getDoc } = await import('firebase/firestore');
      const updates = { name: 'Updated Name', phone: '1111111111' };

      vi.mocked(doc).mockReturnValue({ id: 'facility1', path: 'facilities/facility1' } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'facility1',
        data: () => ({ name: 'Updated Name', companyId: 'company123' }),
      } as any);

      // update() returns void
      await facilityService.update('facility1', updates);

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a facility', async () => {
      const { deleteDoc, doc, getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'facility1',
        data: () => ({
          name: 'Krankenhaus A',
          companyId: 'company123',
          address: 'Teststraße 1',
          contactPerson: 'Max Mustermann',
          phone: '0123456789',
          stations: [],
          colorCode: '#4CAF50',
          debtorNumber: 'DEBT001',
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        }),
      } as any);

      await facilityService.delete('facility1');

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should proceed even if facility does not exist (no pre-check in delete)', async () => {
      const { getDoc, deleteDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      // delete() doesn't throw on non-existent docs - Firestore deleteDoc is idempotent
      await expect(facilityService.delete('nonexistent')).resolves.toBeUndefined();
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});
