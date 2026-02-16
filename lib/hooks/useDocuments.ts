import { useAuth } from '@/contexts/AuthContext';
import { documentService } from '@/lib/services';
import { DocumentForm } from '@/lib/types';
import type { Document as ServiceDocument, DocumentUpload } from '@/lib/services/documents';
import { firebaseStorageService } from '@/lib/services/firebaseStorage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, isAfter, isBefore } from 'date-fns';

export const useDocuments = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  // Get user's documents
  const {
    data: documents,
    isLoading,
    error,
  } = useQuery<ServiceDocument[]>({
    queryKey: ['documents', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await documentService.getByUserId(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Upload document mutation
  const mapFormTypeToServiceType = (type: DocumentForm['type']): ServiceDocument['type'] => {
    switch (type) {
      case 'Impfung':
        return 'vaccination';
      case 'Qualifikation':
        return 'certificate';
      case 'Gesundheit':
        return 'certificate';
      case 'Sonstiges':
      default:
        return 'other';
    }
  };

  const uploadDocument = useMutation({
    mutationFn: async (data: DocumentForm & { file: File }) => {
      if (!userId) throw new Error('No user ID');

      const upload = await firebaseStorageService.uploadFile(
        data.file,
        `documents/${userId}/${firebaseStorageService.generateFileName(data.file.name, 'doc')}`
      );

      const payload: DocumentUpload = {
        userId,
        type: mapFormTypeToServiceType(data.type),
        name: data.name,
        url: upload.url,
        fileSize: upload.size,
        mimeType: upload.contentType,
        expiryDate: data.expiresAt,
        notes: data.notes,
      };

      return await documentService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Update document mutation
  const updateDocument = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DocumentForm> }) => {
      const updatePayload: Partial<ServiceDocument> = {
        name: data.name,
        expiryDate: data.expiresAt,
        // map type if provided
        ...(data.type ? { type: mapFormTypeToServiceType(data.type) } : {}),
      } as Partial<ServiceDocument>;
      return await documentService.update(id, updatePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      return await documentService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const verifyDocument = useMutation({
    mutationFn: async ({ id, verifiedBy }: { id: string; verifiedBy: string }) => {
      return await documentService.verify(id, verifiedBy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const rejectDocument = useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: string; rejectionReason: string }) => {
      const verifier = userId || 'system';
      return await documentService.verify(id, verifier, rejectionReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Get document status
  const getDocumentStatus = (document: ServiceDocument) => {
    if (!document.expiryDate) return 'valid';

    const today = new Date();
    const expiryDate = new Date(document.expiryDate);
    const warningDate = addDays(expiryDate, -30); // 30 days before expiry

    if (isAfter(today, expiryDate)) return 'expired';
    if (isBefore(today, warningDate)) return 'valid';
    return 'expiring';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'success';
      case 'expiring':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Gültig';
      case 'expiring':
        return 'Läuft bald ab';
      case 'expired':
        return 'Abgelaufen';
      default:
        return 'Unbekannt';
    }
  };

  // Filter documents by status
  const getDocumentsByStatus = (status: string) => {
    return documents?.filter(doc => getDocumentStatus(doc) === status) || [];
  };

  // Get expiring documents (next 30 days)
  const getExpiringDocuments = () => {
    return (
      documents?.filter(doc => {
        const status = getDocumentStatus(doc);
        return status === 'expiring' || status === 'expired';
      }) || []
    );
  };

  // Get document type color
  const getDocumentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'impfpass':
        return '#4CAF50';
      case 'arbeitszeugnis':
        return '#2196F3';
      case 'qualifikation':
        return '#FF9800';
      case 'zertifikat':
        return '#9C27B0';
      case 'sonstiges':
        return '#607D8B';
      default:
        return '#666';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    documents: documents || [],
    isLoading,
    error,
    uploadDocument,
    updateDocument,
    deleteDocument,
    verifyDocument,
    rejectDocument,
    getDocumentStatus,
    getStatusColor,
    getStatusLabel,
    getDocumentsByStatus,
    getExpiringDocuments,
    getDocumentTypeColor,
    formatFileSize,
  };
};
