import type { Timesheet } from '@/lib/types/timesheet';
import type { ITimesheetRepository } from '@/src/application/ports/ITimesheetRepository';

/**
 * Use case: get a single timesheet by ID.
 */
export class GetTimesheetById {
  constructor(private readonly timesheetRepo: ITimesheetRepository) {}

  async execute(timesheetId: string): Promise<Timesheet | null> {
    return this.timesheetRepo.getById(timesheetId);
  }
}
