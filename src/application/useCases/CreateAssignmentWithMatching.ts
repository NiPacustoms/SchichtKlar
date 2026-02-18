import type { IAssignmentWorkflowGateway } from '@/src/application/ports/IAssignmentWorkflowGateway';

export interface CreateAssignmentWithMatchingInput {
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

/**
 * Use case: create assignment with candidate matching (delegates to CF).
 * Orchestrates client-side; actual creation runs in Cloud Function.
 */
export class CreateAssignmentWithMatching {
  constructor(private readonly gateway: IAssignmentWorkflowGateway) {}

  async execute(
    input: CreateAssignmentWithMatchingInput,
    idToken: string
  ): Promise<{ assignmentId?: string }> {
    return this.gateway.createWithMatching(
      {
        facilityId: input.facilityId,
        companyId: input.companyId,
        startDate: input.startDate,
        startTime: input.startTime,
        endTime: input.endTime,
        qualification: input.qualification,
        hours: input.hours,
        limit: input.limit,
        selectedUserIds: input.selectedUserIds,
      },
      idToken
    );
  }
}
