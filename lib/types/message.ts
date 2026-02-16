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
  type: 'station' | 'shift' | 'general';
  scopeId: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}
