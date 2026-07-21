'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { Close, Search } from '@mui/icons-material';
import { userService } from '@/lib/services/users';
import type { User } from '@/lib/types/user';
import { avatarColor, initials } from './chatFormat';
import { logger } from '@/lib/logging';

interface NewChatDialogProps {
  open: boolean;
  currentUserId: string;
  currentUserRole: 'admin' | 'nurse';
  onClose: () => void;
  onSelect: (user: User) => void;
}

/** Partnerauswahl für einen neuen 1:1-Chat. Admins sehen alle, Mitarbeiter die Verwaltung. */
export function NewChatDialog({ open, currentUserId, currentUserRole, onClose, onSelect }: NewChatDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const roles: Array<User['role']> =
          currentUserRole === 'admin' ? ['admin', 'nurse'] : ['admin'];
        const lists = await Promise.all(roles.map(r => userService.getByRole(r)));
        if (!cancelled) {
          setUsers(lists.flat().filter(u => u.id !== currentUserId && u.active !== false));
        }
      } catch (e) {
        logger.error('Chat: Nutzerliste konnte nicht geladen werden', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, currentUserId, currentUserRole]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      u => u.displayName?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
    );
  }, [users, search]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        Neuer Chat
        <IconButton aria-label="Dialog schließen" onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 2, pb: 2 }}>
        <TextField
          fullWidth
          size="small"
          autoFocus
          placeholder="Name oder E-Mail suchen"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 5 },
            },
          }}
        />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} aria-label="Kontakte werden geladen" />
          </Box>
        ) : (
          <List sx={{ maxHeight: 360, overflowY: 'auto' }} aria-label="Kontakte">
            {filtered.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                Keine Kontakte gefunden.
              </Typography>
            )}
            {filtered.map(u => {
              const name = u.displayName || u.email;
              return (
                <ListItemButton key={u.id} onClick={() => onSelect(u)} sx={{ borderRadius: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: avatarColor(name) }}>{initials(name)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={name}
                    secondary={u.role === 'admin' ? 'Verwaltung' : 'Pflegekraft'}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
