/**
 * Document Types
 */

export interface Document {
  id: string;
  userId: string;
  type: 'Gesundheit' | 'Impfung' | 'Qualifikation' | 'Sonstiges';
  name: string;
  url: string;
  fileSize: number;
  mimeType: string;
  expiresAt: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentUploadForm {
  type: Document['type'];
  name: string;
  file: File;
  expiresAt: Date;
}

export interface DocumentForm {
  type: Document['type'];
  name: string;
  expiresAt: Date;
  notes?: string;
}

export interface DocumentFilters {
  userId?: string;
  type?: Document['type'];
  verified?: boolean;
  expiringInDays?: number;
}
