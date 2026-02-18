import { cloudFunctions } from '@/lib/services/cloudFunctions';
import type {
  IAssignmentWorkflowGateway,
  CreateWithMatchingPayload,
} from '@/src/application/ports/IAssignmentWorkflowGateway';

/**
 * Adapter: assignment workflow via Cloud Functions.
 */
export class CloudFunctionsAssignmentGateway implements IAssignmentWorkflowGateway {
  async createWithMatching(
    payload: CreateWithMatchingPayload,
    idToken: string
  ): Promise<{ assignmentId?: string }> {
    return cloudFunctions.createAssignmentWithMatching(
      payload as Parameters<typeof cloudFunctions.createAssignmentWithMatching>[0],
      idToken
    );
  }
}
