/**
 * Invitation Types
 */

export interface Invitation {
  id: string;
  companyId: string;
  email: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdByUserId: string;
  createdAt: Date;
}
