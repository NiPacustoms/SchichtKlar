import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Assignment } from '@/lib/types/assignment';
import type { IAssignmentRepository, PaginatedAssignments } from '@/src/application/ports/IAssignmentRepository';
import { assignmentService } from '@/lib/services/assignments';

const COLLECTION_NAME = 'assignments';

function toDate(value: unknown): Date {
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

/** Extended fields used by UI (denormalized / from Firestore). */
export type AssignmentWithDetails = Assignment & {
  formStatus?: 'acknowledged' | 'declined';
  pdfUrl?: string;
  facilityId?: string;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  candidateUserIds?: string[];
  qualification?: string;
};

function mapDocToAssignment(docId: string, data: Record<string, unknown>): AssignmentWithDetails {
  const base: Assignment = {
    id: docId,
    userId: String(data.userId ?? ''),
    shiftId: String(data.shiftId ?? ''),
    companyId: data.companyId != null ? String(data.companyId) : undefined,
    status: (data.status as Assignment['status']) ?? 'pending',
    assignedAt: toDate(data.assignedAt),
    acceptedAt: data.acceptedAt != null ? toDate(data.acceptedAt) : undefined,
    declinedAt: data.declinedAt != null ? toDate(data.declinedAt) : undefined,
    completedAt: data.completedAt != null ? toDate(data.completedAt) : undefined,
    notes: data.notes != null ? String(data.notes) : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    decidedAt: data.decidedAt != null ? toDate(data.decidedAt) : undefined,
    declineReason:
      data.declineReason != null ? String(data.declineReason) : undefined,
    requiresSignature:
      data.requiresSignature != null ? Boolean(data.requiresSignature) : undefined,
    signedBy: data.signedBy != null ? String(data.signedBy) : undefined,
    signedAt: data.signedAt != null ? toDate(data.signedAt) : undefined,
    penaltyFlag:
      data.penaltyFlag != null ? Boolean(data.penaltyFlag) : undefined,
  };
  return {
    ...base,
    formStatus: data.formStatus != null ? (data.formStatus as AssignmentWithDetails['formStatus']) : undefined,
    pdfUrl: data.pdfUrl != null ? String(data.pdfUrl) : undefined,
    facilityId: data.facilityId != null ? String(data.facilityId) : undefined,
    startDate: data.startDate != null ? toDate(data.startDate) : undefined,
    endDate: data.endDate != null ? toDate(data.endDate) : undefined,
    startTime: data.startTime != null ? String(data.startTime) : undefined,
    endTime: data.endTime != null ? String(data.endTime) : undefined,
    candidateUserIds: Array.isArray(data.candidateUserIds) ? (data.candidateUserIds as string[]) : undefined,
    qualification: data.qualification != null ? String(data.qualification) : undefined,
  };
}

export class AssignmentRepo implements IAssignmentRepository {
  async getById(id: string): Promise<Assignment | null> {
    const db = getDb();
    if (!db) return null;
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!snap.exists()) return null;
    return mapDocToAssignment(snap.id, snap.data() as Record<string, unknown>);
  }

  async listByUserId(
    userId: string,
    options?: { companyId?: string; limit?: number }
  ): Promise<Assignment[]> {
    const list = await assignmentService.getByUserId(userId, options?.companyId, options?.limit ?? 50);
    return list as Assignment[];
  }

  async getByShiftId(shiftId: string): Promise<Assignment[]> {
    return assignmentService.getByShiftId(shiftId) as Promise<Assignment[]>;
  }

  async getAll(options?: { page?: number; limit?: number }): Promise<PaginatedAssignments> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const result = await assignmentService.getAll(page, limit);
    return { ...result, data: result.data as Assignment[] };
  }

  async getTodayAssignment(userId: string): Promise<Assignment | null> {
    return assignmentService.getTodayAssignment(userId) as Promise<Assignment | null>;
  }

  async getUpcomingAssignments(userId: string): Promise<Assignment[]> {
    return assignmentService.getUpcomingAssignments(userId) as Promise<Assignment[]>;
  }

  async getMyActiveAssignments(userId: string): Promise<Assignment[]> {
    return assignmentService.getMyActiveAssignments(userId) as Promise<Assignment[]>;
  }

  async getByUserAndDateRange(userId: string, from: Date, to: Date, companyId?: string): Promise<Assignment[]> {
    return assignmentService.getByUserAndDateRange(userId, from, to, companyId) as Promise<Assignment[]>;
  }
}
