'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme as useAppTheme } from '@/contexts/ThemeContext';
import { useChannels } from '@/lib/hooks/useChat';
import { toDate } from '@/lib/utils/firestoreTimestamp';
import { Channel } from '@/lib/types/chat';
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
import { useMemo, useState } from 'react';

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
  const { mode } = useAppTheme();
  const isDark = false;
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const currentUserId = user?.id || '';

  const { channels, loading, error } = useChannels(currentUserId);

  // Filter channels based on search query
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;

    return channels.filter(channel => {
      const searchLower = searchQuery.toLowerCase();
      return (
        channel.name?.toLowerCase().includes(searchLower) ||
        channel.lastMessage?.toLowerCase().includes(searchLower)
      );
    });
  }, [channels, searchQuery]);

  // Get channel display name
  const getChannelName = (channel: Channel): string => {
    if (channel.name) return channel.name;
    if (channel.type === 'direct') {
      // TODO: Get other participant's name
      return 'Direktnachricht';
    }
    return 'Unbenannter Chat';
  };

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
    if (timestamp == null) return '';
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
                <SearchIcon sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              '& fieldset': {
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
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
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
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
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  <ListItemButton
                    onClick={() => onChannelSelect(channel.id)}
                    selected={isSelected}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&.Mui-selected': {
                        backgroundColor: isDark ? 'rgba(0,95,115,0.2)' : 'rgba(0,95,115,0.1)',
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(0,95,115,0.3)' : 'rgba(0,95,115,0.15)',
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
                            bgcolor: isDark ? 'rgba(0,95,115,0.3)' : 'rgba(0,95,115,0.1)',
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
                              color: isDark ? 'white' : 'text.primary',
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
                                bgcolor: isDark ? 'rgba(255,193,7,0.2)' : 'rgba(255,193,7,0.1)',
                                color: '#ff9800',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          {channel.lastMessage && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: unreadCount > 0 ? 500 : 400,
                              }}
                            >
                              {channel.lastMessage}
                            </Typography>
                          )}
                          {channel.lastMessageAt && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                fontSize: '0.75rem',
                              }}
                            >
                              {formatLastMessageTime(channel.lastMessageAt)}
                            </Typography>
                          )}
                        </Box>
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
