'use client';

import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  FileDownload as ExportIcon,
  MoreVert as MoreIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { radius } from '@/lib/design-tokens';

interface QuickActionsProps {
  onCreateShift?: () => void;
  onAddStaff?: () => void;
  onExportReport?: () => void;
  onOpenSettings?: () => void;
}

export function QuickActions({
  onCreateShift,
  onAddStaff,
  onExportReport,
  onOpenSettings,
}: QuickActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    event.currentTarget.blur();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleClose();
  };

  return (
    <GlassCard sx={{ p: 0 }} hover={false}>
      <Box sx={{ px: 3, pt: 2.5, pb: 0 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Schnellaktionen
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ p: 3, pt: 1.5, alignItems: { xs: 'stretch', md: 'center' } }}
      >
        {/* Eine Primäraktion, eine Sekundäraktion */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateShift}>
            Dienst anlegen
          </Button>
          <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={onAddStaff}>
            Mitarbeiter hinzufügen
          </Button>
        </Stack>

        {/* Sekundäre Aktionen: Quick-Links + Export + Mehr */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ ml: { md: 'auto' }, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Button
            component={Link}
            href="/admin/schichten"
            variant="text"
            startIcon={<ScheduleIcon />}
            sx={{ color: 'text.secondary' }}
          >
            Dienstplan
          </Button>
          <Button
            component={Link}
            href="/admin/einstellungen"
            variant="text"
            startIcon={<SettingsIcon />}
            sx={{ color: 'text.secondary' }}
          >
            Einstellungen
          </Button>
          <Tooltip title="Bericht exportieren">
            <IconButton
              onClick={onExportReport}
              aria-label="Bericht exportieren"
              sx={{ width: 44, height: 44, color: 'text.secondary' }}
            >
              <ExportIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Weitere Aktionen">
            <IconButton
              onClick={handleClick}
              aria-label="Weitere Aktionen"
              sx={{ width: 44, height: 44, color: 'text.secondary' }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* More Actions Menu */}
      <Menu
        key="more-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { minWidth: 200, mt: 1, borderRadius: `${radius.md}px` } }}
      >
        <MenuItem onClick={() => handleAction(() => onCreateShift?.())}>
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="Neue Schicht" />
        </MenuItem>

        <MenuItem onClick={() => handleAction(() => onAddStaff?.())}>
          <ListItemIcon>
            <PersonAddIcon />
          </ListItemIcon>
          <ListItemText primary="Mitarbeiter hinzufügen" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleAction(() => onExportReport?.())}>
          <ListItemIcon>
            <ExportIcon />
          </ListItemIcon>
          <ListItemText primary="Bericht exportieren" />
        </MenuItem>

        <MenuItem onClick={() => handleAction(() => onOpenSettings?.())}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Einstellungen" />
        </MenuItem>

        <Divider />

        <Link href="/admin/schichten" style={{ textDecoration: 'none', color: 'inherit' }}>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <ScheduleIcon />
            </ListItemIcon>
            <ListItemText primary="Dienstplan verwalten" />
          </MenuItem>
        </Link>
      </Menu>
    </GlassCard>
  );
}
