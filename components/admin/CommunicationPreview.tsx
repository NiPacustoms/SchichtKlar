'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Message, Channel } from '@/lib/types';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Forum as ChannelIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface CommunicationPreviewProps {
  messages: Message[];
  channels: Channel[];
  onMessageClick?: (message: Message) => void;
  onChannelClick?: (channel: Channel) => void;
}

export function CommunicationPreview({
  messages,
  channels,
  onMessageClick,
  onChannelClick,
}: CommunicationPreviewProps) {
  const getChannelName = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel?.name || 'Unbekannter Kanal';
  };

  const getChannelTypeIcon = (type: Channel['type']) => {
    switch (type) {
      case 'station':
        return '🏥';
      case 'shift':
        return '📅';
      case 'general':
        return '💬';
      default:
        return '💬';
    }
  };

  const getChannelTypeLabel = (type: Channel['type']) => {
    switch (type) {
      case 'station':
        return 'Station';
      case 'shift':
        return 'Schicht';
      case 'general':
        return 'Allgemein';
      default:
        return type;
    }
  };

  const recentMessages = messages
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const activeChannels = channels
    .filter(channel => {
      const channelMessages = messages.filter(m => m.channelId === channel.id);
      return channelMessages.length > 0;
    })
    .sort((a, b) => {
      const aMessages = messages.filter(m => m.channelId === a.id);
      const bMessages = messages.filter(m => m.channelId === b.id);
      const aLastMessage = aMessages.sort(
        (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
      )[0];
      const bLastMessage = bMessages.sort(
        (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
      )[0];

      if (!aLastMessage || !bLastMessage) return 0;
      return (
        new Date(bLastMessage.createdAt).getTime() - new Date(aLastMessage.createdAt).getTime()
      );
    })
    .slice(0, 3);

  if (messages.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Keine Nachrichten
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keine neuen Nachrichten in den letzten 24 Stunden
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Kommunikation
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<ChatIcon />}
              label={`${messages.length} Nachrichten`}
              color="primary"
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<ChannelIcon />}
              label={`${channels.length} Kanäle`}
              color="secondary"
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Recent Messages */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Neueste Nachrichten
            </Typography>
            <List dense>
              {recentMessages.map(message => (
                <ListItem key={message.id} disablePadding>
                  <ListItemButton
                    onClick={() => onMessageClick?.(message)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {getChannelName(message.channelId)}
                          </Typography>
                          <Chip
                            label={getChannelTypeLabel(
                              channels.find(c => c.id === message.channelId)?.type || 'general'
                            )}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 0.5,
                            }}
                          >
                            {message.content}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScheduleIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(message.createdAt), {
                                addSuffix: true,
                                locale: de,
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider />

          {/* Active Channels */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Aktive Kanäle
            </Typography>
            <List dense>
              {activeChannels.map(channel => {
                const channelMessages = messages.filter(m => m.channelId === channel.id);
                const lastMessage = channelMessages.sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0];

                return (
                  <ListItem key={channel.id} disablePadding>
                    <ListItemButton
                      onClick={() => onChannelClick?.(channel)}
                      sx={{ borderRadius: 1, mb: 0.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                          {getChannelTypeIcon(channel.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {channel.name}
                            </Typography>
                            <Chip
                              label={`${channelMessages.length} Nachrichten`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          lastMessage && (
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 0.5,
                                }}
                              >
                                {lastMessage.content}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDistanceToNow(new Date(lastMessage.createdAt), {
                                  addSuffix: true,
                                  locale: de,
                                })}
                              </Typography>
                            </Box>
                          )
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Box>
      </Box>
    </GlassCard>
  );
}
