import type { IAssignmentRepository, PaginatedAssignments } from '@/src/application/ports/IAssignmentRepository';

export interface ListAllAssignmentsInput {
  page?: number;
  limit?: number;
}

export class ListAllAssignments {
  constructor(private readonly assignmentRepo: IAssignmentRepository) {}

  async execute(input: ListAllAssignmentsInput = {}): Promise<PaginatedAssignments> {
    return this.assignmentRepo.getAll({
      page: input.page ?? 1,
      limit: input.limit ?? 50,
    });
  }
}
