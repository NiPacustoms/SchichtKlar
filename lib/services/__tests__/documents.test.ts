import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentService } from '../documents';

vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
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
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: { now: vi.fn(() => ({ toDate: () => new Date('2024-01-01'), seconds: 0, nanoseconds: 0 })) },
}));

describe('documentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a document and return Document object', async () => {
      const mockDocData = {
        userId: 'user123',
        type: 'certificate' as const,
        name: 'Test Certificate',
        fileUrl: 'https://example.com/file.pdf',
        fileSize: 1024,
        expiryDate: '2025-12-31',
      };

      const { addDoc, getDoc } = await import('firebase/firestore');

      // user doc lookup für companyId
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ companyId: 'company123' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'doc123' } as any);

      const result = await documentService.create(mockDocData);

      expect(result.id).toBe('doc123');
      expect(result.verified).toBe(false);
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('should verify a document (set verified=true)', async () => {
      const { updateDoc, doc } = await import('firebase/firestore');
      vi.mocked(doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // verify(id, verifiedBy) → verified=true, no rejectionReason
      await documentService.verify('doc123', 'admin123');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ verified: true, verifiedBy: 'admin123' })
      );
    });

    it('should reject a document via verify with rejectionReason', async () => {
      const { updateDoc, doc } = await import('firebase/firestore');
      vi.mocked(doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // reject is done via verify(id, verifiedBy, rejectionReason)
      await documentService.verify('doc123', 'admin123', 'Invalid format');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ rejectionReason: 'Invalid format' })
      );
    });
  });

  describe('getByUserId', () => {
    it('should fetch documents for a user', async () => {
      const { getDocs } = await import('firebase/firestore');
      const mockDocs = [
        { id: '1', data: () => ({ userId: 'user123', type: 'certificate', name: 'Cert', fileUrl: 'u', fileSize: 1, verified: false, status: 'valid', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
        { id: '2', data: () => ({ userId: 'user123', type: 'license', name: 'Lic', fileUrl: 'u', fileSize: 1, verified: false, status: 'valid', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() } }) },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
        empty: false,
        size: 2,
        forEach: (cb: (doc: unknown) => void) => mockDocs.forEach(cb),
      } as any);

      const result = await documentService.getByUserId('user123');

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('1');
    });
  });
});
