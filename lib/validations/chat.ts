import { z } from 'zod';

/**
 * Zod-Schemas für Chat-API-Validierung
 */

/**
 * Schema für Channel-Erstellung (POST /api/chat/channels)
 */
export const createChannelSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').trim(),
  type: z.enum(['direct', 'group', 'broadcast']),
  participants: z.array(z.string().min(1)).min(1, 'Mindestens ein Teilnehmer erforderlich'),
  facilityId: z.string().trim().optional(),
});

/**
 * Schema für Channel-Update (PUT /api/chat/channels/[channelId])
 */
export const updateChannelSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').trim().optional(),
  participants: z.array(z.string().min(1)).optional(),
});

/**
 * Schema für Nachricht senden (POST /api/chat/messages)
 */
export const sendMessageSchema = z.object({
  channelId: z.string().min(1, 'channelId ist erforderlich'),
  content: z.string().trim().optional(),
  encryptedPayload: z.object({
    ciphertextB64: z.string(),
    ivB64: z.string(),
    algo: z.string(),
  }).optional(),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string().optional(),
    size: z.number().optional(),
  })).optional(),
  replyTo: z.string().optional(),
}).refine(
  (data) => data.content || data.encryptedPayload,
  {
    message: 'content oder encryptedPayload ist erforderlich',
    path: ['content'],
  }
);

/**
 * Schema für Nachricht-Update (PUT /api/chat/messages/[messageId])
 */
export const updateMessageSchema = z.object({
  content: z.string().trim().optional(),
  encryptedPayload: z.object({
    ciphertextB64: z.string(),
    ivB64: z.string(),
    algo: z.string(),
  }).optional(),
}).refine(
  (data) => data.content || data.encryptedPayload,
  {
    message: 'content oder encryptedPayload ist erforderlich',
    path: ['content'],
  }
);

/**
 * Schema für Nachrichten-Query (GET /api/chat/messages)
 */
export const messagesQuerySchema = z.object({
  channelId: z.string().min(1, 'channelId ist erforderlich'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional().default(50),
  startAfter: z.string().optional(),
});

/**
 * Schema für Direct-Message (POST /api/chat/direct)
 */
export const directMessageSchema = z.object({
  recipientId: z.string().min(1, 'recipientId ist erforderlich'),
  content: z.string().trim().optional(),
  encryptedPayload: z.object({
    ciphertextB64: z.string(),
    ivB64: z.string(),
    algo: z.string(),
  }).optional(),
}).refine(
  (data) => data.content || data.encryptedPayload,
  {
    message: 'content oder encryptedPayload ist erforderlich',
    path: ['content'],
  }
);

/**
 * Schema für Typing-Indicator (POST /api/chat/typing)
 */
export const typingIndicatorSchema = z.object({
  channelId: z.string().min(1, 'channelId ist erforderlich'),
  isTyping: z.boolean(),
});

/**
 * Schema für Read-Status (POST /api/chat/messages/read)
 */
export const markReadSchema = z.object({
  channelId: z.string().min(1, 'channelId ist erforderlich').optional(),
  messageIds: z.array(z.string().min(1)).min(1, 'Mindestens eine Nachricht-ID erforderlich').optional(),
}).refine(
  (data) => data.channelId || (data.messageIds && data.messageIds.length > 0),
  {
    message: 'channelId oder messageIds ist erforderlich',
    path: ['channelId'],
  }
);

/**
 * Schema für Teilnehmer hinzufügen (POST /api/chat/channels/[channelId]/participants)
 */
export const addParticipantsSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1, 'Mindestens ein Teilnehmer erforderlich'),
});

