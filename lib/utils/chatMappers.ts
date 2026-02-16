/**
 * Zentrale Mapper: Firestore/API-Chat-Typen → Domain/UI-Chat-Typen.
 * Eine Quelle für Konvertierungen ChatChannel → Channel und ChatMessage → Message.
 */

import type { Channel, Message, Attachment } from '@/lib/types/chat';
import type { ChatChannel, ChatMessage, ChatAttachment } from '@/lib/types/chatChannels';
import { toDate } from '@/lib/utils/firestoreTimestamp';

/** Mappt Channel-Typ von API auf Domain (direct | group | broadcast). */
function mapChannelType(
  type: ChatChannel['type']
): Channel['type'] {
  if (type === 'direct') return 'direct';
  if (type === 'group') return 'group';
  if (type === 'broadcast') return 'broadcast';
  return 'group'; // 'private' | 'system' → group
}

/**
 * Konvertiert ChatChannel (Firestore/API) zu Channel (Domain/UI).
 */
export function toChannel(ch: ChatChannel): Channel {
  return {
    id: ch.id,
    type: mapChannelType(ch.type),
    name: ch.name,
    participants: ch.participants,
    lastMessage: ch.lastMessage?.text,
    lastMessageAt: ch.lastMessage?.createdAt != null ? toDate(ch.lastMessage.createdAt) : undefined,
    lastMessageSenderId: ch.lastMessage?.senderId ?? null,
    messageCount: 0,
    hasAttachments: false,
    createdBy: ch.createdBy,
    createdAt: toDate(ch.createdAt),
    companyId: ch.companyId ?? '',
  };
}

/**
 * Konvertiert ChatAttachment (API) zu Attachment (Domain).
 */
function toAttachment(a: ChatAttachment): Attachment {
  return {
    id: a.id ?? a.name,
    name: a.name,
    url: a.url,
    type: a.type ?? a.mime ?? 'file',
    size: a.size ?? a.fileSize ?? 0,
  };
}

/**
 * Konvertiert ChatMessage (Firestore/API) zu Message (Domain/UI).
 */
export function toMessage(m: ChatMessage, channelId: string): Message {
  const createdAt = toDate(m.createdAt);
  return {
    id: m.id,
    channelId,
    userId: m.senderId,
    content: m.text ?? '',
    attachments: m.attachments?.map(toAttachment),
    readBy: m.readBy ?? [],
    createdAt,
    updatedAt: createdAt,
  };
}
