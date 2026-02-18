import type { Facility } from '@/lib/types/facility';
import type { IFacilityRepository } from '@/src/application/ports/IFacilityRepository';

export interface ListFacilitiesByCompanyInput {
  companyId: string;
  limit?: number;
}

/**
 * Use case: list facilities for a company (e.g. for Admin Einrichtungen).
 */
export class ListFacilitiesByCompany {
  constructor(private readonly facilityRepo: IFacilityRepository) {}

  async execute(input: ListFacilitiesByCompanyInput): Promise<Facility[]> {
    return this.facilityRepo.listByCompanyId(input.companyId, {
      limit: input.limit ?? 100,
    });
  }
}
