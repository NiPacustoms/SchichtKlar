import { Timestamp } from 'firebase/firestore';

export type ChatChannel = {
  id: string;
  name?: string;
  type: 'private' | 'group' | 'system' | 'broadcast' | 'direct';
  participants: string[];
  createdBy: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  companyId?: string; // Mandantenzugehörigkeit
  facilityId?: string;
  archived?: boolean; // Archiviert (ausgeblendet, nicht gelöscht)
  description?: string; // Channel-Beschreibung
  pinnedMessages?: string[]; // IDs gepinnter Nachrichten
  lastMessage?: {
    text: string;
    senderId: string;
    senderName?: string;
    createdAt: Timestamp | Date;
    unreadCount: number;
  };
};

export type ChatMessage = {
  id: string;
  text?: string;
  type: 'text' | 'image' | 'file' | 'system';
  senderId: string;
  senderName?: string;
  createdAt: Timestamp | Date;
  readBy: string[];
  attachments?: ChatAttachment[];
  replyTo?: string; // ID der geantworteten Nachricht
  mentions?: string[]; // User-IDs die erwähnt wurden
  reactions?: Record<string, string[]>; // Emoji -> Array von User-IDs
  pinned?: boolean; // Ob Nachricht gepinnt ist
  editedAt?: Timestamp | Date; // Zeitpunkt der letzten Bearbeitung
};

export type ChatAttachment = {
  id?: string; // Optional für Kompatibilität mit Attachment
  name: string;
  url: string;
  mime: string;
  mimeType?: string; // Alias für Kompatibilität
  type?: string; // Alias für Kompatibilität
  size: number;
  fileSize?: number; // Alias für Kompatibilität
};

export type CreateChannelInput = {
  name?: string;
  participants: string[];
  type: 'private' | 'group' | 'system' | 'broadcast' | 'direct';
  createdBy: string;
  facilityId?: string;
  companyId?: string; // Mandantenzugehörigkeit
};

export type SendMessageInput = {
  text?: string;
  senderId: string;
  senderName?: string;
  attachments?: ChatAttachment[];
};

