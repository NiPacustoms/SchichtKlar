import type { Facility } from '@/lib/types/facility';

/**
 * Port for facility persistence – implemented by infrastructure.
 */
export interface IFacilityRepository {
  getById(id: string): Promise<Facility | null>;

  listByCompanyId(
    companyId: string,
    options?: { limit?: number }
  ): Promise<Facility[]>;
}
