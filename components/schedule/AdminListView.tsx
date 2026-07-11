'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { ShiftManagementCard } from '@/components/admin/ShiftManagementCard';
import { semanticColors } from '@/lib/design-tokens';
import { Shift } from '@/lib/types';
import { assignmentService } from '@/lib/services';
import {
  CalendarMonth,
  CheckCircle,
  Edit,
  Error,
  LocationOn,
  MoreVert,
  PersonAdd,
  Warning,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import {
  getShiftDisplayStatus,
  getShiftStatusLabel,
  type ShiftDisplayStatus,
} from '@/lib/utils/shiftStatus';

function FormStatusBadge({ shiftId }: { shiftId: string }) {
  const [counts, setCounts] = useState<{ ack: number; dec: number; open: number } | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const assignments = await assignmentService.getByShiftId(shiftId);
        if (!mounted) return;
        type AssignmentLite = { formStatus?: 'acknowledged' | 'declined' };
        const ack = assignments.filter(
          a => (a as unknown as AssignmentLite).formStatus === 'acknowledged'
        ).length;
        const dec = assignments.filter(
          a => (a as unknown as AssignmentLite).formStatus === 'declined'
        ).length;
        const total = assignments.length;
        const open = Math.max(0, total - ack - dec);
        setCounts({ ack, dec, open });
      } catch (_e) {
        setCounts({ ack: 0, dec: 0, open: 0 });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [shiftId]);

  if (!counts) return null;
  const { ack, dec, open } = counts;
  const label = `Formular: ${ack}✓ / ${dec}✕ / ${open} offen`;
  let color: 'default' | 'success' | 'warning' | 'error' = 'default';
  if (open > 0) color = 'warning';
  if (dec > 0) color = 'error';
  if (open === 0 && dec === 0 && ack > 0) color = 'success';
  return <Chip size="small" label={label} color={color} variant="outlined" />;
}

function CompletedBadge({ shiftId }: { shiftId: string }) {
  const [completed, setCompleted] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const assignments = await assignmentService.getByShiftId(shiftId);
        if (!mounted) return;
        if (assignments.length === 0) {
          setCompleted(false);
          return;
        }
        const allCompleted = assignments.every((a: unknown) => {
          const x = a as { status?: string; finalSummarySignedAt?: Date | string };
          return x.status === 'completed' && !!x.finalSummarySignedAt;
        });
        setCompleted(allCompleted);
      } catch {
        setCompleted(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [shiftId]);
  if (!completed) return null;
  return (
    <Chip
      size="small"
      color="success"
      label="Abgeschlossen"
      icon={<CheckCircle sx={{ color: 'inherit' }} />}
    />
  );
}

interface AdminListViewProps {
  shifts: Shift[];
  onShiftClick: (shift: Shift) => void;
  onEdit: (shift: Shift) => void;
  onAssign: (shift: Shift) => void;
  onDelete: (shift: Shift) => void;
}

export function AdminListView({
  shifts,
  onShiftClick: _onShiftClick,
  onEdit,
  onAssign,
  onDelete,
}: AdminListViewProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(() => Math.min(shifts.length, 200));
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(shifts.length, prev + 200));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, shift: Shift) => {
    setAnchorEl(event.currentTarget);
    setSelectedShift(shift);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedShift(null);
  };

  const handleAction = (action: (shift: Shift) => void) => {
    if (selectedShift) {
      action(selectedShift);
    }
    handleMenuClose();
  };

  const getStatusColor = (displayStatus: ShiftDisplayStatus) => {
    switch (displayStatus) {
      case 'open':
        return 'warning';
      case 'filled':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'ended':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (displayStatus: ShiftDisplayStatus) => {
    switch (displayStatus) {
      case 'open':
        return <Warning color="warning" />;
      case 'filled':
        return <CheckCircle color="success" />;
      case 'cancelled':
        return <Error color="error" />;
      case 'ended':
        return <CheckCircle color="action" />;
      default:
        return <AssignmentIcon />;
    }
  };

  const _getCapacityColor = (assigned: number, capacity: number) => {
    const percentage = (assigned / capacity) * 100;
    if (percentage >= 80) return semanticColors.success.main;
    if (percentage >= 50) return semanticColors.warning.main;
    return semanticColors.error.main;
  };

  if (shifts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Keine Schichten vorhanden
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Erstellen Sie die erste Schicht, um zu beginnen.
        </Typography>
      </Box>
    );
  }

  if (isMobile) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <GlassCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
                    {shifts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gesamt Schichten
                  </Typography>
                </CardContent>
              </GlassCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <GlassCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="warning.main" sx={{ fontWeight: 600 }}>
                    {shifts.filter(s => getShiftDisplayStatus(s) === 'open').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Offene Schichten
                  </Typography>
                </CardContent>
              </GlassCard>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={2}>
          {shifts.slice(0, visibleCount).map(shift => (
            <Grid key={shift.id} size={{ xs: 12 }}>
              <ShiftManagementCard
                shift={shift}
                onEdit={onEdit}
                onAssign={onAssign}
                onDelete={onDelete}
              />
            </Grid>
          ))}
        </Grid>

        {shifts.length > visibleCount && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button variant="outlined" onClick={handleLoadMore}>
              Weitere laden ({Math.min(200, shifts.length - visibleCount)})
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <GlassCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {shifts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gesamt Schichten
                </Typography>
              </CardContent>
            </GlassCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <GlassCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                  {shifts.filter(s => getShiftDisplayStatus(s) === 'open').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Offene Schichten
                </Typography>
              </CardContent>
            </GlassCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <GlassCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                  {shifts.filter(s => getShiftDisplayStatus(s) === 'filled').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Besetzte Schichten
                </Typography>
              </CardContent>
            </GlassCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <GlassCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                  {shifts.reduce((sum, s) => sum + (s.assignedCount || 0), 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zugewiesene Mitarbeiter
                </Typography>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>
      </Box>

      {/* Shifts Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'var(--color-border-strong)',
            borderRadius: '4px',
          },
        }}
      >
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Schicht</TableCell>
              <TableCell>Datum & Zeit</TableCell>
              <TableCell>Einrichtung</TableCell>
              <TableCell>Besetzung</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Qualifikationen</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.slice(0, visibleCount).map(shift => {
              const availableSlots = shift.capacity - (shift.assignedCount || 0);
              const isFullyAssigned = availableSlots === 0;
              const isOverAssigned = availableSlots < 0;
              const occupancyRate = ((shift.assignedCount || 0) / shift.capacity) * 100;

              return (
                <TableRow key={shift.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Schicht
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {shift.id.slice(0, 8)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2">
                          {format(shift.date, 'dd.MM.yyyy', { locale: de })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {shift.startTime} - {shift.endTime}
                        </Typography>
                      </Box>
                      <FormStatusBadge shiftId={shift.id} />
                      <CompletedBadge shiftId={shift.id} />
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2">Station {shift.stationId}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Einrichtung {shift.facilityId}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                          {shift.assignedCount || 0}/{shift.capacity}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {isFullyAssigned
                            ? 'Voll'
                            : isOverAssigned
                              ? 'Überbelegt'
                              : `${availableSlots} frei`}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(occupancyRate, 100)}
                        color={isOverAssigned ? 'error' : isFullyAssigned ? 'success' : 'primary'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      icon={getStatusIcon(getShiftDisplayStatus(shift))}
                      label={getShiftStatusLabel(getShiftDisplayStatus(shift))}
                      color={
                        getStatusColor(getShiftDisplayStatus(shift)) as
                          | 'default'
                          | 'primary'
                          | 'secondary'
                          | 'error'
                          | 'info'
                          | 'success'
                          | 'warning'
                      }
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
                      {shift.requiredQualifications?.slice(0, 2).map((qual, index) => (
                        <Chip
                          key={index}
                          label={qual}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                      {shift.requiredQualifications && shift.requiredQualifications.length > 2 && (
                        <Chip
                          key={`${shift.id}-more`}
                          label={`+${shift.requiredQualifications.length - 2}`}
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Bearbeiten">
                        <IconButton size="small" onClick={() => onEdit(shift)} color="primary">
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Zuweisen">
                        <IconButton
                          size="small"
                          onClick={() => onAssign(shift)}
                          color="success"
                          disabled={isFullyAssigned}
                        >
                          <PersonAdd />
                        </IconButton>
                      </Tooltip>

                      <IconButton size="small" onClick={e => handleMenuOpen(e, shift)}>
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {shifts.length > visibleCount && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={handleLoadMore}>
            Weitere laden ({Math.min(200, shifts.length - visibleCount)})
          </Button>
        </Box>
      )}

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleAction(onEdit)}>
          <Edit sx={{ mr: 1 }} />
          Bearbeiten
        </MenuItem>
        <MenuItem
          onClick={() => handleAction(onAssign)}
          disabled={
            selectedShift ? selectedShift.capacity - (selectedShift.assignedCount || 0) <= 0 : false
          }
        >
          <PersonAdd sx={{ mr: 1 }} />
          Zuweisen
        </MenuItem>
        <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
          <Error sx={{ mr: 1 }} />
          Löschen
        </MenuItem>
      </Menu>
    </Box>
  );
}
