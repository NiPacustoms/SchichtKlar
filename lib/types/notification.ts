/**
 * Notification Types
 */

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'shift_assigned'
    | 'shift_reminder'
    | 'document_expiry'
    | 'system'
    | 'shift-assigned'
    | 'shift-requested'
    | 'assignment-accepted'
    | 'time-conflict'
    | 'signature-required';
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
}
