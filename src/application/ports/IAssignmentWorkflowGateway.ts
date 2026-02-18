/**
 * Port for assignment workflow operations that call Cloud Functions.
 * Implemented by infrastructure (cloudFunctions adapter).
 */
export interface CreateWithMatchingPayload {
  facilityId: string;
  companyId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  qualification?: string;
  hours?: number;
  limit?: number;
  selectedUserIds?: string[];
}

export interface IAssignmentWorkflowGateway {
  createWithMatching(
    payload: CreateWithMatchingPayload,
    idToken: string
  ): Promise<{ assignmentId?: string }>;
}
