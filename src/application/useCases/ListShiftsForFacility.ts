import type { Shift } from '@/lib/types/shift';
import type { IShiftRepository } from '@/src/application/ports/IShiftRepository';

export interface ListShiftsForFacilityInput {
  facilityId: string;
  limit?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Use case: list shifts for a facility (e.g. for Dienstplan).
 */
export class ListShiftsForFacility {
  constructor(private readonly shiftRepo: IShiftRepository) {}

  async execute(input: ListShiftsForFacilityInput): Promise<Shift[]> {
    return this.shiftRepo.listByFacilityId(input.facilityId, {
      limit: input.limit ?? 100,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });
  }
}
