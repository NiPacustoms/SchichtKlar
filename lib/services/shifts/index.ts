/**
 * Shift Service – public API
 * All read/write operations are consolidated in reads.ts and writes.ts.
 */
import * as reads from './reads';
import * as writes from './writes';
import * as subscribe from './subscribe';
import { checkTimeOverlap, timeToMs } from './helpers';

export type { Shift, ShiftFilters } from './types';

export const shiftService = {
  // Read operations
  getById: reads.getById,
  getByFacility: reads.getByFacility,
  getOpenShifts: reads.getOpenShifts,
  getByDateRange: reads.getByDateRange,
  getAll: reads.getAll,
  getWithFilters: reads.getWithFilters,
  getAllWithFilters: reads.getAllWithFilters,
  getAvailableSlots: reads.getAvailableSlots,
  getAssignedUsers: reads.getAssignedUsers,
  getConflicts: reads.getConflicts,
  detectConflictForUser: reads.detectConflictForUser,
  getShiftsWithAssignments: reads.getShiftsWithAssignments,
  getCapacityIndicators: reads.getCapacityIndicators,

  // Write operations
  create: writes.create,
  update: writes.update,
  updateStatus: writes.updateStatus,
  delete: writes.deleteShift,
  assignUser: writes.assignUser,
  unassignUser: writes.unassignUser,
  createWithCapacity: writes.createWithCapacity,
  updateCapacity: writes.updateCapacity,
  updateShiftStatus: writes.updateShiftStatus,
  bulkUpdateStatus: writes.bulkUpdateStatus,

  // Subscriptions
  subscribeAll: subscribe.subscribeAll,

  // Helpers
  checkTimeOverlap,
  timeToMs,
};
