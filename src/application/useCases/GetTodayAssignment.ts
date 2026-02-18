import type { Assignment } from '@/lib/types/assignment';
import type { IAssignmentRepository } from '@/src/application/ports/IAssignmentRepository';

export class GetTodayAssignment {
  constructor(private readonly assignmentRepo: IAssignmentRepository) {}

  async execute(userId: string): Promise<Assignment | null> {
    return this.assignmentRepo.getTodayAssignment(userId);
  }
}
