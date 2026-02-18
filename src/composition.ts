/**
 * Composition root – wires domain, application, and infrastructure.
 * Single place to obtain use cases and optional plugin init.
 */
import { EventBus } from '@/src/infrastructure/events/EventBus';
import {
  AssignmentRepo,
  ShiftRepo,
  TimesheetRepo,
  UserRepo,
  FacilityRepo,
  CloudFunctionsAssignmentGateway,
  type AssignmentWithDetails,
} from '@/src/infrastructure/firebase';
import { ListAssignmentsForUser } from '@/src/application/useCases/ListAssignmentsForUser';
import { GetAssignmentById } from '@/src/application/useCases/GetAssignmentById';
import { GetTodayAssignment } from '@/src/application/useCases/GetTodayAssignment';
import { GetUpcomingAssignments } from '@/src/application/useCases/GetUpcomingAssignments';
import { GetMyActiveAssignments } from '@/src/application/useCases/GetMyActiveAssignments';
import { ListAllAssignments } from '@/src/application/useCases/ListAllAssignments';
import { GetAssignmentsByShiftId } from '@/src/application/useCases/GetAssignmentsByShiftId';
import { GetAssignmentsByUserAndDateRange } from '@/src/application/useCases/GetAssignmentsByUserAndDateRange';
import { GetShiftById } from '@/src/application/useCases/GetShiftById';
import { ListShiftsForFacility } from '@/src/application/useCases/ListShiftsForFacility';
import { GetTimesheetById } from '@/src/application/useCases/GetTimesheetById';
import { ListTimesheetsForUser } from '@/src/application/useCases/ListTimesheetsForUser';
import { GetUserById } from '@/src/application/useCases/GetUserById';
import { GetFacilityById } from '@/src/application/useCases/GetFacilityById';
import { ListFacilitiesByCompany } from '@/src/application/useCases/ListFacilitiesByCompany';
import { CreateAssignmentWithMatching } from '@/src/application/useCases/CreateAssignmentWithMatching';
import { pluginRegistry, registerNotificationsPlugin } from '@/src/plugins';

// Repositories (singletons)
const assignmentRepo = new AssignmentRepo();
const shiftRepo = new ShiftRepo();
const timesheetRepo = new TimesheetRepo();
const userRepo = new UserRepo();
const facilityRepo = new FacilityRepo();
const assignmentWorkflowGateway = new CloudFunctionsAssignmentGateway();

// Use cases
export const listAssignmentsForUser = new ListAssignmentsForUser(assignmentRepo);
export const getAssignmentById = new GetAssignmentById(assignmentRepo);
export const getTodayAssignment = new GetTodayAssignment(assignmentRepo);
export const getUpcomingAssignments = new GetUpcomingAssignments(assignmentRepo);
export const getMyActiveAssignments = new GetMyActiveAssignments(assignmentRepo);
export const listAllAssignments = new ListAllAssignments(assignmentRepo);
export const getAssignmentsByShiftId = new GetAssignmentsByShiftId(assignmentRepo);
export const getAssignmentsByUserAndDateRange = new GetAssignmentsByUserAndDateRange(assignmentRepo);
export const getShiftById = new GetShiftById(shiftRepo);
export const listShiftsForFacility = new ListShiftsForFacility(shiftRepo);
export const getTimesheetById = new GetTimesheetById(timesheetRepo);
export const listTimesheetsForUser = new ListTimesheetsForUser(timesheetRepo);
export const getUserById = new GetUserById(userRepo);
export const getFacilityById = new GetFacilityById(facilityRepo);
export const listFacilitiesByCompany = new ListFacilitiesByCompany(facilityRepo);
export const createAssignmentWithMatching = new CreateAssignmentWithMatching(
  assignmentWorkflowGateway
);

// EventBus (singleton)
export { EventBus };

export type { AssignmentWithDetails };

let pluginsInitialized = false;

/**
 * Call once at app startup (e.g. in layout or provider) to register plugins
 * and subscribe them to EventBus.
 */
export async function initPlugins(): Promise<void> {
  if (pluginsInitialized) return;
  registerNotificationsPlugin();
  await pluginRegistry.initAll(EventBus);
  pluginsInitialized = true;
}
