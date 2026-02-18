import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { sendFormReminderEmails } from './formReminders';

// Initialize Firebase Admin
admin.initializeApp();

// Auth Functions
export { getUserRole, getUsersWithRoles, setUserRole } from './auth';

// User Triggers
export { onUserCreated, onUserUpdated } from './userTriggers';

// Audit Log Triggers
export {
  onAssignmentCreated,
  onAssignmentUpdated,
  onDocumentCreated as onDocumentCreatedAudit,
  onDocumentUpdated as onDocumentUpdatedAudit,
  onShiftCreated,
  onShiftUpdated,
  onTimesheetCreated,
  onTimesheetDeleted,
  onTimesheetUpdated,
} from './auditLogTriggers';

// Notification Triggers
export {
  checkDocumentExpiry,
  onAssignmentStatusChanged,
  onDocumentVerified,
  onShiftAssigned,
} from './notificationTriggers';

// Timesheet Validation
export { updateTimesheetValidation, validateTimesheet } from './timesheetValidation';

// Document Expiry Check
export {
  checkDocumentExpiry as checkDocumentExpiryScheduled,
  checkSpecificDocumentTypes,
  manualDocumentExpiryCheck,
} from './documentExpiryCheck';

// Shift Notifications
export { notifyShiftCreated, notifyShiftUpdated } from './shiftNotifications';

// KPI Aggregations
export { aggregateKPIs, dailyKPIAggregation } from './kpiAggregations';

// Admin Functions
export { deleteAllAssignments } from './deleteAllAssignments';

// Schichtverwaltung Cloud Functions
export { assignShift } from './assignShift';
export { declineAssignment } from './declineAssignment';
export { findCandidates } from './findCandidates';
export { requestShift } from './requestShift';
export { unassignShift } from './unassignShift';

// Timesheet Cloud Functions
export { submitTimesheet } from './submitTimesheet';
export { protectApprovedTimesheets } from './protectTimesheet';
export { onTimesheetWrite } from './weeklyLimitOnTimesheetWrite';

// Email
export { sendInvitationEmailCF } from './email';
// DSGVO DSR Functions
export { exportUserData } from './dsr/exportUserData';
export { deleteUserData } from './dsr/deleteUserData';

// API Monitoring Cleanup
export { cleanupApiMonitoring, manualCleanupApiMonitoring } from './apiMonitoring/cleanupApiMonitoring';

// API Monitoring Alerts
export { checkApiLimitAlert, manualCheckApiLimitAlert } from './apiMonitoring/checkApiLimitAlert';

export const scheduledFormReminders = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    await sendFormReminderEmails();
  });

export const runFormReminders = functions.https.onRequest(async (_req, res) => {
  try {
    await sendFormReminderEmails();
    res.status(200).json({ok: true});
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ok: false, error: e instanceof Error ? e.message : 'unknown'});
  }
});
