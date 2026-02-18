/**
 * Assignment types and collection name.
 * Kept in sync with service usage; re-exported via index for backwards compatibility.
 */

export interface Assignment {
  id: string;
  userId: string;
  shiftId: string;
  companyId?: string;
  status: 'requested' | 'accepted' | 'declined' | 'assigned' | 'completed' | 'pending-signature' | 'pending' | 'done' | 'published';
  assignedAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  decidedAt?: Date;
  declineReason?: string;
  requiresSignature?: boolean;
  signedBy?: string;
  signedAt?: Date;
  penaltyFlag?: boolean;
  employeeSignatureUrl?: string;
  employeeSignedAt?: Date;
  adminSignatureUrl?: string;
  adminSignedAt?: Date;
  formStatus?: 'acknowledged' | 'declined';
  formPlace?: string;
  formTimes?: string;
  formNotes?: string;
  formSignatureName?: string;
  formSignedAt?: Date;
  dailySignatures?: Array<{ date: string; name: string; signedAt: Date }>;
  finalSummarySignedBy?: string;
  finalSummarySignedAt?: Date;
  relievingSignatures?: Array<{
    date: string;
    signerName: string;
    signerRole?: string;
    signatureUrl: string;
    signedAt: Date;
    timesheetId?: string;
    verifiedTimes?: {
      startTime: string;
      endTime: string;
      breakMinutes: number;
      totalHours: number;
    };
  }>;
  signatureSchedule?: {
    requiredDates: Date[];
    collectedDates: string[];
    nextRequiredDate?: Date;
  };
  pdfGenerated?: boolean;
  pdfGeneratedAt?: Date;
  pdfUrl?: string;
  pdfSentTo?: { employee: boolean; admin: boolean; facility: boolean };
  adminSignerName?: string;
  facilityId?: string;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  qualification?: string;
  qualifications?: string[];
  candidateUserIds?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const COLLECTION_NAME = 'assignments';
