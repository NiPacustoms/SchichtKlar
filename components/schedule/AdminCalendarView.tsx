'use client';

import { Shift } from '@/lib/types';
import { assignmentService } from '@/lib/services';
import { DEFAULT_SHIFT_COLOR } from '@/lib/constants/colorPresets';
import { useShiftEnrichment } from '@/lib/hooks/useShiftEnrichment';
import { Add, ArrowBack, ArrowForward, Event, MoreVert } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  type ChipProps,
} from '@mui/material';
import {
  addMonths,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  parseISO,
  isValid,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { isShiftEnded } from '@/lib/utils/shiftStatus';
import { alpha } from '@mui/material/styles';

function FormStatusChip({ shiftId }: { shiftId: string }) {
  const [label, setLabel] = useState<string | null>(null);
  const [color, setColor] = useState<'default' | 'success' | 'warning' | 'error'>('default');
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
        const text = `${ack}✓/${dec}✕/${open}`;
        let c: typeof color = 'default';
        if (open > 0) c = 'warning';
        if (dec > 0) c = 'error';
        if (open === 0 && dec === 0 && ack > 0) c = 'success';
        setLabel(text);
        setColor(c);
      } catch {
        if (!mounted) return;
        setLabel(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [shiftId]);
  if (!label) return null;
  return <Chip size="small" label={label} color={color as ChipProps['color']} variant="outlined" />;
}

function CompletedChip({ shiftId }: { shiftId: string }) {
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
        type AssignmentLite2 = { status: string; finalSummarySignedAt?: Date | string };
        setCompleted(
          assignments.every((a: unknown) => {
            const x = a as AssignmentLite2;
            return x.status === 'completed' && !!x.finalSummarySignedAt;
          })
        );
      } catch {
        setCompleted(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [shiftId]);
  if (!completed) return null;
  return <Chip size="small" color="success" label="Abgeschlossen" />;
}

interface AdminCalendarViewProps {
  shifts: Shift[];
  /** Wird an useShiftEnrichment übergeben, damit Einrichtungs- und Mitarbeiternamen geladen werden */
  companyId?: string;
  onShiftClick?: (shift: Shift) => void;
  onEdit?: (shift: Shift) => void;
  onAssign?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
  onDayClick?: (date: Date) => void;
  onDayLongPress?: (date: Date) => void;
}

export default function AdminCalendarView({
  shifts,
  companyId: companyIdProp,
  onShiftClick,
  onEdit,
  onAssign,
  onDelete,
  onDayClick,
  onDayLongPress: _onDayLongPress,
}: AdminCalendarViewProps) {
  // Deterministische Farbzuteilung pro Mitarbeiter (aus userId)
  const getColorForUser = (userId: string): string => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 65% 50%)`;
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), {
    noSsr: true,
  });
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week'>('month');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuShift, setMenuShift] = useState<Shift | null>(null);
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<Date | null>(null);

  const currentWeekStart = useMemo(
    () => startOfWeek(currentMonth, { weekStartsOn: 1 }),
    [currentMonth]
  );

  const handlePrev = () =>
    setCurrentMonth(prev =>
      calendarViewMode === 'week' ? subWeeks(prev, 1) : addMonths(prev, -1)
    );
  const handleNext = () =>
    setCurrentMonth(prev =>
      calendarViewMode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)
    );

  const monthInterval = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekInterval = useMemo(() => {
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end });
  }, [currentWeekStart]);

  const daysByDate = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    for (const shift of shifts) {
      // tolerant parsing; support string/Date - verwende shift.date statt shift.start
      const rawDate = shift.date as unknown;
      const date = typeof rawDate === 'string' ? parseISO(rawDate) : (rawDate as Date | undefined);
      if (!date || !isValid(date)) continue;
      const key = format(date, 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(shift);
    }
    return map;
  }, [shifts]);

  // Gruppiere Schichten nach shiftGroupId für visuelle Kennzeichnung
  const shiftGroups = useMemo(() => {
    const groups: Record<string, Shift[]> = {};
    for (const shift of shifts) {
      const groupId = (shift as unknown as { shiftGroupId?: string }).shiftGroupId;
      if (groupId) {
        if (!groups[groupId]) groups[groupId] = [];
        groups[groupId].push(shift);
      }
    }
    return groups;
  }, [shifts]);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, shift: Shift) => {
    setMenuAnchor(event.currentTarget);
    setMenuShift(shift);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuShift(null);
  };

  const weekDayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const { enrichment, isLoading: enrichmentLoading } = useShiftEnrichment(shifts, companyIdProp);

  if (isMobile) {
    const mobileDaysToShow =
      calendarViewMode === 'week'
        ? weekInterval
        : monthInterval.filter(day => (daysByDate[format(day, 'yyyy-MM-dd')] || []).length > 0);

    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              onClick={handlePrev}
              aria-label="Vorheriger Monat"
              size="large"
              sx={{ touchAction: 'manipulation' }}
            >
              <ArrowBack />
            </IconButton>
            <IconButton
              onClick={handleNext}
              aria-label="Nächster Monat"
              size="large"
              sx={{ touchAction: 'manipulation' }}
            >
              <ArrowForward />
            </IconButton>
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 600 }} align="center">
            {calendarViewMode === 'week' && weekInterval.length === 7
              ? `${format(weekInterval[0], 'd.', { locale: de })}–${format(weekInterval[6], 'd. MMM yyyy', { locale: de })}`
              : format(currentMonth, 'LLLL yyyy', { locale: de })}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Tippe auf einen Tag für Details
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1.5 }}>
          <ToggleButtonGroup
            value={calendarViewMode}
            exclusive
            onChange={(_, v) => v && setCalendarViewMode(v)}
            size="small"
          >
            <ToggleButton value="month" aria-label="Monat">Monat</ToggleButton>
            <ToggleButton value="week" aria-label="Woche">Woche</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {mobileDaysToShow.length === 0 ? (
          <Paper className="glass" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {calendarViewMode === 'week'
                ? 'In dieser Woche sind keine Schichten geplant.'
                : 'Für diesen Monat sind keine Schichten geplant.'}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2} sx={{ pb: 1 }}>
            {mobileDaysToShow.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayShifts = daysByDate[key] || [];
              const today = isToday(day);

              return (
                <Paper key={key} className="glass" sx={{ p: 2 }} onClick={() => onDayClick?.(day)}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600 }}
                      color={today ? 'primary.main' : 'text.primary'}
                    >
                      {format(day, 'EEEE, d. MMM', { locale: de })}
                    </Typography>
                    {today && (
                      <Chip size="small" color="primary" label="Heute" variant="outlined" />
                    )}
                  </Box>

                  <Stack
                    spacing={1}
                    sx={{
                      maxHeight: 320,
                      overflowX: 'hidden',
                      overflowY: 'auto',
                    }}
                  >
                    {dayShifts.map(shift => {
                      type ShiftLike3 = Shift & {
                        id: string;
                        startTime?: string;
                        endTime?: string;
                        title?: string;
                        facility?: { name?: string };
                        assignedTo?: string[];
                        surchargeNight?: boolean;
                        surchargeWeekend?: boolean;
                        surchargeHoliday?: boolean;
                        surchargeOnCall?: boolean;
                        color?: string;
                        shiftGroupId?: string;
                      };
                      const s = shift as unknown as ShiftLike3;
                      const time =
                        s.startTime && s.endTime ? `${s.startTime}–${s.endTime}` : undefined;
                      const assignedTo: string[] = (s.assignedTo || []) as string[];
                      const shiftColor = s.color || DEFAULT_SHIFT_COLOR;
                      const isPartOfGroup = !!s.shiftGroupId;
                      const groupShifts = s.shiftGroupId ? shiftGroups[s.shiftGroupId] || [] : [];
                      const groupSize = groupShifts.length;
                      const en = enrichment[s.id];
                      const facilityLabel = enrichmentLoading
                        ? '…'
                        : (en?.facilityName ?? s.facility?.name ?? (s.facilityId ? 'Einrichtung' : 'Schicht'));
                      const stationLabel = en?.stationName;
                      const whereLabel = stationLabel ? `${facilityLabel} · ${stationLabel}` : facilityLabel;
                      const namesLabel = en?.assigneeNames?.length
                        ? en.assigneeNames.join(', ')
                        : enrichmentLoading
                          ? '…'
                          : null;

                      return (
                        <Box
                          key={s.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            p: 1.25,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            borderLeft: `4px solid ${shiftColor}`,
                          }}
                          onClick={event => {
                            event.stopPropagation();
                            onShiftClick?.(shift);
                          }}
                        >
                          <Event fontSize="small" sx={{ mt: 0.25 }} />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} component="span">
                                {whereLabel}
                              </Typography>
                              {isPartOfGroup && groupSize > 1 && (
                                <Chip
                                  size="small"
                                  label={`${groupSize} Tage`}
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    bgcolor: shiftColor,
                                    color: 'white',
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              )}
                            </Box>
                            {namesLabel && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                {namesLabel}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" display="block">
                              {time || 'Zeit wird festgelegt'}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mt: 0.5,
                                flexWrap: 'wrap',
                              }}
                            >
                              {isShiftEnded(s) ? (
                                <Chip size="small" color="default" variant="outlined" label="Beendet" />
                              ) : (
                                <>
                                  <FormStatusChip shiftId={s.id} />
                                  <CompletedChip shiftId={s.id} />
                                </>
                              )}
                              {assignedTo?.length > 0 && !namesLabel && (
                                <Box sx={{ display: 'flex', gap: 0.5, ml: 0.5 }}>
                                  {assignedTo.slice(0, 3).map(uid => (
                                    <Box
                                      key={uid}
                                      sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: getColorForUser(uid),
                                        border: '1px solid rgba(0,0,0,0.15)',
                                      }}
                                    />
                                  ))}
                                  {assignedTo.length > 3 && (
                                    <Typography variant="caption" color="text.secondary">
                                      +{assignedTo.length - 3}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            edge="end"
                            aria-label="Weitere Optionen"
                            onClick={event => {
                              event.stopPropagation();
                              handleOpenMenu(event, shift);
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
          <MenuItem
            onClick={() => {
              if (menuShift) onEdit?.(menuShift);
              handleCloseMenu();
            }}
          >
            Bearbeiten
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuShift) onAssign?.(menuShift);
              handleCloseMenu();
            }}
          >
            Zuweisen
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuShift) onDelete?.(menuShift);
              handleCloseMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            Löschen
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  const calendarTitle =
    calendarViewMode === 'week' && weekInterval.length === 7
      ? isSameMonth(weekInterval[0], weekInterval[6])
        ? `${format(weekInterval[0], 'd.', { locale: de })}–${format(weekInterval[6], 'd. MMMM yyyy', { locale: de })}`
        : `${format(weekInterval[0], 'd. MMM', { locale: de })} – ${format(weekInterval[6], 'd. MMM yyyy', { locale: de })}`
      : format(currentMonth, 'LLLL yyyy', { locale: de });

  // ——— Desktop: echter Kalender (eine Fläche, Haarlinien, lesbare Einträge) ———
  const MAX_PER_CELL = 4;

  const entryFor = (shift: Shift) => {
    type ShiftLike = Shift & { startTime?: string; endTime?: string; status?: string; assignedCount?: number; capacity?: number };
    const s = shift as unknown as ShiftLike;
    const en = enrichment[s.id];
    const names = en?.assigneeNames ?? [];
    const capacity = s.capacity ?? 1;
    const filled = Math.max(names.length, s.assignedCount ?? 0);
    const open = !isShiftEnded(s) && s.status !== 'cancelled' && filled < capacity;
    return {
      id: s.id,
      time: s.startTime ?? '',
      timeRange: s.startTime && s.endTime ? `${s.startTime}–${s.endTime}` : '',
      facility: enrichmentLoading ? '…' : (en?.facilityName ?? 'Einrichtung'),
      color: en?.facilityColor || s.color || DEFAULT_SHIFT_COLOR,
      who: names.length ? names.join(', ') : open ? 'Offen' : '—',
      open,
      ended: isShiftEnded(s),
      cancelled: s.status === 'cancelled',
    };
  };

  const sortByTime = (list: Shift[]) =>
    [...list].sort((a, b) =>
      String((a as unknown as { startTime?: string }).startTime ?? '').localeCompare(
        String((b as unknown as { startTime?: string }).startTime ?? '')
      )
    );

  const renderEntry = (shift: Shift, dense: boolean) => {
    const e = entryFor(shift);
    return (
      <Tooltip key={e.id} title={`${e.timeRange} · ${e.facility} · ${e.who}`} placement="top" enterDelay={400}>
        <Box
          data-shift-item
          role="button"
          tabIndex={0}
          onClick={ev => {
            ev.stopPropagation();
            onShiftClick?.(shift);
          }}
          onContextMenu={ev => {
            ev.preventDefault();
            handleOpenMenu(ev as unknown as React.MouseEvent<HTMLElement>, shift);
          }}
          onKeyDown={ev => {
            if (ev.key === 'Enter') onShiftClick?.(shift);
          }}
          sx={{
            display: 'flex',
            alignItems: dense ? 'center' : 'flex-start',
            flexDirection: dense ? 'row' : 'column',
            gap: dense ? 0.75 : 0.25,
            px: 0.75,
            py: dense ? 0.25 : 0.75,
            borderRadius: '5px',
            fontSize: 12,
            lineHeight: 1.35,
            cursor: 'pointer',
            minWidth: 0,
            opacity: e.ended || e.cancelled ? 0.55 : 1,
            textDecoration: e.cancelled ? 'line-through' : 'none',
            // offene Schichten: Amber-Rahmen, besetzte: Einrichtungsfarbe als Leiste
            bgcolor: e.open ? alpha(theme.palette.warning.main, 0.08) : alpha(e.color, 0.09),
            boxShadow: e.open
              ? `inset 0 0 0 1px ${alpha(theme.palette.warning.main, 0.45)}`
              : `inset 3px 0 0 ${e.color}`,
            pl: e.open ? 0.75 : 1.1,
            '&:hover': { bgcolor: e.open ? alpha(theme.palette.warning.main, 0.14) : alpha(e.color, 0.16) },
            '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
          }}
        >
          <Box component="span" className="tabular-nums" sx={{ fontWeight: 600, color: 'text.primary', flexShrink: 0 }}>
            {dense ? e.time : e.timeRange}
          </Box>
          <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary', width: dense ? 'auto' : '100%' }}>
            {e.facility}
          </Box>
          {!dense && (
            <Box
              component="span"
              sx={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                color: e.open ? 'warning.dark' : 'text.secondary',
                fontWeight: e.open ? 600 : 400,
              }}
            >
              {e.who}
            </Box>
          )}
        </Box>
      </Tooltip>
    );
  };

  const dayCell = (day: Date, opts: { inMonth: boolean; tall: boolean }) => {
    const key = format(day, 'yyyy-MM-dd');
    const dayShifts = sortByTime(daysByDate[key] || []);
    const today = isToday(day);
    const openCount = dayShifts.filter(s => entryFor(s).open).length;
    const visible = opts.tall ? dayShifts : dayShifts.slice(0, MAX_PER_CELL);
    const hidden = dayShifts.length - visible.length;
    return (
      <Box
        key={key}
        role="gridcell"
        tabIndex={0}
        aria-label={`${format(day, 'EEEE, d. MMMM', { locale: de })}: ${dayShifts.length} Schichten${openCount ? `, ${openCount} offen` : ''}`}
        onClick={e => {
          if ((e.target as HTMLElement).closest('[data-shift-item],[data-add-shift]')) return;
          setSelectedDayForDetail(day);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && e.target === e.currentTarget) setSelectedDayForDetail(day);
        }}
        sx={{
          position: 'relative',
          minWidth: 0,
          minHeight: opts.tall ? 420 : 132,
          p: 0.75,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          bgcolor: opts.inMonth ? 'background.paper' : alpha(theme.palette.text.primary, 0.02),
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          cursor: 'pointer',
          outline: 'none',
          '&:nth-of-type(7n)': { borderRight: 'none' },
          '&:hover [data-add-shift]': { opacity: 1 },
          '&:focus-visible': { boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}` },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 26 }}>
          <Box
            component="span"
            className="tabular-nums"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 24,
              height: 24,
              px: 0.5,
              borderRadius: '12px',
              fontSize: 13,
              fontWeight: today ? 700 : 550,
              color: today ? 'primary.contrastText' : opts.inMonth ? 'text.primary' : 'text.disabled',
              bgcolor: today ? 'primary.main' : 'transparent',
            }}
          >
            {format(day, 'd')}
          </Box>
          {openCount > 0 && (
            <Box component="span" sx={{ fontSize: 11.5, fontWeight: 600, color: 'warning.dark' }}>
              {openCount} offen
            </Box>
          )}
          {onDayClick && (
            <IconButton
              data-add-shift
              size="small"
              aria-label={`Schicht am ${format(day, 'd. MMMM', { locale: de })} anlegen`}
              onClick={event => {
                event.stopPropagation();
                onDayClick?.(day);
              }}
              sx={{ ml: 'auto', width: 24, height: 24, opacity: 0, transition: 'opacity 120ms', '&:focus-visible': { opacity: 1 } }}
            >
              <Add sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
        {visible.map(s => renderEntry(s, !opts.tall))}
        {hidden > 0 && (
          <Box
            component="button"
            type="button"
            data-shift-item
            onClick={e => {
              e.stopPropagation();
              setSelectedDayForDetail(day);
            }}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 550,
              color: 'text.secondary',
              px: 0.75,
              '&:hover': { color: 'text.primary' },
              '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}` },
            }}
          >
            {hidden} weitere
          </Box>
        )}
      </Box>
    );
  };

  const gridDays = calendarViewMode === 'week' ? weekInterval : monthInterval;
  const totalInView = gridDays.reduce((n, d) => n + (daysByDate[format(d, 'yyyy-MM-dd')]?.length ?? 0), 0);
  const openInView = gridDays.reduce(
    (n, d) => n + (daysByDate[format(d, 'yyyy-MM-dd')] ?? []).filter(s => entryFor(s).open).length,
    0
  );

  return (
    <Box>
      {/* Navigation: Zeitraum links, Ansicht rechts */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 650, letterSpacing: '-0.01em', mr: 1, minWidth: 180 }}>
          {calendarTitle}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton
            onClick={handlePrev}
            aria-label={calendarViewMode === 'week' ? 'Vorherige Woche' : 'Vorheriger Monat'}
            size="small"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCurrentMonth(calendarViewMode === 'week' ? new Date() : startOfMonth(new Date()))}
          >
            Heute
          </Button>
          <IconButton
            onClick={handleNext}
            aria-label={calendarViewMode === 'week' ? 'Nächste Woche' : 'Nächster Monat'}
            size="small"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </Stack>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', ml: 1 }}>
          {totalInView} Schichten
          {openInView > 0 && (
            <Box component="span" sx={{ color: 'warning.dark', fontWeight: 600 }}>
              {' '}· {openInView} offen
            </Box>
          )}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <ToggleButtonGroup
          value={calendarViewMode}
          exclusive
          onChange={(_, v) => {
            if (!v) return;
            // Woche: im laufenden Monat auf die aktuelle Woche springen, sonst Monatsanfang
            if (v === 'week') setCurrentMonth(prev => (isSameMonth(prev, new Date()) ? new Date() : prev));
            else setCurrentMonth(prev => startOfMonth(prev));
            setCalendarViewMode(v);
          }}
          size="small"
          aria-label="Kalenderansicht"
        >
          <ToggleButton value="month">Monat</ToggleButton>
          <ToggleButton value="week">Woche</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box
        role="grid"
        aria-label={`Schichtkalender ${calendarTitle}`}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          role="row"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.text.primary, 0.025),
          }}
        >
          {(calendarViewMode === 'week' ? weekInterval : weekInterval).map((d, i) => (
            <Box
              key={i}
              role="columnheader"
              sx={{ px: 1.25, py: 0.9, fontSize: 12.5, fontWeight: 600, color: i >= 5 ? 'text.secondary' : 'text.primary' }}
            >
              {calendarViewMode === 'week'
                ? `${weekDayLabels[i]} ${format(d, 'd.M.', { locale: de })}`
                : weekDayLabels[i]}
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', mb: '-1px' }}>
          {gridDays.map(day =>
            dayCell(day, {
              inMonth: calendarViewMode === 'week' || isSameMonth(day, currentMonth),
              tall: calendarViewMode === 'week',
            })
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2.5, mt: 1.25, fontSize: 12.5, color: 'text.secondary', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
          Besetzt (Farbe = Einrichtung)
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.warning.main, 0.6)}`, bgcolor: alpha(theme.palette.warning.main, 0.08) }} />
          Offen
        </Box>
        <Box>Klick auf einen Tag zeigt alle Schichten · Rechtsklick auf eine Schicht für Aktionen</Box>
      </Box>

      <Dialog
        open={Boolean(selectedDayForDetail)}
        onClose={() => setSelectedDayForDetail(null)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="day-detail-dialog-title"
      >
        {selectedDayForDetail && (() => {
          const key = format(selectedDayForDetail, 'yyyy-MM-dd');
          const dayShiftsList = daysByDate[key] || [];
          return (
            <>
              <DialogTitle id="day-detail-dialog-title">
                Schichten am {format(selectedDayForDetail, 'EEEE, d. MMMM yyyy', { locale: de })}
              </DialogTitle>
              <DialogContent>
                {dayShiftsList.length === 0 ? (
                  <Typography color="text.secondary">An diesem Tag sind keine Schichten geplant.</Typography>
                ) : (
                  <List disablePadding>
                    {dayShiftsList.map(shift => {
                      type ShiftLike = Shift & { startTime?: string; endTime?: string; color?: string };
                      const s = shift as unknown as ShiftLike;
                      const time = s.startTime && s.endTime ? `${s.startTime}–${s.endTime}` : 'Zeit n. b.';
                      const en = enrichment[s.id];
                      const facilityName = enrichmentLoading
                        ? '…'
                        : (en?.facilityName ?? (s as unknown as { facility?: { name?: string } }).facility?.name ?? 'Einrichtung');
                      const stationName = en?.stationName;
                      const whereLabel = stationName ? `${facilityName} · ${stationName}` : facilityName;
                      return (
                        <ListItemButton
                          key={s.id}
                          onClick={() => {
                            onShiftClick?.(shift);
                            setSelectedDayForDetail(null);
                          }}
                          sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            borderLeft: `4px solid ${s.color || DEFAULT_SHIFT_COLOR}`,
                          }}
                        >
                          <ListItemText
                            primary={whereLabel}
                            secondary={`Wann: ${time}`}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </DialogContent>
              <DialogActions>
                {onDayClick && selectedDayForDetail && (
                  <Button
                    startIcon={<Add />}
                    onClick={() => {
                      onDayClick(selectedDayForDetail);
                      setSelectedDayForDetail(null);
                    }}
                  >
                    Schicht hinzufügen
                  </Button>
                )}
                <Button onClick={() => setSelectedDayForDetail(null)}>Schließen</Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
        <MenuItem
          onClick={() => {
            if (menuShift) onEdit?.(menuShift);
            handleCloseMenu();
          }}
        >
          Bearbeiten
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuShift) onAssign?.(menuShift);
            handleCloseMenu();
          }}
        >
          Zuweisen
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuShift) onDelete?.(menuShift);
            handleCloseMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          Löschen
        </MenuItem>
      </Menu>
    </Box>
  );
}
