'use client';

import { Shift } from '@/lib/types';
import { assignmentService } from '@/lib/services';
import { Add, ArrowBack, ArrowForward, Event, MoreVert } from '@mui/icons-material';
import {
  Box,
  IconButton,
  Typography,
  Grid,
  Paper,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Stack,
  useMediaQuery,
  useTheme,
  type ChipProps,
} from '@mui/material';
import {
  addMonths,
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
import { useEffect, useMemo, useRef, useState } from 'react';

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
  onShiftClick?: (shift: Shift) => void;
  onEdit?: (shift: Shift) => void;
  onAssign?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
  onDuplicate?: (shift: Shift) => void;
  onDayClick?: (date: Date) => void;
  onDayLongPress?: (date: Date) => void;
}

export default function AdminCalendarView({
  shifts,
  onShiftClick,
  onEdit,
  onAssign,
  onDelete,
  onDuplicate,
  onDayClick,
  onDayLongPress,
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
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuShift, setMenuShift] = useState<Shift | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);

  const handlePrev = () => setCurrentMonth(prev => addMonths(prev, -1));
  const handleNext = () => setCurrentMonth(prev => addMonths(prev, 1));

  const monthInterval = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

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

  if (isMobile) {
    const mobileDays = monthInterval.filter(day => {
      const key = format(day, 'yyyy-MM-dd');
      return (daysByDate[key] || []).length > 0;
    });

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
            {format(currentMonth, 'LLLL yyyy', { locale: de })}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Tippe auf einen Tag für Details
          </Typography>
        </Box>

        {mobileDays.length === 0 ? (
          <Paper className="glass" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Für diesen Monat sind keine Schichten geplant.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2} sx={{ pb: 1 }}>
            {mobileDays.map(day => {
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
                      const shiftColor = s.color || '#4CAF50';
                      const isPartOfGroup = !!s.shiftGroupId;
                      const groupShifts = s.shiftGroupId ? shiftGroups[s.shiftGroupId] || [] : [];
                      const groupSize = groupShifts.length;

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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                {s.title || s.facility?.name || 'Schicht'}
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
                            <Typography variant="caption" color="text.secondary">
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
                              {s.surchargeNight && <Chip size="small" label="N" />}
                              {s.surchargeWeekend && <Chip size="small" label="W" />}
                              {s.surchargeHoliday && <Chip size="small" label="F" />}
                              {s.surchargeOnCall && <Chip size="small" label="R" />}
                              <FormStatusChip shiftId={s.id} />
                              <CompletedChip shiftId={s.id} />
                              {assignedTo?.length > 0 && (
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
              if (menuShift) onDuplicate?.(menuShift);
              handleCloseMenu();
            }}
          >
            Duplizieren
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

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton
          onClick={handlePrev}
          aria-label="Vorheriger Monat"
          size="large"
          sx={{ touchAction: 'manipulation' }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {format(currentMonth, 'LLLL yyyy', { locale: de })}
        </Typography>
        <IconButton
          onClick={handleNext}
          aria-label="Nächster Monat"
          size="large"
          sx={{ touchAction: 'manipulation' }}
        >
          <ArrowForward />
        </IconButton>
      </Box>

      {/* Weekday header */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {weekDayLabels.map(label => (
          <Grid key={label} size={{ xs: (12 / 7) as unknown as number }}>
            <Typography variant="subtitle2" align="center" color="text.secondary">
              {label}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Days grid */}
      <Grid container spacing={1}>
        {monthInterval.map(day => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const key = format(day, 'yyyy-MM-dd');
          const dayShifts = daysByDate[key] || [];
          const today = isToday(day);

          return (
            <Grid key={key} size={{ xs: (12 / 7) as unknown as number }}>
              <Paper
                variant="outlined"
                className="glass"
                tabIndex={0}
                role="button"
                sx={{
                  p: 1.25,
                  minHeight: { xs: 140, sm: 120 },
                  opacity: isCurrentMonth ? 1 : 0.5,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'box-shadow 120ms ease',
                  '&:focus-visible': {
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={e => {
                  if ((e.target as HTMLElement).closest('[data-shift-item]')) return;
                  if (!longPressTriggeredRef.current) onDayClick?.(day);
                  longPressTriggeredRef.current = false;
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDayClick?.(day);
                  }
                }}
                onTouchStart={() => {
                  longPressTriggeredRef.current = false;
                  if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = window.setTimeout(() => {
                    longPressTriggeredRef.current = true;
                    try {
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        (navigator as unknown as { vibrate?: (ms: number) => void }).vibrate?.(10);
                      }
                    } catch {
                      /* ignore */
                    }
                    onDayLongPress?.(day);
                  }, 500);
                }}
                onTouchEnd={() => {
                  if (longPressTimerRef.current) {
                    window.clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                  }
                }}
                onTouchCancel={() => {
                  if (longPressTimerRef.current) {
                    window.clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                  }
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                    gap: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600 }}
                    color={today ? 'primary.main' : 'text.secondary'}
                  >
                    {format(day, 'd. MMM', { locale: de })}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {today && (
                      <Chip size="small" color="primary" label="Heute" variant="outlined" />
                    )}
                    {onDayClick && (
                      <Tooltip title="Schicht hinzufügen">
                        <IconButton
                          size="small"
                          color="primary"
                          aria-label="Schicht hinzufügen"
                          onClick={event => {
                            event.stopPropagation();
                            onDayClick?.(day);
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minHeight: 24 }}>
                  {dayShifts.slice(0, 3).map(shift => {
                    type ShiftLike2 = Shift & {
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
                    const s = shift as unknown as ShiftLike2;
                    const time =
                      s.startTime && s.endTime ? `${s.startTime}–${s.endTime}` : undefined;
                    const assignedTo: string[] = (s.assignedTo || []) as string[];
                    const shiftColor = s.color || '#4CAF50';
                    const isPartOfGroup = !!s.shiftGroupId;
                    const groupShifts = s.shiftGroupId ? shiftGroups[s.shiftGroupId] || [] : [];
                    const groupSize = groupShifts.length;
                    return (
                      <Tooltip
                        key={s.id}
                        title={`${s.facility?.name || 'Einrichtung'}${time ? ` · ${time}` : ''}`}
                      >
                        <Box
                          data-shift-item
                          onClick={event => {
                            event.stopPropagation();
                            onShiftClick?.(shift);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            px: 1,
                            py: 0.5,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            cursor: 'pointer',
                            borderLeft: `4px solid ${shiftColor}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <Event fontSize="small" />
                            <Typography variant="caption" noWrap>
                              {s.title || s.facility?.name || 'Schicht'}
                            </Typography>
                            {isPartOfGroup && groupSize > 1 && (
                              <Chip
                                size="small"
                                label={`${groupSize}`}
                                sx={{
                                  height: 16,
                                  fontSize: '0.6rem',
                                  bgcolor: shiftColor,
                                  color: 'white',
                                  minWidth: 20,
                                  '& .MuiChip-label': { px: 0.5 },
                                }}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            {s.surchargeNight && <Chip size="small" label="N" />}
                            {s.surchargeWeekend && <Chip size="small" label="W" />}
                            {s.surchargeHoliday && <Chip size="small" label="F" />}
                            {s.surchargeOnCall && <Chip size="small" label="R" />}
                            <FormStatusChip shiftId={s.id} />
                            <CompletedChip shiftId={s.id} />
                            {assignedTo?.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5, ml: 0.5 }}>
                                {assignedTo.slice(0, 5).map(uid => (
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
                                {assignedTo.length > 5 && (
                                  <Typography variant="caption" color="text.secondary">
                                    +{assignedTo.length - 5}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                          <IconButton
                            size="medium"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenMenu(e, shift);
                            }}
                            sx={{ ml: 0.5 }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Box>
                      </Tooltip>
                    );
                  })}

                  {dayShifts.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{dayShifts.length - 3} weitere
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

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
            if (menuShift) onDuplicate?.(menuShift);
            handleCloseMenu();
          }}
        >
          Duplizieren
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
