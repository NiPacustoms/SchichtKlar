'use client';

import { useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { AddComment, Search } from '@mui/icons-material';
import type { Channel } from '@/lib/types';
import { avatarColor, formatListTime, initials } from './chatFormat';

interface ChannelListProps {
  channels: Channel[];
  selectedId?: string;
  unread: Record<string, boolean>;
  getTitle: (channel: Channel) => string;
  onSelect: (channel: Channel) => void;
  onNewChat: () => void;
}

/** Linke Spalte im WhatsApp-Stil: Suche, Chat-Liste mit Vorschau, Zeit und Ungelesen-Punkt. */
export function ChannelList({ channels, selectedId, unread, getTitle, onSelect, onNewChat }: ChannelListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return channels;
    return channels.filter(
      c => getTitle(c).toLowerCase().includes(term) || (c.lastMessage || '').toLowerCase().includes(term)
    );
  }, [channels, search, getTitle]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" component="h2">
          Chats
        </Typography>
        <IconButton aria-label="Neuen Chat starten" color="primary" onClick={onNewChat}>
          <AddComment />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Chats durchsuchen"
          value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 5, bgcolor: 'action.hover' },
            },
          }}
        />
      </Box>

      <List sx={{ flex: 1, overflowY: 'auto', py: 0 }} aria-label="Chat-Liste">
        {filtered.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {channels.length === 0
                ? 'Noch keine Chats. Starte einen neuen Chat über das Symbol oben rechts.'
                : 'Keine Chats gefunden.'}
            </Typography>
          </Box>
        )}
        {filtered.map(channel => {
          const title = getTitle(channel);
          const isUnread = unread[channel.id];
          return (
            <ListItemButton
              key={channel.id}
              selected={channel.id === selectedId}
              onClick={() => onSelect(channel)}
              sx={{ px: 2, py: 1.25, alignItems: 'flex-start' }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: avatarColor(title), width: 48, height: 48 }}>{initials(title)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                    <Typography
                      component="span"
                      variant="subtitle2"
                      noWrap
                      sx={{ fontWeight: isUnread ? 700 : 500 }}
                    >
                      {title}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ color: isUnread ? 'success.main' : 'text.secondary', flexShrink: 0 }}
                    >
                      {formatListTime(channel.updatedAt)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography
                      component="span"
                      variant="body2"
                      noWrap
                      sx={{ color: 'text.secondary', fontWeight: isUnread ? 600 : 400 }}
                    >
                      {channel.lastMessage || 'Keine Nachrichten'}
                    </Typography>
                    {isUnread && (
                      <Badge
                        color="success"
                        variant="dot"
                        aria-label="Ungelesene Nachrichten"
                        sx={{ mr: 1, flexShrink: 0 }}
                      />
                    )}
                  </Box>
                }
                disableTypography
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
