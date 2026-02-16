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
  Chip,
  Stack,
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
    // Entfernt den Fokus vom Auslöser, bevor aria-hidden auf Vorfahren gesetzt wird
    // Verhindert Warnung: "Blocked aria-hidden on an element because its descendant retained focus"
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
    <GlassCard sx={{ p: 0 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2}
        sx={{
          p: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Primary Actions */}
        <Stack
          key="primary-actions"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ width: { xs: '100%', lg: 'auto' } }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateShift}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.25,
              fontSize: '15px',
              width: { xs: '100%', sm: 'auto' },
              boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            Dienst anlegen
          </Button>

          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={onAddStaff}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.25,
              fontSize: '15px',
              borderWidth: 1.5,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Mitarbeiter hinzufügen
          </Button>
        </Stack>

        {/* Secondary Actions */}
        <Stack
          key="secondary-actions"
          direction="row"
          spacing={1}
          sx={{ alignSelf: { xs: 'flex-start', lg: 'center' } }}
        >
          <Tooltip title="Bericht exportieren">
            <IconButton
              onClick={onExportReport}
              sx={{
                border: '1.5px solid',
                borderColor: 'divider',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
              }}
            >
              <ExportIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Weitere Aktionen">
            <IconButton
              onClick={handleClick}
              sx={{
                border: '1.5px solid',
                borderColor: 'divider',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
              }}
            >
              <MoreIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Quick Links */}
        <Stack
          key="quick-links"
          direction="row"
          spacing={1}
          sx={{
            ml: { lg: 'auto' },
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Box
            key="quick-link-schichten"
            component={Link}
            href="/admin/schichten"
            sx={{
              textDecoration: 'none',
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Chip
              icon={<ScheduleIcon />}
              label="Dienstplan"
              variant="outlined"
              sx={{
                borderWidth: 1.5,
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
                width: '100%',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </Box>

          <Box
            key="quick-link-einstellungen"
            component={Link}
            href="/admin/einstellungen"
            sx={{
              textDecoration: 'none',
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Chip
              icon={<SettingsIcon />}
              label="Einstellungen"
              variant="outlined"
              sx={{
                '&:hover': { backgroundColor: 'action.hover' },
                width: '100%',
                cursor: 'pointer',
              }}
            />
          </Box>
        </Stack>

        {/* More Actions Menu */}
        <Menu
          key="more-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              minWidth: 200,
              mt: 1,
              borderRadius: 2,
              boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,95,115,0.08)',
              backdropFilter: 'blur(20px) saturate(180%)',
            },
          }}
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
      </Stack>
    </GlassCard>
  );
}
