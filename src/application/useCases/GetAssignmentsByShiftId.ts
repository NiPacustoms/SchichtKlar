import type { Assignment } from '@/lib/types/assignment';
import type { IAssignmentRepository } from '@/src/application/ports/IAssignmentRepository';

export class GetAssignmentsByShiftId {
  constructor(private readonly assignmentRepo: IAssignmentRepository) {}

  async execute(shiftId: string): Promise<Assignment[]> {
    return this.assignmentRepo.getByShiftId(shiftId);
  }
}
