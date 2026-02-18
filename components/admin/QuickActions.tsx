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
  Typography,
  useTheme,
  alpha,
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
import { radius, duration, easing } from '@/lib/design-tokens';

interface QuickActionsProps {
  onCreateShift?: () => void;
  onAddStaff?: () => void;
  onExportReport?: () => void;
  onOpenSettings?: () => void;
}

const chipTransition = `all ${duration.base}ms ${easing}`;

export function QuickActions({
  onCreateShift,
  onAddStaff,
  onExportReport,
  onOpenSettings,
}: QuickActionsProps) {
  const theme = useTheme();
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

  const primaryGradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark ?? theme.palette.primary.main} 100%)`;

  const menuPaperSx = {
    minWidth: 200,
    mt: 1,
    borderRadius: radius.lg,
    boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid rgba(0,95,115,0.08)',
    backdropFilter: 'blur(20px) saturate(180%)',
  };

  return (
    <GlassCard sx={{ p: 0, borderRadius: radius.md }} hover={false}>
      {/* Sektions-Header – ausreichend Abstand zu den Ecken, damit nichts abgeschnitten wird */}
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 0,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'text.secondary',
          }}
        >
          Schnellaktionen
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={{ xs: 2, lg: 3 }}
        sx={{
          p: 3,
          pt: 2,
          flexWrap: 'wrap',
          alignItems: { xs: 'stretch', lg: 'center' },
          gap: 1,
        }}
      >
        {/* Primäre Aktionen */}
        <Stack
          key="primary-actions"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ width: { xs: '100%', lg: 'auto' }, minWidth: 0 }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateShift}
            aria-label="Dienst anlegen"
            sx={{
              borderRadius: radius.md,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              fontSize: '0.9375rem',
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 160 },
              background: primaryGradient,
              boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
              '&:hover': {
                background: primaryGradient,
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.45)}`,
                filter: 'brightness(1.05)',
              },
            }}
          >
            Dienst anlegen
          </Button>

          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={onAddStaff}
            aria-label="Mitarbeiter hinzufügen"
            sx={{
              borderRadius: radius.md,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              fontSize: '0.9375rem',
              borderWidth: 1.5,
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 180 },
              '&:hover': {
                borderWidth: 1.5,
                borderColor: 'primary.main',
                color: 'primary.main',
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
              },
            }}
          >
            Mitarbeiter hinzufügen
          </Button>
        </Stack>

        {/* Sekundäre Aktionen (Export, Menü) + Quick-Links als eine Gruppe */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            ml: { lg: 'auto' },
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Tooltip title="Bericht exportieren">
              <IconButton
                onClick={onExportReport}
                aria-label="Bericht exportieren"
                size="medium"
                sx={{
                  width: 40,
                  height: 40,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  borderRadius: radius.md,
                  backgroundColor: 'action.hover',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  },
                  transition: chipTransition,
                }}
              >
                <ExportIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Weitere Aktionen">
              <IconButton
                onClick={handleClick}
                aria-label="Weitere Aktionen"
                size="medium"
                sx={{
                  width: 40,
                  height: 40,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  borderRadius: radius.md,
                  backgroundColor: 'action.hover',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  },
                  transition: chipTransition,
                }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Box component={Link} href="/admin/schichten" sx={{ textDecoration: 'none' }}>
              <Chip
                icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
                label="Dienstplan"
                variant="outlined"
                clickable
                sx={{
                  borderWidth: 1.5,
                  borderRadius: radius.md,
                  fontWeight: 500,
                  py: 1.25,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  },
                  transition: chipTransition,
                }}
              />
            </Box>
            <Box component={Link} href="/admin/einstellungen" sx={{ textDecoration: 'none' }}>
              <Chip
                icon={<SettingsIcon sx={{ fontSize: 18 }} />}
                label="Einstellungen"
                variant="outlined"
                clickable
                sx={{
                  borderWidth: 1.5,
                  borderRadius: radius.md,
                  fontWeight: 500,
                  py: 1.25,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  },
                  transition: chipTransition,
                }}
              />
            </Box>
          </Stack>
        </Stack>
      </Stack>

      {/* More Actions Menu */}
        <Menu
          key="more-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{ sx: menuPaperSx }}
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
