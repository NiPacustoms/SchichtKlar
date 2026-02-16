import { useEffect, useState, useRef, useCallback } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { chatService } from '@/lib/services/chatService';
import type { ChatMessage } from '@/lib/types/chatChannels';
import { logger } from '@/lib/utils/logger';

export function useChatMessages(channelId: string, pageSize = 50) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const initialLoadRef = useRef(false);

  // Initial load
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasMore(true);
    lastDocRef.current = null;
    initialLoadRef.current = false;

    // Load initial messages
    chatService.getMessages(channelId, { limit: pageSize }).then(({ messages: initialMessages, lastDoc }) => {
      setMessages(initialMessages);
      lastDocRef.current = lastDoc;
      setHasMore(initialMessages.length >= pageSize);
      setLoading(false);
      initialLoadRef.current = true;
    }).catch((error) => {
      logger.error('Error loading messages:', error);
      setLoading(false);
    });

    // Subscribe to new messages
    const unsub = chatService.onMessages(channelId, (newMessages) => {
      if (initialLoadRef.current) {
        // Merge new messages with existing ones
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const toAdd = newMessages.filter(m => !existingIds.has(m.id));
          if (toAdd.length > 0) {
            return [...prev, ...toAdd];
          }
          // Update existing messages
          return prev.map(old => {
            const updated = newMessages.find(m => m.id === old.id);
            return updated || old;
          });
        });
      }
    }, pageSize);

    return () => unsub();
  }, [channelId, pageSize]);

  const loadMore = useCallback(async () => {
    if (!channelId || loadingMore || !hasMore || !lastDocRef.current) return;

    setLoadingMore(true);
    try {
      const { messages: olderMessages, lastDoc } = await chatService.getMessages(channelId, {
        limit: pageSize,
        before: lastDocRef.current,
      });

      if (olderMessages.length < pageSize) {
        setHasMore(false);
      }

      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        lastDocRef.current = lastDoc;
      } else {
        setHasMore(false);
      }
    } catch (error) {
      logger.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [channelId, pageSize, loadingMore, hasMore]);

  const markAsRead = useCallback(async (messageId: string, uid: string) => {
    try {
      await chatService.markAsRead(channelId, messageId, uid);
    } catch (error) {
      logger.error('Error marking message as read:', error);
    }
  }, [channelId]);

  const markChannelAsRead = useCallback(async (uid: string) => {
    try {
      await chatService.markChannelAsRead(channelId, uid);
    } catch (error) {
      logger.error('Error marking channel as read:', error);
    }
  }, [channelId]);

  return { 
    messages, 
    loading, 
    loadingMore, 
    hasMore, 
    loadMore,
    markAsRead,
    markChannelAsRead,
  };
}

