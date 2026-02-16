'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useChannels, useChatUsers } from '@/lib/hooks/useChat';
import { Channel } from '@/lib/types/chat';
import { toDate } from '@/lib/utils/firestore';
import {
  Campaign as BroadcastIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState, useCallback } from 'react';

interface ChannelListProps {
  onChannelSelect: (channelId: string) => void;
  selectedChannel: string | null;
  onNewChat: () => void;
}

export default function ChannelList({
  onChannelSelect,
  selectedChannel,
  onNewChat: _onNewChat,
}: ChannelListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const currentUserId = user?.id || '';

  const { channels, loading, error } = useChannels(currentUserId);
  const { users: chatUsers } = useChatUsers(user?.companyId);

  // Get channel display name
  const getChannelName = useCallback(
    (channel: Channel): string => {
      if (channel.name) return channel.name;
      if (channel.type === 'direct') {
        // Finde den anderen Teilnehmer in direkten Nachrichten
        const otherParticipantId = channel.participants?.find(id => id !== currentUserId);
        if (otherParticipantId) {
          const otherParticipant = chatUsers.find(u => u.id === otherParticipantId);
          if (otherParticipant) {
            return otherParticipant.name || otherParticipant.email || 'Unbekannter Benutzer';
          }
        }
        return 'Direktnachricht';
      }
      return 'Unbenannter Chat';
    },
    [chatUsers, currentUserId]
  );

  // Filter channels based on search query
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;

    return channels.filter(channel => {
      const searchLower = searchQuery.toLowerCase();
      const channelName = getChannelName(channel).toLowerCase();
      return (
        channelName.includes(searchLower) ||
        channel.lastMessage?.toLowerCase().includes(searchLower)
      );
    });
  }, [channels, searchQuery, getChannelName]);

  // Get channel icon
  const getChannelIcon = (channel: Channel) => {
    switch (channel.type) {
      case 'direct':
        return <PersonIcon />;
      case 'group':
        return <GroupIcon />;
      case 'broadcast':
        return <BroadcastIcon />;
      default:
        return <GroupIcon />;
    }
  };

  // Format last message time
  const formatLastMessageTime = (timestamp: unknown): string => {
    if (!timestamp) return '';

    const date = toDate(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString('de-DE', {
        weekday: 'short',
      });
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  // Get unread count for current user
  const getUnreadCount = (channel: Channel): number => {
    if (!channel.unreadCount || !currentUserId) return 0;
    return channel.unreadCount[currentUserId] || 0;
  };

  if (loading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Fehler beim Laden der Chats: {error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Search Bar */}
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          placeholder="Chats durchsuchen..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(0,0,0,0.6)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(0,0,0,0.04)',
              '& fieldset': {
                borderColor: 'rgba(0,0,0,0.2)',
              },
            },
          }}
        />
      </Box>

      {/* Channel List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredChannels.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              color: 'rgba(0,0,0,0.6)',
            }}
          >
            <Typography variant="body2">
              {searchQuery ? 'Keine Chats gefunden' : 'Noch keine Chats vorhanden'}
            </Typography>
            {!searchQuery && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Erstelle einen neuen Chat, um zu beginnen
              </Typography>
            )}
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredChannels.map(channel => {
              const unreadCount = getUnreadCount(channel);
              const isSelected = selectedChannel === channel.id;

              return (
                <ListItem
                  key={channel.id}
                  disablePadding
                  sx={{
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <ListItemButton
                    onClick={() => onChannelSelect(channel.id)}
                    selected={isSelected}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(0,95,115,0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(0,95,115,0.15)',
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={unreadCount}
                        color="primary"
                        invisible={unreadCount === 0}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.75rem',
                            minWidth: 18,
                            height: 18,
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: 'rgba(0,95,115,0.1)',
                            color: '#005f73',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getChannelIcon(channel)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: unreadCount > 0 ? 600 : 400,
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {getChannelName(channel)}
                          </Typography>
                          {channel.type === 'broadcast' && (
                            <Chip
                              label="Broadcast"
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.7rem',
                                bgcolor: 'rgba(255,193,7,0.1)',
                                color: '#ff9800',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          {channel.lastMessage && (
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{
                                color: 'rgba(0,0,0,0.7)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: unreadCount > 0 ? 500 : 400,
                                display: 'block',
                              }}
                            >
                              {channel.lastMessage}
                            </Typography>
                          )}
                          {channel.lastMessageAt && (
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                color: 'rgba(0,0,0,0.5)',
                                fontSize: '0.75rem',
                                display: 'block',
                              }}
                            >
                              {formatLastMessageTime(channel.lastMessageAt)}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}
