// Intentionale Platzhalter-Exports für künftige Trigger; aktuell deaktiviert
// import {
//   onDocumentCreated,
//   onDocumentDeleted,
//   onDocumentUpdated,
// } from 'firebase-functions/v2/firestore';

// Timesheet Triggers
export const onTimesheetCreated = (() => {}) as any; // onDocumentCreated('timesheets/{timesheetId}', async (event: any) => {
  // const data = event.data?.data();
  // if (data) {
  //   await createAuditLog(data.userId, 'timesheet_created', 'timesheet', event.params.timesheetId);
  // }
// });

export const onTimesheetUpdated = (() => {}) as any; // onDocumentUpdated('timesheets/{timesheetId}', async (event: any) => {
  // const before = event.data?.before.data();
  // const after = event.data?.after.data();

  // if (before && after) {
  //   const changes: Record<string, { old: any; new: any }> = {};

  //   if (before.status !== after.status) {
  //     changes.status = { old: before.status, new: after.status };
  //   }

  //   await createAuditLog(
  //     after.userId,
  //     'timesheet_updated',
  //     'timesheet',
  //     event.params.timesheetId,
  //     changes
  //   );
  // }
// });

export const onTimesheetDeleted = (() => {}) as any; // onDocumentDeleted('timesheets/{timesheetId}', async event => {
  // const data = event.data?.data();
  // if (data) {
  //   await createAuditLog(data.userId, 'timesheet_deleted', 'timesheet', event.params.timesheetId);
  // }
// });

// Shift Triggers
export const onShiftCreated = (() => {}) as any; // onDocumentCreated('shifts/{shiftId}', async event => {
  // const data = event.data?.data();
  // if (data) {
  //   await createAuditLog('system', 'shift_created', 'shift', event.params.shiftId);
  // }
// });

export const onShiftUpdated = (() => {}) as any; // onDocumentUpdated('shifts/{shiftId}', async event => {
  // const before = event.data?.before.data();
  // const after = event.data?.after.data();

  // if (before && after) {
  //   const changes: Record<string, { old: any; new: any }> = {};

  //   if (before.status !== after.status) {
  //     changes.status = { old: before.status, new: after.status };
  //   }
  //   if (before.assignedUserId !== after.assignedUserId) {
  //     changes.assignedUserId = { old: before.assignedUserId, new: after.assignedUserId };
  //   }

  //   await createAuditLog('system', 'shift_updated', 'shift', event.params.shiftId, changes);
  // }
// });

// Assignment Triggers
export const onAssignmentCreated = (() => {}) as any; // onDocumentCreated('assignments/{assignmentId}', async event => {
  // const data = event.data?.data();
  // if (data) {
  //   await createAuditLog(
  //     data.userId,
  //     'assignment_created',
  //     'assignment',
  //     event.params.assignmentId
  //   );
  // }
// });

export const onAssignmentUpdated = (() => {}) as any; // onDocumentUpdated('assignments/{assignmentId}', async event => {
  // const before = event.data?.before.data();
  // const after = event.data?.after.data();

  // if (before && after) {
  //   const changes: Record<string, { old: any; new: any }> = {};

  //   if (before.status !== after.status) {
  //     changes.status = { old: before.status, new: after.status };
  //   }

  //   await createAuditLog(
  //     after.userId,
  //     'assignment_updated',
  //     'assignment',
  //     event.params.assignmentId,
  //     changes
  //   );
  // }
// });

// Document Triggers
export const onDocumentCreated = (() => {}) as any; // onDocumentCreated('documents/{documentId}', async event => {
  // const data = event.data?.data();
  // if (data) {
  //   await createAuditLog(data.userId, 'document_uploaded', 'document', event.params.documentId);
  // }
// });

export const onDocumentUpdated = (() => {}) as any; // onDocumentUpdated('documents/{documentId}', async event => {
  // const before = event.data?.before.data();
  // const after = event.data?.after.data();

  // if (before && after) {
  //   const changes: Record<string, { old: any; new: any }> = {};

  //   if (before.verified !== after.verified) {
  //     changes.verified = { old: before.verified, new: after.verified };
  //   }

  //   await createAuditLog(
  //     after.verifiedBy || 'system',
  //     'document_verified',
  //     'document',
  //     event.params.documentId,
  //     changes
  //   );
  // }
// });
