import type { Assignment } from '@/lib/types/assignment';
import type { IAssignmentRepository } from '@/src/application/ports/IAssignmentRepository';

export interface ListAssignmentsForUserInput {
  userId: string;
  companyId?: string;
  limit?: number;
}

/**
 * Use case: list assignments for a user (e.g. for employee view).
 * Orchestrates repository only; Cloud Functions remain unchanged for mutations.
 */
export class ListAssignmentsForUser {
  constructor(private readonly assignmentRepo: IAssignmentRepository) {}

  async execute(input: ListAssignmentsForUserInput): Promise<Assignment[]> {
    return this.assignmentRepo.listByUserId(input.userId, {
      companyId: input.companyId,
      limit: input.limit ?? 50,
    });
  }
}
