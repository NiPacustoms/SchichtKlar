import type { Timesheet } from '@/lib/types/timesheet';

/**
 * Port for timesheet persistence – implemented by infrastructure.
 */
export interface ITimesheetRepository {
  getById(id: string): Promise<Timesheet | null>;

  listByUserId(
    userId: string,
    options?: { limit?: number }
  ): Promise<Timesheet[]>;
}
