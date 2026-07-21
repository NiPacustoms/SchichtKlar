'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { messageService } from '@/lib/services/messages';
import { userService } from '@/lib/services/users';
import type { Channel, Message } from '@/lib/types';
import type { User } from '@/lib/types/user';
import { logger } from '@/lib/logging';

/** Realtime-Liste aller Chats des Nutzers inkl. Namen der Gesprächspartner. */
export function useChatChannels(userId: string | undefined) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Record<string, User>>({});
  const partnersRef = useRef<Record<string, User>>({});

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = messageService.listenToChannels(userId, list => {
      setChannels(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  // Namen der jeweils anderen Teilnehmer nachladen (mit Cache)
  useEffect(() => {
    if (!userId) return;
    const missing = new Set<string>();
    channels.forEach(c =>
      c.participants.filter(p => p !== userId && !partnersRef.current[p]).forEach(p => missing.add(p))
    );
    if (missing.size === 0) return;
    let cancelled = false;
    (async () => {
      const loaded: Record<string, User> = {};
      await Promise.all(
        Array.from(missing).map(async uid => {
          try {
            const u = await userService.getById(uid);
            if (u) loaded[uid] = u;
          } catch (e) {
            logger.warn('Chat: Teilnehmer konnte nicht geladen werden', {}, { uid, e });
          }
        })
      );
      if (!cancelled && Object.keys(loaded).length > 0) {
        partnersRef.current = { ...partnersRef.current, ...loaded };
        setPartners(partnersRef.current);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [channels, userId]);

  const getChannelTitle = useCallback(
    (channel: Channel): string => {
      if (channel.type !== 'direct' && channel.name) return channel.name;
      const otherId = channel.participants.find(p => p !== userId);
      const other = otherId ? partners[otherId] : undefined;
      return other?.displayName || other?.email || 'Unbekannt';
    },
    [partners, userId]
  );

  return { channels, loading, partners, getChannelTitle };
}

/** Realtime-Nachrichten eines Chats; markiert eingehende Nachrichten als gelesen. */
export function useChatMessages(channelId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const markedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    markedRef.current = new Set();
    const unsubscribe = messageService.listenToChannel(channelId, list => {
      setMessages(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [channelId]);

  // Fremde, ungelesene Nachrichten als gelesen markieren (WhatsApp-Häkchen)
  useEffect(() => {
    if (!userId) return;
    messages
      .filter(m => m.userId !== userId && !m.readBy.includes(userId) && !markedRef.current.has(m.id))
      .forEach(m => {
        markedRef.current.add(m.id);
        messageService.markAsRead(m.id, userId).catch(e => {
          logger.warn('Chat: markAsRead fehlgeschlagen', {}, { messageId: m.id, e });
        });
      });
  }, [messages, userId]);

  const send = useCallback(
    async (content: string, attachments?: File[]) => {
      if (!channelId || !userId) return;
      await messageService.sendMessage(channelId, userId, content, attachments);
    },
    [channelId, userId]
  );

  return { messages, loading, send };
}

const READ_STORAGE_KEY = 'schichtklar.chat.lastRead';

function loadLastRead(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(READ_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Ungelesen-Status pro Channel (für Fettdruck/Badge in der Chat-Liste).
 * Lese-Zeitpunkte werden lokal gespeichert; markChannelRead beim Öffnen aufrufen.
 */
export function useUnreadByChannel(channels: Channel[], userId: string | undefined) {
  const [lastRead, setLastRead] = useState<Record<string, number>>(loadLastRead);

  const markChannelRead = useCallback((channelId: string) => {
    setLastRead(prev => {
      const next = { ...prev, [channelId]: Date.now() };
      try {
        window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage nicht verfügbar (z. B. Privatmodus) – Badge bleibt dann Session-lokal
      }
      return next;
    });
  }, []);

  const unread = useMemo(() => {
    const map: Record<string, boolean> = {};
    channels.forEach(c => {
      map[c.id] =
        !!c.lastMessage &&
        c.lastMessageUserId !== userId &&
        c.updatedAt.getTime() > (lastRead[c.id] || 0);
    });
    return map;
  }, [channels, lastRead, userId]);

  return { unread, markChannelRead };
}
