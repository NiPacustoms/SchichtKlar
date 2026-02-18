import * as read from './read';
import * as read2 from './read2';
import * as read3 from './read3';
import * as read4 from './read4';
import * as read5 from './read5';
import * as write from './write';
import * as writeSignatures from './writeSignatures';
import * as conflicts from './conflicts';
import * as pdf from './pdf';
import { generateSignaturePDFAndSendEmails } from './pdfGenerate';

export type { Assignment, PaginatedResponse } from './types';
export { COLLECTION_NAME } from './types';

export const assignmentService = {
  getById: read.getById,
  getByUserId: read.getByUserId,
  getByShiftId: read2.getByShiftId,
  getAll: read2.getAll,
  getByStatus: read3.getByStatus,
  getByUserAndDateRange: read3.getByUserAndDateRange,
  getActiveByShift: read4.getActiveByShift,
  getMyActiveAssignments: read4.getMyActiveAssignments,
  getMyPendingAssignments: read5.getMyPendingAssignments,
  getTodayAssignment: read5.getTodayAssignment,
  getUpcomingAssignments: read5.getUpcomingAssignments,
  create: write.create,
  accept: write.accept,
  decline: write.decline,
  complete: write.complete,
  update: write.update,
  delete: write.deleteAssignment,
  notifyAdminsAboutFormStatus: write.notifyAdminsAboutFormStatus,
  bulkUpdate: write.bulkUpdate,
  createRequest: write.createRequest,
  bulkAssign: write.bulkAssign,
  addRelievingSignature: writeSignatures.addRelievingSignature,
  checkConflict: conflicts.checkConflict,
  checkTimeOverlap: conflicts.checkTimeOverlap,
  timeToMs: conflicts.timeToMs,
  checkConflictsForShift: conflicts.checkConflictsForShift,
  checkAndGeneratePDFIfComplete: pdf.checkAndGeneratePDFIfComplete,
  generateSignaturePDFAndSendEmails,
};
