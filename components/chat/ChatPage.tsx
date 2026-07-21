'use client';

import { useCallback, useMemo, useState } from 'react';
import { Box, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ChatBubbleOutline } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '@/lib/services/messages';
import { useChatChannels, useUnreadByChannel } from '@/lib/hooks/useChat';
import type { Channel } from '@/lib/types';
import type { User } from '@/lib/types/user';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ChannelList } from './ChannelList';
import { Conversation } from './Conversation';
import { NewChatDialog } from './NewChatDialog';
import { logger } from '@/lib/logging';

/**
 * Chat im WhatsApp-Stil (ohne Sprachnachrichten und Anrufe):
 * links die Chat-Liste, rechts das Gespräch; auf Mobilgeräten eine Ansicht mit Zurück-Navigation.
 */
export function ChatPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { channels, loading, partners, getChannelTitle } = useChatChannels(user?.id);
  const { unread, markChannelRead } = useUnreadByChannel(channels, user?.id);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [newChatOpen, setNewChatOpen] = useState(false);

  const selected = useMemo(() => channels.find(c => c.id === selectedId), [channels, selectedId]);

  const handleSelect = useCallback(
    (channel: Channel) => {
      setSelectedId(channel.id);
      markChannelRead(channel.id);
    },
    [markChannelRead]
  );

  const handleNewChat = useCallback(
    async (other: User) => {
      if (!user) return;
      setNewChatOpen(false);
      try {
        const channelId = await messageService.findOrCreateDirectChannel(user.id, other.id, user.companyId);
        setSelectedId(channelId);
        markChannelRead(channelId);
      } catch (e) {
        logger.error('Chat: Channel konnte nicht erstellt werden', e);
      }
    },
    [user, markChannelRead]
  );

  if (!user) return <LoadingSpinner />;

  const subtitleFor = (channel: Channel): string | undefined => {
    const otherId = channel.participants.find(p => p !== user.id);
    const other = otherId ? partners[otherId] : undefined;
    if (!other) return undefined;
    return other.role === 'admin' ? 'Verwaltung' : 'Pflegekraft';
  };

  const showList = !isMobile || !selected;
  const showConversation = !!selected && (!isMobile || !!selected);

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        height: { xs: 'calc(100dvh - 180px)', md: 'calc(100dvh - 160px)' },
        minHeight: 420,
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {showList && (
        <Box
          sx={{
            width: { xs: '100%', md: 360 },
            flexShrink: 0,
            borderRight: { md: 1 },
            borderColor: { md: 'divider' },
            height: '100%',
          }}
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <ChannelList
              channels={channels}
              selectedId={selectedId}
              unread={unread}
              getTitle={getChannelTitle}
              onSelect={handleSelect}
              onNewChat={() => setNewChatOpen(true)}
            />
          )}
        </Box>
      )}

      {showConversation && selected ? (
        <Box sx={{ flex: 1, minWidth: 0, height: '100%' }}>
          <Conversation
            channel={selected}
            title={getChannelTitle(selected)}
            subtitle={subtitleFor(selected)}
            userId={user.id}
            onBack={isMobile ? () => setSelectedId(undefined) : undefined}
          />
        </Box>
      ) : (
        !isMobile && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              bgcolor: 'action.hover',
            }}
          >
            <ChatBubbleOutline sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="body1" color="text.secondary">
              Wähle einen Chat aus oder starte einen neuen.
            </Typography>
          </Box>
        )
      )}

      <NewChatDialog
        open={newChatOpen}
        currentUserId={user.id}
        currentUserRole={user.role}
        onClose={() => setNewChatOpen(false)}
        onSelect={u => void handleNewChat(u)}
      />
    </Paper>
  );
}
