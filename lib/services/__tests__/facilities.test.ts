import { beforeEach, describe, expect, it, vi } from 'vitest';
import { facilityService } from '../facilities';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';
import { writeAuditLog } from '@/lib/services/auditLogService';

// getAll/getById laufen nur clientseitig (typeof window Check)
vi.stubGlobal('window', {});

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

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ type: 'collection-ref' })),
  doc: vi.fn(() => ({ type: 'doc-ref' })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(() => ({ type: 'query' })),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
}));

const facilityDocData = {
  name: 'Krankenhaus A',
  companyId: 'company123',
  address: 'Teststraße 1',
  contactPerson: 'Max Mustermann',
  phone: '0123456789',
  email: 'info@krankenhaus-a.de',
  stations: [],
  colorCode: '#4CAF50',
  debtorNumber: 'DEBT001',
  createdAt: { toDate: () => new Date('2024-01-01') },
  updatedAt: { toDate: () => new Date('2024-01-01') },
};

describe('facilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Standardwert wiederherstellen (clearAllMocks setzt Implementierungen nicht zurück)
    vi.mocked(getCompanyIdFromAuth).mockResolvedValue('company123');
  });

  describe('getAll', () => {
    it('should fetch all facilities for a company', async () => {
      const { getDocs, query, where } = await import('firebase/firestore');
      const mockDocs = [
        {
          id: 'facility1',
          data: () => facilityDocData,
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
        empty: false,
        size: 1,
        forEach: (callback: (doc: unknown) => void) => {
          mockDocs.forEach(callback);
        },
      } as any);

      const result = await facilityService.getAll('company123');

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Krankenhaus A');
      expect(result[0]?.companyId).toBe('company123');
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('companyId', '==', 'company123');
    });

    it('should return empty array if no companyId can be resolved', async () => {
      vi.mocked(getCompanyIdFromAuth).mockResolvedValue(null);

      // Der interne AppError wird gefangen und geloggt, nach außen kommt []
      const result = await facilityService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch a facility by ID', async () => {
      const { getDoc, doc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'facility1',
        data: () => facilityDocData,
      } as any);

      const result = await facilityService.getById('facility1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Krankenhaus A');
      expect(result?.debtorNumber).toBe('DEBT001');
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
    it('should create a new facility and return its ID', async () => {
      const { addDoc } = await import('firebase/firestore');
      const mockFacilityData = {
        name: 'Krankenhaus B',
        address: 'Teststraße 2',
        contactPerson: 'Jane Doe',
        phone: '0987654321',
        email: 'info@krankenhaus-b.de',
        stations: [],
        colorCode: '#FF5722',
        debtorNumber: 'DEBT002',
      };

      vi.mocked(addDoc).mockResolvedValue({ id: 'facility2' } as any);

      const result = await facilityService.create(mockFacilityData);

      expect(result).toBe('facility2');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Krankenhaus B',
          companyId: 'company123', // aus getCompanyIdFromAuth aufgelöst
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        })
      );
      expect(writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'facility.create',
          companyId: 'company123',
          target: expect.objectContaining({ id: 'facility2' }),
        })
      );
    });

    it('should throw error if companyId is missing', async () => {
      vi.mocked(getCompanyIdFromAuth).mockResolvedValue(null);

      await expect(
        facilityService.create({
          name: 'Test',
          address: 'Test',
          contactPerson: 'Test',
          phone: '123',
          email: 'test@example.com',
          stations: [],
          colorCode: '#000',
          debtorNumber: 'TEST',
        })
      ).rejects.toThrow(/companyId ist erforderlich/);
    });
  });

  describe('update', () => {
    it('should update an existing facility with updatedAt timestamp', async () => {
      const { updateDoc, getDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'facility1',
        data: () => facilityDocData,
      } as any);

      await facilityService.update('facility1', {
        name: 'Updated Name',
        phone: '1111111111',
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Updated Name',
          phone: '1111111111',
          updatedAt: expect.anything(),
        })
      );
      expect(writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'facility.update',
          companyId: 'company123',
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete a facility and write an audit log with its companyId', async () => {
      const { deleteDoc, getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'facility1',
        data: () => facilityDocData,
      } as any);

      await facilityService.delete('facility1');

      expect(deleteDoc).toHaveBeenCalled();
      expect(writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'facility.delete',
          companyId: 'company123',
        })
      );
    });

    it('should still resolve (no-op delete) if facility does not exist', async () => {
      // Aktuelles Verhalten: delete wirft NICHT bei fehlendem Dokument,
      // sondern führt deleteDoc trotzdem aus (Firestore-Delete ist idempotent).
      const { deleteDoc, getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(facilityService.delete('nonexistent')).resolves.toBeUndefined();

      expect(deleteDoc).toHaveBeenCalled();
      // companyId-Fallback über getCompanyIdFromAuth
      expect(writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'facility.delete',
          companyId: 'company123',
        })
      );
    });
  });

  describe('stations', () => {
    it('addStation should append a station to the facility', async () => {
      const { updateDoc, getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ stations: [] }),
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const station = {
        id: 'station1',
        name: 'Intensivstation',
        requiredQualifications: ['nurse'],
        maxStaff: 3,
      };

      await facilityService.addStation('facility1', station);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          stations: [station],
          updatedAt: expect.anything(),
        })
      );
    });

    it('addStation should throw if facility does not exist', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(
        facilityService.addStation('nonexistent', {
          id: 's1',
          name: 'Test',
          requiredQualifications: [],
          maxStaff: 1,
        })
      ).rejects.toThrow('Facility not found');
    });
  });
});
