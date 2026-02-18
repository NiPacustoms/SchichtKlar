import * as read from './read';
import * as read2 from './read2';
import * as read3 from './read3';
import * as read4 from './read4';
import * as read5 from './read5';
import * as read6 from './read6';
import * as read7 from './read7';
import * as write from './write';
import * as write2 from './write2';
import * as write3 from './write3';
import * as subscribe from './subscribe';
import { checkTimeOverlap, timeToMs } from './helpers';

export type { Shift, ShiftFilters } from './types';

export const shiftService = {
  getById: read.getById,
  getByFacility: read2.getByFacility,
  getOpenShifts: read2.getOpenShifts,
  getByDateRange: read2.getByDateRange,
  subscribeAll: subscribe.subscribeAll,
  create: write.create,
  update: write.update,
  updateStatus: write.updateStatus,
  delete: write.deleteShift,
  getAll: read3.getAll,
  getWithFilters: read4.getWithFilters,
  getAllWithFilters: read4.getAllWithFilters,
  assignUser: write2.assignUser,
  unassignUser: write2.unassignUser,
  createWithCapacity: write3.createWithCapacity,
  getAvailableSlots: read5.getAvailableSlots,
  getAssignedUsers: read5.getAssignedUsers,
  updateCapacity: write3.updateCapacity,
  getConflicts: read6.getConflicts,
  detectConflictForUser: read6.detectConflictForUser,
  checkTimeOverlap,
  timeToMs,
  getShiftsWithAssignments: read7.getShiftsWithAssignments,
  getCapacityIndicators: read7.getCapacityIndicators,
  updateShiftStatus: write3.updateShiftStatus,
  bulkUpdateStatus: write3.bulkUpdateStatus,
};
