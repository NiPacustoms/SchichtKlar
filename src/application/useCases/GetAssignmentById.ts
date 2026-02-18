import type { Assignment } from '@/lib/types/assignment';
import type { IAssignmentRepository } from '@/src/application/ports/IAssignmentRepository';

/**
 * Use case: get a single assignment by ID.
 */
export class GetAssignmentById {
  constructor(private readonly assignmentRepo: IAssignmentRepository) {}

  async execute(assignmentId: string): Promise<Assignment | null> {
    return this.assignmentRepo.getById(assignmentId);
  }
}
