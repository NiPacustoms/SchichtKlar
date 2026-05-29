import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

// Initialize Firebase Admin
admin.initializeApp();

// Auth Functions
export { getUserRole, getUsersWithRoles, setUserRole } from './auth';

// User Triggers
export { onUserCreated, onUserUpdated } from './userTriggers';

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

export {
  checkDocumentExpiry,
  onAssignmentStatusChanged,
  onDocumentVerified,
  onShiftAssigned,
} from './notificationTriggers';

export { updateTimesheetValidation, validateTimesheet } from './timesheetValidation';

// documentExpiryCheck → codebase "scheduled" (noch im default, falls scheduled nur Form+KPI hat)
export {
  checkDocumentExpiry as checkDocumentExpiryScheduled,
  checkSpecificDocumentTypes,
  manualDocumentExpiryCheck,
} from './documentExpiryCheck';

export { notifyShiftCreated, notifyShiftUpdated } from './shiftNotifications';

// KPI Aggregations → codebase "scheduled"

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

// Email – lazy load to avoid loading email/nodemailer at deploy (prevents backend discovery timeout)
export const sendInvitationEmailCF = functions.https.onCall(async (data, context) => {
  const { sendInvitationEmailHandler } = await import('./email');
  return sendInvitationEmailHandler(data as Parameters<typeof sendInvitationEmailHandler>[0], context);
});
export const sendInvitationEmailHttp = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const secret = process.env.INVITATION_EMAIL_SECRET;
  const authHeader = req.headers.authorization;
  const bearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!secret || bearer !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const body = req.body as { to?: string; acceptLink?: string; companyName?: string };
  const { to, acceptLink } = body || {};
  if (!to || !acceptLink) {
    res.status(400).json({ error: 'Missing to or acceptLink' });
    return;
  }
  try {
    const { sendInvitationEmailInternal } = await import('./email');
    const result = await sendInvitationEmailInternal({
      to,
      acceptLink,
      companyName: body.companyName ?? '',
    });
    res.status(200).json({ success: result.success, fallback: result.fallback });
  } catch (e) {
    console.error('sendInvitationEmailHttp', e);
    res.status(500).json({ error: 'Failed to send email' });
  }
});
export const sendDocumentEmailCF = functions.https.onCall(async (data, context) => {
  const { sendDocumentEmailHandler } = await import('./email');
  return sendDocumentEmailHandler(data as Parameters<typeof sendDocumentEmailHandler>[0], context);
});
export const sendAssignmentFormEmailCF = functions.https.onCall(async (data, context) => {
  const { sendAssignmentFormEmailHandler } = await import('./email');
  return sendAssignmentFormEmailHandler(data as Parameters<typeof sendAssignmentFormEmailHandler>[0], context);
});

// DSGVO DSR Functions
export { exportUserData } from './dsr/exportUserData';
export { deleteUserData } from './dsr/deleteUserData';

// API Monitoring Cleanup
export { cleanupApiMonitoring, manualCleanupApiMonitoring } from './apiMonitoring/cleanupApiMonitoring';

// API Monitoring Alerts
export { checkApiLimitAlert, manualCheckApiLimitAlert } from './apiMonitoring/checkApiLimitAlert';

// scheduledFormReminders + runFormReminders → deployed from codebase "scheduled" (functions-scheduled/)
