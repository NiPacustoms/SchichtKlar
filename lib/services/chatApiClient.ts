import { auth } from '@/lib/firebase';
import { Attachment, Channel, ChatUser, Message } from '@/lib/types/chat';
import { Timestamp } from 'firebase/firestore';

/**
 * API-Client für Chat-Backend-Endpunkte
 * Stellt alle Chat-Operationen über die Backend-API bereit
 */
class ChatApiClient {
  private baseUrl = '/api/chat';

  /**
   * Holt den aktuellen Firebase ID Token für Authentifizierung
   */
  private async getAuthToken(): Promise<string> {
    if (!auth?.currentUser) {
      throw new Error('User not authenticated');
    }
    return await auth.currentUser.getIdToken();
  }

  /**
   * Führt einen API-Request aus mit automatischer Token-Authentifizierung
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        // Bei 404-Fehlern, versuche die Fehlermeldung zu extrahieren
        if (response.status === 404) {
          const error = await response.json().catch(() => ({ message: 'Endpoint not found' }));
          throw new Error(error.message || `Endpoint not found: ${endpoint}`);
        }
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // Wenn der Fehler bereits eine Error-Instanz ist, weiterwerfen
      if (error instanceof Error) {
        throw error;
      }
      // Sonst einen neuen Error erstellen
      throw new Error('Network error or invalid response');
    }
  }

  // ==================== Channels ====================

  /**
   * Alle Channels für einen User abrufen
   */
  async getChannels(companyId?: string): Promise<Channel[]> {
    const params = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const response = await this.request<{ channels: Channel[] }>(`/channels${params}`);
    return response.channels.map(ch => ({
      ...ch,
      createdAt: ch.createdAt instanceof Timestamp ? ch.createdAt : Timestamp.fromDate(new Date(ch.createdAt as string | Date)),
      lastMessageAt: ch.lastMessageAt ? (ch.lastMessageAt instanceof Timestamp ? ch.lastMessageAt : Timestamp.fromDate(new Date(ch.lastMessageAt as string | Date))) : undefined,
    }));
  }

  /**
   * Channel abrufen
   */
  async getChannel(channelId: string): Promise<Channel> {
    const response = await this.request<Channel>(`/channels/${channelId}`);
    return {
      ...response,
      createdAt: response.createdAt instanceof Timestamp ? response.createdAt : Timestamp.fromDate(new Date(response.createdAt as string | Date)),
      lastMessageAt: response.lastMessageAt ? (response.lastMessageAt instanceof Timestamp ? response.lastMessageAt : Timestamp.fromDate(new Date(response.lastMessageAt as string | Date))) : undefined,
    };
  }

  /**
   * Neuen Channel erstellen
   */
  async createChannel(
    participants: string[],
    type: 'direct' | 'group' | 'broadcast',
    name?: string,
    companyId?: string
  ): Promise<string> {
    const response = await this.request<{ channelId: string }>('/channels', {
      method: 'POST',
      body: JSON.stringify({ participants, type, name, companyId }),
    });
    return response.channelId;
  }

  /**
   * Channel aktualisieren
   */
  async updateChannel(channelId: string, data: Partial<Channel>): Promise<void> {
    await this.request(`/channels/${channelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Channel löschen
   */
  async deleteChannel(channelId: string): Promise<void> {
    await this.request(`/channels/${channelId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Teilnehmer zu Channel hinzufügen
   */
  async addParticipant(channelId: string, participantId: string): Promise<void> {
    await this.request(`/channels/${channelId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    });
  }

  /**
   * Teilnehmer aus Channel entfernen
   */
  async removeParticipant(channelId: string, participantId: string): Promise<void> {
    await this.request(`/channels/${channelId}/participants?participantId=${encodeURIComponent(participantId)}`, {
      method: 'DELETE',
    });
  }

  // ==================== Messages ====================

  /**
   * Messages für einen Channel abrufen
   */
  async getMessages(
    channelId: string,
    limit: number = 50,
    startAfterId?: string
  ): Promise<{ messages: Message[]; lastDocId: string | null; hasMore: boolean }> {
    const params = new URLSearchParams({
      channelId,
      limit: limit.toString(),
    });
    if (startAfterId) {
      params.append('startAfter', startAfterId);
    }

    const response = await this.request<{
      messages: Array<Omit<Message, 'createdAt' | 'updatedAt'> & { createdAt: Timestamp | Date | string; updatedAt?: Timestamp | Date | string }>;
      lastDocId: string | null;
      hasMore: boolean;
    }>(`/messages?${params.toString()}`);

    return {
      ...response,
      messages: response.messages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt instanceof Timestamp ? msg.createdAt : Timestamp.fromDate(new Date(msg.createdAt)),
        updatedAt: msg.updatedAt ? (msg.updatedAt instanceof Timestamp ? msg.updatedAt : Timestamp.fromDate(new Date(msg.updatedAt))) : undefined,
      })),
    };
  }

  /**
   * Nachricht senden
   */
  async sendMessage(
    channelId: string,
    content: string,
    userId: string,
    attachments?: Attachment[],
    replyTo?: string
  ): Promise<string> {
    // Verschlüsselung clientseitig durchführen
    const { encryptForChannel } = await import('@/lib/utils/crypto');
    const encryptedPayload = await encryptForChannel(channelId, content);

    const response = await this.request<{ messageId: string }>('/messages', {
      method: 'POST',
      body: JSON.stringify({ channelId, encryptedPayload, attachments, replyTo }),
    });
    return response.messageId;
  }

  /**
   * Nachricht bearbeiten
   */
  async editMessage(messageId: string, channelId: string, newContent: string): Promise<void> {
    // Verschlüsselung clientseitig durchführen
    const { encryptForChannel } = await import('@/lib/utils/crypto');
    const encryptedPayload = await encryptForChannel(channelId, newContent);

    await this.request(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ encryptedPayload }),
    });
  }

  /**
   * Nachricht löschen
   */
  async deleteMessage(messageId: string): Promise<void> {
    await this.request(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Nachricht als gelesen markieren
   */
  async markMessageAsRead(channelId: string, messageId: string, userId: string): Promise<void> {
    await this.request(`/messages/${messageId}/read`, {
      method: 'POST',
      body: JSON.stringify({ channelId, userId }),
    });
  }

  /**
   * Mehrere Nachrichten als gelesen markieren
   */
  async markMessagesAsRead(channelId: string, messageIds: string[], userId: string): Promise<void> {
    await this.request('/messages/read', {
      method: 'POST',
      body: JSON.stringify({ channelId, messageIds, userId }),
    });
  }

  // ==================== Typing ====================

  /**
   * Typing-Status setzen
   */
  async setTypingStatus(channelId: string, userId: string, isTyping: boolean): Promise<void> {
    await this.request('/typing', {
      method: 'POST',
      body: JSON.stringify({ channelId, userId, isTyping }),
    });
  }

  /**
   * Typing-Status für einen Channel abrufen
   */
  async getTypingStatus(channelId: string): Promise<string[]> {
    const response = await this.request<{ typingUserIds: string[] }>(
      `/typing?channelId=${encodeURIComponent(channelId)}`
    );
    return response.typingUserIds;
  }

  // ==================== File Upload ====================

  /**
   * Datei für Chat hochladen
   */
  async uploadChatFile(file: File, channelId: string): Promise<Attachment> {
    const token = await this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('channelId', channelId);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.attachment;
  }

  // ==================== Users ====================

  /**
   * Alle Benutzer für Chat-Auswahl abrufen
   */
  async getAllUsers(): Promise<ChatUser[]> {
    const response = await this.request<{ users: Array<Omit<ChatUser, 'lastSeen'> & { lastSeen?: Timestamp | Date | string }> }>('/users');
    // Konvertiere Timestamps falls vorhanden
    return response.users.map(user => ({
      ...user,
      lastSeen: user.lastSeen 
        ? (user.lastSeen instanceof Timestamp 
            ? user.lastSeen 
            : Timestamp.fromDate(new Date(user.lastSeen)))
        : undefined,
    }));
  }

  // ==================== Direct Chat ====================

  /**
   * Direkt-Chat zwischen zwei Benutzern finden oder erstellen
   */
  async getOrCreateDirectChannel(userId1: string, userId2: string): Promise<string> {
    const response = await this.request<{ channelId: string }>('/direct', {
      method: 'POST',
      body: JSON.stringify({ userId2 }),
    });
    return response.channelId;
  }
}

// Singleton-Instanz exportieren
export const chatApiClient = new ChatApiClient();

