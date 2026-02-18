import type { Assignment } from '@/lib/types/assignment';
import type { IAssignmentRepository } from '@/src/application/ports/IAssignmentRepository';

export class GetUpcomingAssignments {
  constructor(private readonly assignmentRepo: IAssignmentRepository) {}

  async execute(userId: string): Promise<Assignment[]> {
    return this.assignmentRepo.getUpcomingAssignments(userId);
  }
}
