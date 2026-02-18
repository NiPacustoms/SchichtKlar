import type { Shift } from '@/lib/types/shift';
import type { IShiftRepository } from '@/src/application/ports/IShiftRepository';

/**
 * Use case: get a single shift by ID.
 */
export class GetShiftById {
  constructor(private readonly shiftRepo: IShiftRepository) {}

  async execute(shiftId: string): Promise<Shift | null> {
    return this.shiftRepo.getById(shiftId);
  }
}
