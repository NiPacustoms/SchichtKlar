/**
 * Assignment-Workflow-Service: Einsätze mit Status "published" erstellen,
 * Annehmen/Ablehnen durch Mitarbeiter, Einrichtung benachrichtigen.
 * Baut auf Cloud Functions auf (createWithMatching, declineWithSignature, notifyFacility).
 */

import { cloudFunctions } from '@/lib/services/cloudFunctions';

export interface CreateWithMatchingInput {
  facilityId: string;
  companyId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  qualification?: string;
  hours?: number;
  limit?: number;
}

export interface DeclineWithSignatureInput {
  assignmentId: string;
  reason: string;
  signatureDataUrl: string;
}

export interface NotifyFacilityInput {
  assignmentId: string;
  employeeName: string;
  contact?: string;
}

export const assignmentWorkflow = {
  /**
   * Einsatz mit Kandidaten-Matching erstellen und Kandidaten per FCM benachrichtigen.
   * idToken: Firebase ID-Token (z. B. firebaseUser.getIdToken()).
   */
  createWithMatching: (payload: CreateWithMatchingInput & { selectedUserIds?: string[] }, idToken: string) =>
    cloudFunctions.createAssignmentWithMatching(payload, idToken),

  /**
   * Einsatz mit Grund und Signatur ablehnen (Mitarbeiter).
   */
  declineWithSignature: (payload: DeclineWithSignatureInput) =>
    cloudFunctions.declineAssignmentWithSignature(payload),

  /**
   * Einrichtung per E-Mail benachrichtigen, dass ein MA den Einsatz übernommen hat.
   */
  notifyFacility: (payload: NotifyFacilityInput) =>
    cloudFunctions.notifyFacilityForAssignment(payload),
};
