import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentService } from '../documents';

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

const ts = { toDate: () => new Date('2024-01-01') };

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
  Timestamp: { now: () => ({ toDate: () => new Date('2024-01-01') }) },
}));

describe('documentService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getCompanyIdFromAuth } = await import('@/lib/utils/companyId');
    vi.mocked(getCompanyIdFromAuth).mockResolvedValue('company123');
    // Standard: getDoc liefert ein User-Dokument mit companyId (für create/getAll)
    const { getDoc } = await import('firebase/firestore');
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ companyId: 'company123' }),
    } as any);
  });

  describe('create', () => {
    it('legt ein Dokument mit Metadaten an und liefert das Document-Objekt', async () => {
      const mockDocument = {
        userId: 'user123',
        type: 'certificate',
        name: 'Test Certificate',
        fileUrl: 'https://example.com/file.pdf',
        fileSize: 1024,
        expiryDate: '2024-12-31',
      };

      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue({ id: 'doc123' } as any);

      const result = await documentService.create(mockDocument as any);

      expect(result.id).toBe('doc123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          type: 'certificate',
          name: 'Test Certificate',
          verified: false,
        })
      );
    });
  });

  describe('verify', () => {
    it('markiert ein Dokument als verifiziert', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await documentService.verify('doc123', 'admin123');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          verified: true,
          verifiedBy: 'admin123',
        })
      );
    });

    it('markiert ein Dokument als abgelehnt, wenn ein rejectionReason übergeben wird', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await documentService.verify('doc123', 'admin123', 'Invalid format');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          verified: false,
          rejectionReason: 'Invalid format',
        })
      );
    });
  });

  describe('getByUserId', () => {
    it('lädt die Dokumente eines Nutzers', async () => {
      const mockDocuments = [
        { id: '1', data: () => ({ userId: 'user123', type: 'certificate', companyId: 'company123', createdAt: ts, updatedAt: ts }) },
        { id: '2', data: () => ({ userId: 'user123', type: 'license', companyId: 'company123', createdAt: ts, updatedAt: ts }) },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({ docs: mockDocuments } as any);

      const result = await documentService.getByUserId('user123');

      expect(result).toHaveLength(2);
      expect(result.map(d => d.id)).toEqual(['1', '2']);
      expect(result[0]?.type).toBe('certificate');
    });
  });
});
