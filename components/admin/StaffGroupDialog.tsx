'use client';

import { logger } from '@/lib/logging';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { staffGroupService } from '@/lib/services/staffGroups';
import { User } from '@/lib/types';
import { StaffGroupData } from '@/lib/types/staffGroup';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/utils/toast';
import { Add, Close, Edit, Group } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Autocomplete,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface StaffGroup {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
}

interface StaffGroupDialogProps {
  open: boolean;
  onClose: () => void;
  group?: StaffGroup | null;
  staff: User[];
}

const GROUP_COLORS = [
  { value: '#1976d2', label: 'Blau' },
  { value: '#388e3c', label: 'Grün' },
  { value: '#f57c00', label: 'Orange' },
  { value: '#d32f2f', label: 'Rot' },
  { value: '#7b1fa2', label: 'Lila' },
  { value: '#00796b', label: 'Türkis' },
  { value: '#5d4037', label: 'Braun' },
  { value: '#455a64', label: 'Grau' },
  { value: '#e91e63', label: 'Pink' },
  { value: '#795548', label: 'Beige' },
];

export function StaffGroupDialog({ open, onClose, group, staff }: StaffGroupDialogProps) {
  const [formData, setFormData] = useState<StaffGroupData>({
    name: '',
    description: '',
    color: '#1976d2',
    members: [],
    permissions: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createGroupMutation = useMutation({
    mutationFn: (groupData: StaffGroupData & { companyId?: string }) =>
      staffGroupService.create(groupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffGroups'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Gruppe erfolgreich erstellt!');
      handleClose();
    },
    onError: (error: unknown) => {
      toast.error(
        'Fehler beim Erstellen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler')
      );
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffGroupData> }) =>
      staffGroupService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffGroups'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Gruppe erfolgreich aktualisiert!');
      handleClose();
    },
    onError: (error: unknown) => {
      toast.error(
        'Fehler beim Aktualisieren: ' +
          (error instanceof Error ? error.message : 'Unbekannter Fehler')
      );
    },
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: (group as unknown as { description?: string }).description || '',
        color: group.color,
        members: (group as unknown as { members?: string[] }).members || [],
        permissions: (group as unknown as { permissions?: string[] }).permissions || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#1976d2',
        members: [],
        permissions: [],
      });
    }
  }, [group]);

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: '#1976d2',
      members: [],
      permissions: [],
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (group) {
        await updateGroupMutation.mutateAsync({
          id: group.id,
          data: formData,
        });
      } else {
        // companyId für Mandantenisolation der Gruppe persistieren
        await createGroupMutation.mutateAsync({ ...formData, companyId: user?.companyId });
      }
    } catch (error) {
      logger.error('Error saving group:', error);
      toast.error('Fehler beim Speichern der Gruppe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMembers = staff.filter(user => formData.members.includes(user.id));

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { backgroundColor: 'background.paper' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>{group ? <Edit /> : <Add />}</Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {group ? 'Gruppe bearbeiten' : 'Neue Gruppe erstellen'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {group
                ? 'Bearbeite die Gruppeneinstellungen'
                : 'Erstelle eine neue Mitarbeitergruppe'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} aria-label="Schließen" sx={{ ml: 'auto' }} disabled={isSubmitting}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Gruppenname"
                value={formData.name}
                onChange={e =>
                  setFormData((prev: StaffGroupData) => ({ ...prev, name: e.target.value }))
                }
                required
                InputProps={{
                  startAdornment: <Group sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Farbe</InputLabel>
                <Select
                  value={formData.color}
                  label="Farbe"
                  onChange={e =>
                    setFormData((prev: StaffGroupData) => ({ ...prev, color: e.target.value }))
                  }
                  disabled={isSubmitting}
                >
                  {GROUP_COLORS.map(color => (
                    <MenuItem key={color.value} value={color.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: color.value,
                            borderRadius: '50%',
                            border: '1px solid rgba(0,0,0,0.2)',
                          }}
                        />
                        {color.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Beschreibung"
                value={formData.description}
                onChange={e =>
                  setFormData((prev: StaffGroupData) => ({ ...prev, description: e.target.value }))
                }
                multiline
                rows={3}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Gruppenmitglieder
              </Typography>

              <Autocomplete
                multiple
                options={staff}
                getOptionLabel={option => option.displayName}
                value={selectedMembers}
                onChange={(_, newValue) => {
                  setFormData((prev: StaffGroupData) => ({
                    ...prev,
                    members: newValue.map((user: User) => user.id),
                  }));
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Mitarbeiter auswählen"
                    placeholder="Mitarbeiter zur Gruppe hinzufügen..."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.displayName}
                      avatar={
                        <Avatar sx={{ width: 24, height: 24, bgcolor: formData.color }}>
                          {option.displayName.charAt(0)}
                        </Avatar>
                      }
                    />
                  ))
                }
                disabled={isSubmitting}
              />
            </Grid>

            {selectedMembers.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Ausgewählte Mitglieder ({selectedMembers.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedMembers.map(member => (
                    <Chip
                      key={member.id}
                      label={member.displayName}
                      avatar={
                        <Avatar sx={{ width: 24, height: 24, bgcolor: formData.color }}>
                          {member.displayName.charAt(0)}
                        </Avatar>
                      }
                      onDelete={() => {
                        setFormData(prev => ({
                          ...prev,
                          members: (prev as unknown as { members: string[] }).members.filter(
                            (id: string) => id !== member.id
                          ),
                        }));
                      }}
                      disabled={isSubmitting}
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} disabled={isSubmitting} sx={{ mr: 1 }}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !formData.name}
            startIcon={isSubmitting ? <LoadingSpinner size={20} /> : group ? <Edit /> : <Add />}
          >
            {isSubmitting
              ? group
                ? 'Speichere...'
                : 'Erstelle...'
              : group
                ? 'Gruppe aktualisieren'
                : 'Gruppe erstellen'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
