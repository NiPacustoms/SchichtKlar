import type { Timesheet } from '@/lib/types/timesheet';
import type { ITimesheetRepository } from '@/src/application/ports/ITimesheetRepository';

export interface ListTimesheetsForUserInput {
  userId: string;
  limit?: number;
}

/**
 * Use case: list timesheets for a user (e.g. for Zeiten/Zeiterfassung).
 */
export class ListTimesheetsForUser {
  constructor(private readonly timesheetRepo: ITimesheetRepository) {}

  async execute(input: ListTimesheetsForUserInput): Promise<Timesheet[]> {
    return this.timesheetRepo.listByUserId(input.userId, {
      limit: input.limit ?? 50,
    });
  }
}
