/**
 * Message & Channel Types
 */

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  fileSize: number;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  companyId?: string;
  content: string;
  attachments?: MessageAttachment[];
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Channel {
  id: string;
  companyId?: string;
  name: string;
  type: 'station' | 'shift' | 'general' | 'direct';
  scopeId: string;
  participants: string[];
  /** Denormalisierte Vorschau der letzten Nachricht für die Chat-Liste */
  lastMessage?: string;
  lastMessageUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}
