import * as read from './read';
import * as read2 from './read2';
import * as read3 from './read3';
import * as read4 from './read4';
import * as write from './write';
import * as write2 from './write2';
import * as write3 from './write3';

export type { Timesheet, TimesheetForm, TimesheetAggregation, TimesheetRangeResult, TimesheetRangeMetadata, Break } from './types';
export { aggregateTimesheetsByUser } from './validation';

export const timesheetService = {
  getById: read.getById,
  getByUserId: read.getByUserId,
  getByDate: read.getByDate,
  getByUserAndDateRange: read.getByUserAndDateRange,
  getTodayTimesheet: read.getTodayTimesheet,
  getRecentTimesheets: read.getRecentTimesheets,
  getAll: read2.getAll,
  getByDateRange: read3.getByDateRange,
  getTimesheetsByDateRange: read4.getTimesheetsByDateRange,
  create: write.create,
  update: write.update,
  submit: write.submit,
  approve: write.approve,
  approveWithFacilitySignature: write3.approveWithFacilitySignature,
  reject: write3.reject,
  delete: write3.deleteTimesheet,
  addBreak: write2.addBreak,
  endBreak: write2.endBreak,
  approveRangeWithFacilitySignature: write2.approveRangeWithFacilitySignature,
};
