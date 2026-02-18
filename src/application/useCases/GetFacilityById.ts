import type { Facility } from '@/lib/types/facility';
import type { IFacilityRepository } from '@/src/application/ports/IFacilityRepository';

/**
 * Use case: get a single facility by ID.
 */
export class GetFacilityById {
  constructor(private readonly facilityRepo: IFacilityRepository) {}

  async execute(facilityId: string): Promise<Facility | null> {
    return this.facilityRepo.getById(facilityId);
  }
}
