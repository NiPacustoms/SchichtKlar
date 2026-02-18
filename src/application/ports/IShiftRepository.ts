import type { Shift } from '@/lib/types/shift';

/**
 * Port for shift persistence – implemented by infrastructure.
 */
export interface IShiftRepository {
  getById(id: string): Promise<Shift | null>;

  listByFacilityId(
    facilityId: string,
    options?: { limit?: number; dateFrom?: Date; dateTo?: Date }
  ): Promise<Shift[]>;
}
