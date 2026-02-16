/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/logging';

import { chatService } from '@/lib/services/chatService';
import { Attachment, Channel, ChatUser, Message } from '@/lib/types/chat';
import type { ChatMessage, ChatChannel, ChatAttachment } from '@/lib/types/chatChannels';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

// Hook für Channel-Management
export const useChannels = (userId: string) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = chatService.subscribeToChannels(userId, (newChannels: ChatChannel[]) => {
      setChannels(newChannels.map(ch => ({
        id: ch.id,
        type: ch.type === 'direct' ? 'direct' : ch.type === 'group' ? 'group' : 'broadcast',
        name: ch.name,
        participants: ch.participants,
        lastMessage: ch.lastMessage?.text,
        lastMessageAt: ch.lastMessage?.createdAt instanceof Date ? ch.lastMessage.createdAt : (ch.lastMessage?.createdAt as any)?.toDate(),
        lastMessageSenderId: ch.lastMessage?.senderId || null,
        messageCount: 0,
        hasAttachments: false,
        createdBy: ch.createdBy,
        createdAt: ch.createdAt instanceof Date ? ch.createdAt : (ch.createdAt as any)?.toDate(),
        companyId: ch.companyId || '', // ChatChannel might not have companyId, use empty string as fallback
      } as Channel)));
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const createChannel = useCallback(
    async (participants: string[], type: 'direct' | 'group' | 'broadcast', name?: string) => {
      try {
        setError(null);
        const result = await chatService.createChannel({
          participants,
          type,
          name,
          createdBy: userId,
        });
        return result.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Channels');
        throw err;
      }
    },
    [userId]
  );

  const deleteChannel = useCallback(async (channelId: string) => {
    try {
      setError(null);
      await chatService.deleteChannel(channelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen des Channels');
      throw err;
    }
  }, []);

  const addParticipant = useCallback(async (channelId: string, participantId: string) => {
    try {
      setError(null);
      await chatService.addParticipantToChannel(channelId, participantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen des Teilnehmers');
      throw err;
    }
  }, []);

  const removeParticipant = useCallback(async (channelId: string, participantId: string) => {
    try {
      setError(null);
      await chatService.removeParticipantFromChannel(channelId, participantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Entfernen des Teilnehmers');
      throw err;
    }
  }, []);

  const archiveChannel = useCallback(async (channelId: string, archived: boolean = true) => {
    try {
      setError(null);
      await chatService.archiveChannel(channelId, archived);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Archivieren');
      throw err;
    }
  }, []);

  return {
    channels,
    loading,
    error,
    createChannel,
    deleteChannel,
    addParticipant,
    removeParticipant,
    archiveChannel,
  };
};

// Helper function to convert ChatMessage to Message
const convertChatMessage = (m: ChatMessage, channelId: string): Message => {
  const createdAt = m.createdAt 
    ? (m.createdAt instanceof Date ? m.createdAt : (m.createdAt as any)?.toDate?.() || new Date())
    : new Date();
  
  return {
    id: m.id,
    channelId: channelId,
    userId: m.senderId,
    content: m.text || '',
    attachments: m.attachments?.map(a => ({
      id: a.name,
      name: a.name,
      url: a.url,
      mimeType: a.mime,
      fileSize: a.size,
    })),
    readBy: m.readBy || [],
    createdAt,
    updatedAt: createdAt,
  } as Message;
};

// Helper function to deduplicate messages
const deduplicateMessages = (messages: Message[]): Message[] => {
  const seen = new Map<string, Message>();
  for (const msg of messages) {
    // Keep the first occurrence of each message ID
    if (!seen.has(msg.id)) {
      seen.set(msg.id, msg);
    }
  }
  return Array.from(seen.values()).sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : (typeof a.createdAt === 'object' && 'toDate' in a.createdAt && typeof (a.createdAt as { toDate: () => Date }).toDate === 'function' ? (a.createdAt as { toDate: () => Date }).toDate() : new Date(a.createdAt as unknown as string | number | Date));
    const dateB = b.createdAt instanceof Date ? b.createdAt : (typeof b.createdAt === 'object' && 'toDate' in b.createdAt && typeof (b.createdAt as { toDate: () => Date }).toDate === 'function' ? (b.createdAt as { toDate: () => Date }).toDate() : new Date(b.createdAt as unknown as string | number | Date));
    return dateA.getTime() - dateB.getTime();
  });
};

// Hook für Message-Management
export const useMessages = (channelId: string | null, userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      setHasMore(true);
      lastDocRef.current = null;
      return;
    }

    setLoading(true);
    setError(null);
    setHasMore(true);
    lastDocRef.current = null;

    // Initial load via getMessages to get lastDoc
    const loadInitial = async () => {
      try {
        const { messages: initialMessages, lastDoc } = await chatService.getMessages(channelId, { limit: 50 });
        const convertedMessages = initialMessages.map(m => convertChatMessage(m, channelId));
        const deduplicatedMessages = deduplicateMessages(convertedMessages);
        setMessages(deduplicatedMessages);
        setHasMore(initialMessages.length >= 50);
        lastDocRef.current = lastDoc;
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Nachrichten');
        setLoading(false);
      }
    };

    let initialLoadComplete = false;
    let unsubscribeFn: (() => void) | null = null;

    loadInitial().then(() => {
      initialLoadComplete = true;
      
      // Subscribe to new messages only - startet erst nach initial load
      unsubscribeFn = chatService.subscribeToMessages(channelId, newMessages => {
        if (!initialLoadComplete) return; // Warte bis initial load fertig ist
        
        setMessages(prev => {
          // Konvertiere alle neuen Nachrichten
          const convertedNewMessages = (newMessages as ChatMessage[]).map(m => convertChatMessage(m, channelId));
          
          // Erstelle Map mit bestehenden Nachrichten (ID -> Message)
          const existingMessagesMap = new Map(prev.map(m => [m.id, m]));
          
          // Merge: Neue Nachrichten überschreiben bestehende, neue IDs werden hinzugefügt
          for (const newMsg of convertedNewMessages) {
            existingMessagesMap.set(newMsg.id, newMsg);
          }
          
          // Konvertiere zurück zu Array und dedupliziere/sortiere
          const allMessages = Array.from(existingMessagesMap.values());
          return deduplicateMessages(allMessages);
        });
      });
    });

    const unsubscribe = () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };

    return () => {
      unsubscribe();
    };
  }, [channelId]);

  const loadMoreMessages = useCallback(async () => {
    if (!channelId || loadingMore || !hasMore) return;
    
    // If no lastDoc, try to get it from the first message
    if (!lastDocRef.current && messages.length > 0) {
      // Load initial batch to get lastDoc
      try {
        const { lastDoc } = await chatService.getMessages(channelId, { limit: 50 });
        lastDocRef.current = lastDoc;
      } catch {
        return;
      }
    }
    
    if (!lastDocRef.current) return;

    setLoadingMore(true);
    setError(null);

    try {
      const { messages: olderMessages, lastDoc } = await chatService.getMessages(
        channelId,
        { limit: 50, before: lastDocRef.current }
      );

      if (olderMessages.length < 50) {
        setHasMore(false);
      }

      if (olderMessages.length > 0) {
        const convertedMessages = olderMessages.map(m => convertChatMessage(m, channelId));
        setMessages(prev => {
          const allMessages = [...convertedMessages, ...prev];
          return deduplicateMessages(allMessages);
        });
        lastDocRef.current = lastDoc;
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden älterer Nachrichten');
    } finally {
      setLoadingMore(false);
    }
  }, [channelId, loadingMore, hasMore, messages.length]);

  const sendMessage = useCallback(
    async (
      content: string,
      attachments?: Attachment[],
      replyTo?: string
    ) => {
      if (!channelId || !userId) {
        throw new Error('Channel ID oder User ID fehlt');
      }

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        channelId,
        userId: userId,
        content,
        attachments: attachments || [],
        createdAt: Timestamp.fromDate(new Date()),
        readBy: [userId],
        replyTo: replyTo,
      };

      // Optimistically add message
      setMessages(prev => [...prev, optimisticMessage]);

      try {
        setError(null);
        const result = await chatService.sendMessage(channelId, {
          text: content,
          senderId: userId,
          attachments: attachments?.map(a => ({
            name: a.name,
            url: a.url,
            mime: a.type || 'application/octet-stream',
            size: a.size || 0,
          })),
        });
        const messageId = result.id;

        // Replace temp message with real one
        setMessages(prev => prev.map(msg => (msg.id === tempId ? { ...msg, id: messageId } as Message : msg)));

        return messageId;
      } catch (err) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setError(err instanceof Error ? err.message : 'Fehler beim Senden der Nachricht');
        throw err;
      }
    },
    [channelId, userId]
  );

  const markAsRead = useCallback(
    async (messageId: string, userId: string) => {
      if (!channelId) return;

      try {
        await chatService.markMessageAsRead(channelId, messageId, userId);
      } catch (err) {
        logger.error('Fehler beim Markieren als gelesen:', err);
      }
    },
    [channelId]
  );

  const markAllAsRead = useCallback(
    async (messageIds: string[], userId: string) => {
      if (!channelId || messageIds.length === 0) return;

      try {
        await chatService.markMessagesAsRead(channelId, messageIds, userId);
        // Optimistisch im State aktualisieren
        setMessages(prev =>
          prev.map(msg =>
            messageIds.includes(msg.id) && !msg.readBy?.includes(userId)
              ? { ...msg, readBy: [...(msg.readBy || []), userId] }
              : msg
          )
        );
      } catch (err) {
        logger.error('Fehler beim Batch-Markieren als gelesen:', err);
      }
    },
    [channelId]
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!channelId || !userId) {
      throw new Error('Channel ID oder User ID fehlt');
    }
    try {
      setError(null);
      await chatService.deleteMessage(channelId, messageId, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Nachricht');
      throw err;
    }
  }, [channelId, userId]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!channelId || !userId) {
      throw new Error('Channel ID oder User ID fehlt');
    }
    try {
      setError(null);
      await chatService.editMessage(channelId, messageId, newContent, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Bearbeiten der Nachricht');
      throw err;
    }
  }, [channelId, userId]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!channelId || !userId) {
      throw new Error('Channel ID oder User ID fehlt');
    }
    try {
      setError(null);
      await chatService.addReaction(channelId, messageId, emoji, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen der Reaction');
      throw err;
    }
  }, [channelId, userId]);

  const pinMessage = useCallback(async (messageId: string, pinned: boolean = true) => {
    if (!channelId) return;
    try {
      setError(null);
      await chatService.pinMessage(channelId, messageId, pinned);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Pinnen der Nachricht');
      throw err;
    }
  }, [channelId]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    sendMessage,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    editMessage,
    addReaction,
    pinMessage,
    loadMoreMessages,
  };
};

// Hook für File-Upload
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File, channelId: string): Promise<Attachment> => {
    try {
      setUploading(true);
      setError(null);

      // Dateigröße prüfen (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Datei ist zu groß. Maximum: 10MB');
      }

      const chatAttachment = await chatService.uploadChatFile(file, channelId);
      setUploading(false);
      // Convert ChatAttachment to Attachment format
      return {
        id: chatAttachment.id || '',
        name: chatAttachment.name,
        url: chatAttachment.url,
        type: chatAttachment.mime || chatAttachment.type || 'application/octet-stream',
        size: chatAttachment.size || 0,
      } as Attachment;
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Fehler beim Upload');
      throw err;
    }
  }, []);

  const deleteFile = useCallback(async (attachment: Attachment, channelId: string) => {
    try {
      setError(null);
      // Convert Attachment to ChatAttachment format
      const chatAttachment: ChatAttachment = {
        name: attachment.name,
        url: attachment.url,
        mime: attachment.type || 'application/octet-stream',
        size: attachment.size || 0,
      };
      await chatService.deleteChatFile(chatAttachment, channelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Datei');
      throw err;
    }
  }, []);

  return {
    uploading,
    error,
    uploadFile,
    deleteFile,
  };
};

// Hook für User-Management
export const useChatUsers = (companyId?: string) => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      // Warte, bis companyId verfügbar ist
      if (!companyId) {
        setLoading(false);
        setUsers([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const allUsers = await chatService.getAllUsers(companyId);
        setUsers(allUsers);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Benutzer';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [companyId]);

  return {
    users,
    loading,
    error,
  };
};

// Hook für Direkt-Chat
export const useDirectChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOrCreateDirectChannel = useCallback(
    async (userId1: string, userId2: string): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        return await chatService.getOrCreateDirectChannel(userId1, userId2);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Direkt-Chats');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    getOrCreateDirectChannel,
  };
};

// Hook für Chat-Status
export const useChatState = () => {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showChannelList, setShowChannelList] = useState(true);

  const selectChannel = useCallback((channelId: string | null) => {
    setSelectedChannel(channelId);
    // Auf Mobile: Channel-Liste ausblenden wenn Chat ausgewählt
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        setShowChannelList(channelId === null);
      }
    }
  }, []);

  const toggleChannelList = useCallback(() => {
    setShowChannelList(prev => !prev);
  }, []);

  const startTyping = useCallback(() => {
    setIsTyping(true);
  }, []);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
  }, []);

  return {
    selectedChannel,
    isTyping,
    showChannelList,
    selectChannel,
    toggleChannelList,
    startTyping,
    stopTyping,
  };
};

// Hook für Typing-Indicators
export const useTyping = (channelId: string | null, currentUserId: string | null) => {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastStateRef = useRef<boolean>(false);

  useEffect(() => {
    if (!channelId) return;
    const unsubscribe = chatService.subscribeToTyping(channelId, ids => {
      setTypingUserIds(ids);
    });
    return () => {
      unsubscribe();
    };
  }, [channelId]);

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!channelId || !currentUserId) return;

      // Vermeide unnötige Writes bei gleichem Zustand
      if (lastStateRef.current === isTyping) return;
      lastStateRef.current = isTyping;

      try {
        await chatService.setTypingStatus(channelId, currentUserId, isTyping);
      } catch (_err) {
        // ignore typing write errors
      }

      // Auto-Stop nach Timeout, falls keine weitere Eingabe erfolgt
      if (isTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          lastStateRef.current = false;
          chatService.setTypingStatus(channelId, currentUserId, false).catch(() => {});
        }, 3000);
      }
    },
    [channelId, currentUserId]
  );

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      // Beim Verlassen: sicherstellen, dass Typing zurückgesetzt wird
      if (channelId && currentUserId) {
        chatService.setTypingStatus(channelId, currentUserId, false).catch(() => {});
      }
    };
  }, [channelId, currentUserId]);

  const otherTypingUserIds = typingUserIds.filter(id => id !== currentUserId);

  return {
    typingUserIds,
    otherTypingUserIds,
    setTyping,
  };
};
