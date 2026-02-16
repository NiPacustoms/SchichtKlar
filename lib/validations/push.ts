/**
 * Zod-Schemas für Push-Notification API
 */

import { z } from 'zod';

/**
 * Schema für POST /api/push/notify
 */
export const sendPushNotificationSchema = z.object({
  userId: z.string().min(1, 'userId ist erforderlich'),
  notification: z.object({
    title: z.string().min(1, 'title ist erforderlich'),
    body: z.string().min(1, 'body ist erforderlich'),
  }),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type SendPushNotificationInput = z.infer<typeof sendPushNotificationSchema>;

