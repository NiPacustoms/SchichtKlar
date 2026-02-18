import type { Assignment } from '@/lib/types/assignment';

export interface PaginatedAssignments {
  data: Assignment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Port for assignment persistence – implemented by infrastructure.
 * Use cases depend on this interface only.
 */
export interface IAssignmentRepository {
  getById(id: string): Promise<Assignment | null>;

  listByUserId(
    userId: string,
    options?: { companyId?: string; limit?: number }
  ): Promise<Assignment[]>;

  getByShiftId(shiftId: string): Promise<Assignment[]>;

  getAll(options?: { page?: number; limit?: number }): Promise<PaginatedAssignments>;

  getTodayAssignment(userId: string): Promise<Assignment | null>;

  getUpcomingAssignments(userId: string): Promise<Assignment[]>;

  getMyActiveAssignments(userId: string): Promise<Assignment[]>;

  getByUserAndDateRange(userId: string, from: Date, to: Date, companyId?: string): Promise<Assignment[]>;
}
