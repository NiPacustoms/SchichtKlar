import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentService } from '../documents';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';

// documentService.getAll läuft nur clientseitig (typeof window Check)
vi.stubGlobal('window', {});

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
  getDb: vi.fn(() => ({})),
}));

vi.mock('@/lib/utils/companyId', () => ({
  getCompanyIdFromAuth: vi.fn(() => Promise.resolve('company123')),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ type: 'collection-ref' })),
  doc: vi.fn(() => ({ type: 'doc-ref' })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({
      seconds: 1705320000,
      nanoseconds: 0,
      toDate: () => new Date('2024-01-15T12:00:00Z'),
    })),
    fromDate: vi.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: () => date,
    })),
  },
}));

describe('documentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCompanyIdFromAuth).mockResolvedValue('company123');
  });

  describe('create', () => {
    it('should create a document with companyId, computed status and metadata', async () => {
      const { addDoc, getDoc } = await import('firebase/firestore');

      // User-Dokument liefert die companyId
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ companyId: 'company123' }),
      } as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'doc123' } as any);

      const expiryFarInFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const upload = {
        userId: 'user123',
        type: 'certificate' as const,
        name: 'Test Certificate',
        url: 'https://example.com/file.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        expiryDate: expiryFarInFuture,
      };

      const result = await documentService.create(upload);

      expect(result.id).toBe('doc123');
      expect(result.verified).toBe(false);
      expect(result.status).toBe('valid');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user123',
          companyId: 'company123',
          type: 'certificate',
          name: 'Test Certificate',
          url: 'https://example.com/file.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          verified: false,
          status: 'valid',
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
        documentService.create({
          userId: 'user123',
          type: 'certificate',
          name: 'Test',
          url: 'https://example.com/file.pdf',
          fileSize: 1,
          mimeType: 'application/pdf',
        })
      ).rejects.toThrow(/No companyId found/);
    });
  });

  describe('verify', () => {
    it('should verify a document without rejection reason', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await documentService.verify('doc123', 'admin123');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          verified: true,
          verifiedBy: 'admin123',
          verifiedAt: expect.anything(),
          rejectionReason: null,
          updatedAt: expect.anything(),
        })
      );
    });

    it('should reject a document when a rejection reason is given', async () => {
      const { updateDoc } = await import('firebase/firestore');
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await documentService.verify('doc123', 'admin123', 'Invalid format');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          verified: false,
          verifiedBy: 'admin123',
          rejectionReason: 'Invalid format',
          updatedAt: expect.anything(),
        })
      );
    });
  });

  describe('getByUserId', () => {
    it('should fetch documents for a user sorted by createdAt (newest first)', async () => {
      const { getDocs, where } = await import('firebase/firestore');

      const older = new Date('2024-01-01T00:00:00Z');
      const newer = new Date('2024-02-01T00:00:00Z');
      const mockDocs = [
        {
          id: 'old',
          data: () => ({
            userId: 'user123',
            type: 'certificate',
            verified: true,
            createdAt: { toDate: () => older },
            updatedAt: { toDate: () => older },
          }),
        },
        {
          id: 'new',
          data: () => ({
            userId: 'user123',
            type: 'license',
            verified: false,
            createdAt: { toDate: () => newer },
            updatedAt: { toDate: () => newer },
          }),
        },
      ];

      vi.mocked(getDocs).mockResolvedValue({ docs: mockDocs } as any);

      const result = await documentService.getByUserId('user123');

      expect(result).toHaveLength(2);
      // Neueste zuerst (clientseitige Sortierung)
      expect(result[0]?.id).toBe('new');
      expect(result[1]?.id).toBe('old');
      expect(result[0]?.createdAt).toEqual(newer);
      expect(where).toHaveBeenCalledWith('companyId', '==', 'company123');
      expect(where).toHaveBeenCalledWith('userId', '==', 'user123');
    });

    it('should return empty array if no companyId found', async () => {
      vi.mocked(getCompanyIdFromAuth).mockResolvedValue(null);

      const result = await documentService.getByUserId('user123');

      expect(result).toEqual([]);
    });
  });

  describe('calculateStatus', () => {
    it('should classify documents by expiry date', () => {
      const now = new Date();
      const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const inNinetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(documentService.calculateStatus(undefined)).toBe('valid');
      expect(documentService.calculateStatus(inNinetyDays)).toBe('valid');
      expect(documentService.calculateStatus(inFiveDays)).toBe('expiring');
      expect(documentService.calculateStatus(yesterday)).toBe('expired');
    });
  });
});
