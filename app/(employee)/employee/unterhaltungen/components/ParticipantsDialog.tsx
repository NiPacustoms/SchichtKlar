'use client';

import { useChatUsers, useChannels } from '@/lib/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/PersonAdd';
import RemoveIcon from '@mui/icons-material/PersonRemove';
import React, { useMemo, useState } from 'react';

interface ParticipantsDialogProps {
  open: boolean;
  channelId: string;
  participantIds: string[];
  currentUserId: string;
  onClose: () => void;
}

export default function ParticipantsDialog({
  open,
  channelId,
  participantIds,
  currentUserId,
  onClose,
}: ParticipantsDialogProps) {
  const { user } = useAuth();
  const { users } = useChatUsers(user?.companyId);
  const { addParticipant, removeParticipant } = useChannels(currentUserId);
  const [filter, setFilter] = useState('');

  // Prüfe, ob User Admin/Dispatcher ist (darf Teilnehmer hinzufügen)
  const canAddParticipants = user?.role === 'admin' || user?.role === 'dispatcher';

  const participants = useMemo(
    () => users.filter(u => participantIds.includes(u.id)),
    [users, participantIds]
  );
  const nonParticipants = useMemo(
    () => users.filter(u => !participantIds.includes(u.id)),
    [users, participantIds]
  );

  const query = filter.trim().toLowerCase();
  const matchesQuery = (u: { name?: string; email?: string }) => {
    if (!query) return true;
    const name = (u.name ?? '').toLowerCase();
    const email = (u.email ?? '').toLowerCase();
    return name.includes(query) || email.includes(query);
  };
  const filteredParticipants = participants.filter(matchesQuery);
  const filteredNonParticipants = nonParticipants.filter(matchesQuery);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        Teilnehmer verwalten
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Nutzer suchen..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            size="small"
          />
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Aktuelle Teilnehmer
        </Typography>
        <List dense>
          {filteredParticipants.length === 0 && (
            <Typography variant="body2" sx={{ opacity: 0.7, px: 2, py: 1 }}>
              Keine Teilnehmer gefunden.
            </Typography>
          )}
          {filteredParticipants.map(user => {
            // Mitarbeiter können nur sich selbst entfernen, Admin/Dispatcher können alle entfernen
            const canRemove = canAddParticipants || user.id === currentUserId;
            const isSelf = user.id === currentUserId;

            return (
              <ListItem key={user.id} sx={{ py: 0.5 }}>
                <ListItemText primary={user.name} secondary={user.email} />
                {canRemove && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="remove"
                      onClick={async () => {
                        await removeParticipant(channelId, user.id);
                      }}
                      disabled={isSelf && !canAddParticipants}
                      title={
                        isSelf && !canAddParticipants
                          ? 'Sie können sich selbst nicht entfernen'
                          : 'Teilnehmer entfernen'
                      }
                    >
                      <RemoveIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            );
          })}
        </List>

        {/* Verfügbar-Bereich nur für Admin/Dispatcher anzeigen */}
        {canAddParticipants && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Verfügbar
            </Typography>
            <List dense>
              {filteredNonParticipants.length === 0 && (
                <Typography variant="body2" sx={{ opacity: 0.7, px: 2, py: 1 }}>
                  Keine Nutzer gefunden.
                </Typography>
              )}
              {filteredNonParticipants.map(user => (
                <ListItem key={user.id} sx={{ py: 0.5 }}>
                  <ListItemText primary={user.name} secondary={user.email} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="add"
                      onClick={async () => {
                        await addParticipant(channelId, user.id);
                      }}
                      title="Teilnehmer hinzufügen"
                    >
                      <AddIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
}
