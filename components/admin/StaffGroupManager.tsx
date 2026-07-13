'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
} from '@mui/material';
import { Add, Close, Delete, Edit } from '@mui/icons-material';
import { useState } from 'react';

interface StaffGroupManagerProps {
  open: boolean;
  onClose: () => void;
  onSave: (groups: string[]) => void;
}

const DEFAULT_GROUPS = [
  'Intensivstation',
  'Operationssaal',
  'Geriatrie',
  'Pädiatrie',
  'Psychiatrie',
  'Onkologie',
  'Notaufnahme',
  'Verwaltung',
  'Hauswirtschaft',
  'Technik',
];

export function StaffGroupManager({ open, onClose, onSave }: StaffGroupManagerProps) {
  const [groups, setGroups] = useState<string[]>(DEFAULT_GROUPS);
  const [newGroup, setNewGroup] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAddGroup = () => {
    if (newGroup.trim() && !groups.includes(newGroup.trim())) {
      setGroups(prev => [...prev, newGroup.trim()]);
      setNewGroup('');
    }
  };

  const handleDeleteGroup = (group: string) => {
    setGroups(prev => prev.filter(g => g !== group));
  };

  const handleStartEdit = (group: string) => {
    setEditingGroup(group);
    setEditValue(group);
  };

  const handleSaveEdit = () => {
    if (editingGroup && editValue.trim() && !groups.includes(editValue.trim())) {
      setGroups(prev => prev.map(g => (g === editingGroup ? editValue.trim() : g)));
    }
    setEditingGroup(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditValue('');
  };

  const handleSave = () => {
    onSave(groups);
    onClose();
  };

  const handleClose = () => {
    setGroups(DEFAULT_GROUPS);
    setNewGroup('');
    setEditingGroup(null);
    setEditValue('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Gruppen verwalten
          </Typography>
          <IconButton onClick={handleClose} size="small" aria-label="Schließen">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Neue Gruppe hinzufügen
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Gruppenname"
              value={newGroup}
              onChange={e => setNewGroup(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  handleAddGroup();
                }
              }}
              placeholder="z.B. Intensivstation, Operationssaal..."
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddGroup}
              disabled={!newGroup.trim() || groups.includes(newGroup.trim())}
            >
              Hinzufügen
            </Button>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Bestehende Gruppen ({groups.length})
          </Typography>

          {groups.length === 0 ? (
            <Alert severity="info">
              Keine Gruppen vorhanden. Fügen Sie eine neue Gruppe hinzu.
            </Alert>
          ) : (
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
              {groups.map((group, index) => (
                <ListItem key={index} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  {editingGroup === group ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <TextField
                        fullWidth
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleSaveEdit}
                        disabled={!editValue.trim() || groups.includes(editValue.trim())}
                      >
                        Speichern
                      </Button>
                      <Button size="small" onClick={handleCancelEdit}>
                        Abbrechen
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <ListItemText primary={group} secondary={`Gruppe ${index + 1}`} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleStartEdit(group)} size="small" aria-label="Bearbeiten">
                          <Edit />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteGroup(group)}
                          size="small"
                          color="error"
                          aria-label="Löschen"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Hinweis:</strong> Gruppen helfen dabei, Mitarbeiter zu organisieren und
            Schichten zuzuweisen. Sie können Gruppen bearbeiten oder löschen, aber achten Sie
            darauf, dass Mitarbeiter, die einer gelöschten Gruppe zugeordnet sind, neu zugewiesen
            werden müssen.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button onClick={handleSave} variant="contained">
          Änderungen speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
