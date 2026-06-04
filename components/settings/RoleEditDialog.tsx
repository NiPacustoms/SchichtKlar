'use client';

import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { Role } from '@/lib/hooks/useAdminSettings';
import { PERMISSION_OPTIONS, PERMISSION_GROUPS } from '@/lib/constants/permissions';

interface RoleEditDialogProps {
  open: boolean;
  onClose: () => void;
  selectedRole: Role | null;
  name: string;
  description: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'pending';
  onChangeName: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onTogglePermission: (key: string) => void;
  onChangeStatus: (v: 'active' | 'inactive' | 'pending') => void;
  onSubmit: () => void;
  isCreating: boolean;
  isUpdating: boolean;
}

export function RoleEditDialog({
  open,
  onClose,
  selectedRole,
  name,
  description,
  permissions,
  status,
  onChangeName,
  onChangeDescription,
  onTogglePermission,
  onChangeStatus,
  onSubmit,
  isCreating,
  isUpdating,
}: RoleEditDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{selectedRole ? 'Rolle bearbeiten' : 'Neue Rolle erstellen'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Rollen-Name"
              placeholder="z.B. Teamleiter, Personalplaner"
              value={name}
              onChange={e => onChangeName(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Beschreibung"
              multiline
              rows={2}
              placeholder="Kurze Beschreibung der Rolle und ihrer Aufgaben..."
              value={description}
              onChange={e => onChangeDescription(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={status}
                onChange={e => onChangeStatus(e.target.value as 'active' | 'inactive' | 'pending')}
              >
                <MenuItem value="active">Aktiv</MenuItem>
                <MenuItem value="inactive">Inaktiv</MenuItem>
                <MenuItem value="pending">Ausstehend</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Berechtigungen
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Wählen Sie die Aktionen aus, die diese Rolle ausführen darf.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {PERMISSION_GROUPS.map(group => (
                <Card key={group} variant="outlined" sx={{ p: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                  >
                    {group}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {PERMISSION_OPTIONS.filter(p => p.group === group).map(opt => (
                      <FormControlLabel
                        key={opt.key}
                        control={
                          <Checkbox
                            checked={permissions.includes(opt.key)}
                            onChange={() => onTogglePermission(opt.key)}
                            size="small"
                          />
                        }
                        label={opt.label}
                        sx={{ mr: 2 }}
                      />
                    ))}
                  </Box>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={onSubmit} variant="contained" disabled={isCreating || isUpdating}>
          {isCreating || isUpdating ? 'Speichere...' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
