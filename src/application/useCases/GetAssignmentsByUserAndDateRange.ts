import type { Assignment } from '@/lib/types/assignment';
import type { IAssignmentRepository } from '@/src/application/ports/IAssignmentRepository';

export interface GetAssignmentsByUserAndDateRangeInput {
  userId: string;
  from: Date;
  to: Date;
  companyId?: string;
}

export class GetAssignmentsByUserAndDateRange {
  constructor(private readonly assignmentRepo: IAssignmentRepository) {}

  async execute(input: GetAssignmentsByUserAndDateRangeInput): Promise<Assignment[]> {
    return this.assignmentRepo.getByUserAndDateRange(
      input.userId,
      input.from,
      input.to,
      input.companyId
    );
  }
}
