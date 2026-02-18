import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentService } from '../documents';

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

describe('documentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a document with proper metadata', async () => {
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

      const result = await documentService.create(mockDocument);

      expect(result).toBe('doc123');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          type: 'certificate',
          name: 'Test Certificate',
          fileUrl: 'https://example.com/file.pdf',
          fileSize: 1024,
          expiryDate: '2024-12-31',
          verified: false,
          status: 'pending',
          createdAt: expect.anything(),
        })
      );
    });
  });

  describe('verify', () => {
    it('should verify a document', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await documentService.verify('doc123', 'admin123');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          verified: true,
          verifiedBy: 'admin123',
          verifiedAt: expect.anything(),
          updatedAt: expect.anything(),
        })
      );
    });
  });

  describe('reject', () => {
    it('should reject a document with reason', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await documentService.reject('doc123', 'Invalid format');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          verified: false,
          rejectionReason: 'Invalid format',
          updatedAt: expect.anything(),
        })
      );
    });
  });

  describe('getByUser', () => {
    it('should fetch documents for a user', async () => {
      const mockDocuments = [
        { id: '1', userId: 'user123', type: 'certificate' },
        { id: '2', userId: 'user123', type: 'license' },
      ];

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocuments.map(doc => ({ id: doc.id, data: () => doc })),
      } as any);

      const result = await documentService.getByUser('user123');

      expect(result).toEqual(mockDocuments);
    });
  });
});
