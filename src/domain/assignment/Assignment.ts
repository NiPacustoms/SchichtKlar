/**
 * Assignment entity – pure domain model.
 * Uses types from lib/types/assignment for compatibility; status from domain.
 */
import type { Assignment as IAssignment } from '@/lib/types/assignment';
import type { AssignmentStatus } from './AssignmentStatus';
import { isTerminalStatus, canTransitionTo } from './AssignmentStatus';

export type { AssignmentStatus } from './AssignmentStatus';

export class Assignment {
  readonly id: string;
  readonly userId: string;
  readonly shiftId: string;
  readonly companyId?: string;
  readonly status: AssignmentStatus;
  readonly assignedAt: Date;
  readonly acceptedAt?: Date;
  readonly declinedAt?: Date;
  readonly completedAt?: Date;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly decidedAt?: Date;
  readonly declineReason?: string;
  readonly requiresSignature?: boolean;
  readonly signedBy?: string;
  readonly signedAt?: Date;
  readonly penaltyFlag?: boolean;
  readonly employeeSignatureUrl?: string;
  readonly employeeSignedAt?: Date;
  readonly adminSignatureUrl?: string;
  readonly adminSignedAt?: Date;
  readonly adminSignerName?: string;
  readonly relievingSignatures?: IAssignment['relievingSignatures'];
  readonly signatureSchedule?: IAssignment['signatureSchedule'];
  readonly pdfGenerated?: boolean;
  readonly pdfGeneratedAt?: Date;
  readonly pdfUrl?: string;
  readonly pdfSentTo?: IAssignment['pdfSentTo'];

  constructor(data: IAssignment) {
    this.id = data.id;
    this.userId = data.userId;
    this.shiftId = data.shiftId;
    this.companyId = data.companyId;
    this.status = data.status as AssignmentStatus;
    this.assignedAt = toDate(data.assignedAt);
    this.acceptedAt = data.acceptedAt != null ? toDate(data.acceptedAt) : undefined;
    this.declinedAt = data.declinedAt != null ? toDate(data.declinedAt) : undefined;
    this.completedAt = data.completedAt != null ? toDate(data.completedAt) : undefined;
    this.notes = data.notes;
    this.createdAt = toDate(data.createdAt);
    this.updatedAt = toDate(data.updatedAt);
    this.decidedAt = data.decidedAt != null ? toDate(data.decidedAt) : undefined;
    this.declineReason = data.declineReason;
    this.requiresSignature = data.requiresSignature;
    this.signedBy = data.signedBy;
    this.signedAt = data.signedAt != null ? toDate(data.signedAt) : undefined;
    this.penaltyFlag = data.penaltyFlag;
    this.employeeSignatureUrl = data.employeeSignatureUrl;
    this.employeeSignedAt =
      data.employeeSignedAt != null ? toDate(data.employeeSignedAt) : undefined;
    this.adminSignatureUrl = data.adminSignatureUrl;
    this.adminSignedAt =
      data.adminSignedAt != null ? toDate(data.adminSignedAt) : undefined;
    this.adminSignerName = data.adminSignerName;
    this.relievingSignatures = data.relievingSignatures;
    this.signatureSchedule = data.signatureSchedule;
    this.pdfGenerated = data.pdfGenerated;
    this.pdfGeneratedAt =
      data.pdfGeneratedAt != null ? toDate(data.pdfGeneratedAt) : undefined;
    this.pdfUrl = data.pdfUrl;
    this.pdfSentTo = data.pdfSentTo;
  }

  get isTerminal(): boolean {
    return isTerminalStatus(this.status);
  }

  canTransitionTo(newStatus: AssignmentStatus): boolean {
    return canTransitionTo(this.status, newStatus);
  }

  toPlain(): IAssignment {
    return {
      id: this.id,
      userId: this.userId,
      shiftId: this.shiftId,
      companyId: this.companyId,
      status: this.status,
      assignedAt: this.assignedAt,
      acceptedAt: this.acceptedAt,
      declinedAt: this.declinedAt,
      completedAt: this.completedAt,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      decidedAt: this.decidedAt,
      declineReason: this.declineReason,
      requiresSignature: this.requiresSignature,
      signedBy: this.signedBy,
      signedAt: this.signedAt,
      penaltyFlag: this.penaltyFlag,
      employeeSignatureUrl: this.employeeSignatureUrl,
      employeeSignedAt: this.employeeSignedAt,
      adminSignatureUrl: this.adminSignatureUrl,
      adminSignedAt: this.adminSignedAt,
      adminSignerName: this.adminSignerName,
      relievingSignatures: this.relievingSignatures,
      signatureSchedule: this.signatureSchedule,
      pdfGenerated: this.pdfGenerated,
      pdfGeneratedAt: this.pdfGeneratedAt,
      pdfUrl: this.pdfUrl,
      pdfSentTo: this.pdfSentTo,
    };
  }
}

function toDate(value: Date | unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (
    value != null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}
