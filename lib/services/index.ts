// Export all services
export { authService } from './authService';
export { assignmentService } from './assignments';
export { cloudFunctions, shiftAssignmentHelpers } from './cloudFunctions';
export { documentTypeService } from './documentTypes';
export { documentService } from './documents';
export { facilityService } from './facilities';
export { facilityHoursService } from './facilityHours';
export { messageService } from './messages';
export { notificationService } from './notifications';
export { reportService } from './reports';
export { settingsService } from './settings';
export { shiftService } from './shifts';
export { timesheetService, aggregateTimesheetsByUser } from './timesheets';
export { userService } from './users';
export { adminChatService } from './adminChat';
export { timesService } from './times';
export { employeeFacilitiesService } from './employeeFacilities';
export { adminSettingsService } from './adminSettings';
export { employeeReportsService } from './employeeReports';
export { holidayProvider } from './holidayProvider';
export { templateService } from './templateService';

// Re-export types for convenience
export type {
  Assignment,
  AssignmentFilters,
  Channel,
  Document,
  DocumentFilters,
  DocumentUploadForm,
  Facility,
  Message,
  PaginatedResponse,
  Shift,
  ShiftFilters,
  Timesheet,
  TimesheetForm,
  User,
  UserUpdateForm,
} from '../types';

export type { HolidayProvider, GermanState } from './holidayProvider';
