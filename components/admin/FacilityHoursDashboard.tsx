'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, FileDownloadOutlined, RefreshOutlined } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import {
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useFacilityHours } from '@/lib/hooks/useFacilityHours';
import type { FacilityHoursSummary } from '@/lib/services/facilityHours';
import { AppError } from '@/lib/errors';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatStrip } from '@/components/ui/StatStrip';
import { PayrollExportDialog } from '@/components/admin/PayrollExportDialog';

interface FacilityHoursDashboardProps {
  facilityId?: string;
}

type RangeMode = 'week' | 'month' | 'custom';

const fmtH = (n: number) => `${n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;

function statusOf(s: FacilityHoursSummary): { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' } {
  if (s.missingEntries > 5) return { label: `${s.missingEntries} Nachweise fehlen`, color: 'error' };
  if (s.missingEntries > 0) return { label: `${s.missingEntries} ${s.missingEntries === 1 ? 'Nachweis fehlt' : 'Nachweise fehlen'}`, color: 'warning' };
  if (s.pendingTimesheets > 0) return { label: 'Zur Freigabe', color: 'info' };
  if ((s.dueShiftCount ?? 0) === 0) return { label: 'Noch nichts fällig', color: 'default' };
  return { label: 'Vollständig', color: 'success' };
}

function rangeFor(mode: RangeMode, anchor: Date): [Date, Date] {
  if (mode === 'month') return [startOfMonth(anchor), endOfMonth(anchor)];
  return [startOfWeek(anchor, { weekStartsOn: 1 }), endOfWeek(anchor, { weekStartsOn: 1 })];
}

function rangeTitle(mode: RangeMode, from: Date, to: Date) {
  if (mode === 'month') return format(from, 'MMMM yyyy', { locale: de });
  const sameMonth = isSameMonth(from, to);
  return `${format(from, sameMonth ? 'd.' : 'd. MMM', { locale: de })} – ${format(to, 'd. MMM yyyy', { locale: de })}`;
}

/**
 * Soll/Ist je Einrichtung. „Soll bis heute“ zählt nur Schichten, die bereits
 * vorbei sind – künftige Schichten sind keine fehlenden Nachweise.
 */
export function FacilityHoursDashboard({ facilityId }: FacilityHoursDashboardProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [mode, setMode] = useState<RangeMode>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [custom, setCustom] = useState<[Date | null, Date | null]>([null, null]);
  const [payrollOpen, setPayrollOpen] = useState(false);

  const [from, to] = useMemo<[Date | undefined, Date | undefined]>(() => {
    if (mode === 'custom') {
      return [custom[0] ? startOfDay(custom[0]) : undefined, custom[1] ? endOfDay(custom[1]) : undefined];
    }
    return rangeFor(mode, anchor);
  }, [mode, anchor, custom]);

  const { summaries, isLoading, error, refetch } = useFacilityHours({ facilityId, startDate: from, endDate: to });

  const rows = useMemo(() => [...summaries].sort((a, b) => b.missingEntries - a.missingEntries || a.facilityName.localeCompare(b.facilityName)), [summaries]);
  const totals = useMemo(
    () =>
      summaries.reduce(
        (t, s) => ({
          planned: t.planned + s.plannedHours,
          due: t.due + (s.dueHours ?? 0),
          worked: t.worked + s.workedHours,
          missing: t.missing + s.missingEntries,
          pending: t.pending + s.pendingTimesheets,
        }),
        { planned: 0, due: 0, worked: 0, missing: 0, pending: 0 }
      ),
    [summaries]
  );

  const shift = (dir: 1 | -1) => setAnchor(a => (mode === 'month' ? addMonths(a, dir) : addWeeks(a, dir)));

  const exportCsv = () => {
    if (rows.length === 0) return;
    const head = ['Einrichtung', 'Schichten', 'davon beendet', 'Soll gesamt (h)', 'Soll bis heute (h)', 'Geleistet (h)', 'Fehlende Nachweise', 'Zur Freigabe', 'Status'];
    const body = rows.map(s => [
      s.facilityName,
      s.shiftCount,
      s.dueShiftCount ?? 0,
      s.plannedHours.toFixed(1).replace('.', ','),
      (s.dueHours ?? 0).toFixed(1).replace('.', ','),
      s.workedHours.toFixed(1).replace('.', ','),
      s.missingEntries,
      s.pendingTimesheets,
      statusOf(s).label,
    ]);
    const csv = [head, ...body].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `stunden_${from ? format(from, 'yyyy-MM-dd') : 'alle'}_${to ? format(to, 'yyyy-MM-dd') : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cols = 'minmax(200px, 1.6fr) 90px 120px 120px minmax(140px, 1fr) 180px';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <PageHeader
        title="Stunden"
        subtitle="Soll und Ist je Einrichtung – fehlende Zeitnachweise auf einen Blick"
        actions={
          <>
            <Tooltip title="Neu laden">
              <IconButton aria-label="Neu laden" onClick={() => refetch()} disabled={isLoading}>
                <RefreshOutlined />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<FileDownloadOutlined />} onClick={exportCsv} disabled={isLoading || rows.length === 0}>
              CSV exportieren
            </Button>
            <Button variant="contained" startIcon={<FileDownloadOutlined />} onClick={() => setPayrollOpen(true)}>
              Lohnexport DATEV
            </Button>
          </>
        }
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)} aria-label="Zeitraum">
          <ToggleButton value="week">Woche</ToggleButton>
          <ToggleButton value="month">Monat</ToggleButton>
          <ToggleButton value="custom">Zeitraum</ToggleButton>
        </ToggleButtonGroup>
        {mode !== 'custom' ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size="small" aria-label={mode === 'week' ? 'Vorherige Woche' : 'Vorheriger Monat'} onClick={() => shift(-1)}>
              <ChevronLeft />
            </IconButton>
            <Typography component="h2" sx={{ fontSize: 15, fontWeight: 600, minWidth: 170, textAlign: 'center' }}>
              {from && to ? rangeTitle(mode, from, to) : ''}
            </Typography>
            <IconButton size="small" aria-label={mode === 'week' ? 'Nächste Woche' : 'Nächster Monat'} onClick={() => shift(1)}>
              <ChevronRight />
            </IconButton>
            <Button size="small" variant="text" onClick={() => setAnchor(new Date())}>
              Heute
            </Button>
          </Box>
        ) : (
          <>
            <DatePicker label="Von" value={custom[0]} onChange={d => setCustom(c => [d, c[1]])} slotProps={{ textField: { size: 'small', sx: { width: 160 } } }} />
            <DatePicker label="Bis" value={custom[1]} onChange={d => setCustom(c => [c[0], d])} slotProps={{ textField: { size: 'small', sx: { width: 160 } } }} />
          </>
        )}
      </Box>

      {error ? (
        <Alert severity="error">
          Stunden konnten nicht geladen werden:{' '}
          {error instanceof AppError ? error.userMessage : error instanceof Error ? error.message : 'Unbekannter Fehler'}
        </Alert>
      ) : (
        <>
          {summaries.some(s => s.incompleteData) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Einige Einrichtungen haben ältere Daten ohne Firmenzuordnung. Die Stunden sind dort unvollständig.
            </Alert>
          )}

          <StatStrip
            aria-label="Summen im Zeitraum"
            items={[
              { label: 'Soll bis heute', value: isLoading ? '–' : fmtH(totals.due), hint: totals.planned - totals.due > 0.05 ? `von ${fmtH(totals.planned)} im Zeitraum` : undefined },
              { label: 'Geleistet', value: isLoading ? '–' : fmtH(totals.worked) },
              { label: 'Fehlende Nachweise', value: isLoading ? '–' : totals.missing, tone: totals.missing > 0 ? 'attention' : 'default' },
              { label: 'Zur Freigabe', value: isLoading ? '–' : totals.pending, tone: totals.pending > 0 ? 'attention' : 'muted' },
            ]}
          />

          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
            {isDesktop && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: cols,
                  gap: 2,
                  px: 2,
                  py: 1,
                  bgcolor: 'action.hover',
                  '& > *': { fontSize: 13, fontWeight: 600, color: 'text.secondary' },
                }}
              >
                <span>Einrichtung</span>
                <span style={{ textAlign: 'right' }}>Schichten</span>
                <span style={{ textAlign: 'right' }}>Soll bis heute</span>
                <span style={{ textAlign: 'right' }}>Geleistet</span>
                <span>Erfüllung</span>
                <span>Status</span>
              </Box>
            )}

            {isLoading &&
              [0, 1, 2].map(i => (
                <Box key={i} sx={{ px: 2, py: 1.75, borderTop: i || isDesktop ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Skeleton width="60%" />
                </Box>
              ))}

            {!isLoading && rows.length === 0 && (
              <Box sx={{ px: 2, py: 6, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Keine Schichten im Zeitraum</Typography>
                <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Wählen Sie einen anderen Zeitraum.</Typography>
              </Box>
            )}

            {!isLoading &&
              rows.map((s, i) => {
                const st = statusOf(s);
                const due = s.dueHours ?? 0;
                const pct = due > 0 ? Math.min(100, Math.round((s.workedHours / due) * 100)) : null;
                const bar = (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={pct ?? 0}
                      color={pct === null ? 'inherit' : pct >= 95 ? 'success' : pct >= 60 ? 'primary' : 'warning'}
                      sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'action.hover', color: 'text.disabled' }}
                    />
                    <Typography className="tabular-nums" sx={{ fontSize: 13, color: 'text.secondary', width: 40, textAlign: 'right' }}>
                      {pct === null ? '—' : `${pct} %`}
                    </Typography>
                  </Box>
                );

                if (!isDesktop) {
                  return (
                    <Box key={s.facilityId} sx={{ px: 1.75, py: 1.5, borderTop: i ? '1px solid' : 'none', borderColor: 'divider', display: 'grid', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: 15 }}>
                          {s.facilityName}
                        </Typography>
                        <Chip size="small" variant="outlined" color={st.color} label={st.label} />
                      </Box>
                      <Typography className="tabular-nums" sx={{ fontSize: 13.5, color: 'text.secondary' }}>
                        {fmtH(s.workedHours)} von {fmtH(due)} bis heute · {s.shiftCount} Schichten
                      </Typography>
                      {bar}
                    </Box>
                  );
                }

                return (
                  <Box
                    key={s.facilityId}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: cols,
                      gap: 2,
                      alignItems: 'center',
                      px: 2,
                      minHeight: 56,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      fontSize: 14,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                        {s.facilityName}
                      </Typography>
                      {s.incompleteData && <Typography sx={{ fontSize: 12.5, color: 'warning.dark' }}>Daten unvollständig</Typography>}
                    </Box>
                    <Tooltip title={`${s.dueShiftCount ?? 0} davon bereits beendet`}>
                      <Typography className="tabular-nums" sx={{ fontSize: 14, textAlign: 'right' }}>
                        {s.shiftCount}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={`${fmtH(s.plannedHours)} im ganzen Zeitraum geplant`}>
                      <Typography className="tabular-nums" sx={{ fontSize: 14, textAlign: 'right' }}>
                        {fmtH(due)}
                      </Typography>
                    </Tooltip>
                    <Typography className="tabular-nums" sx={{ fontSize: 14, textAlign: 'right', fontWeight: 600 }}>
                      {fmtH(s.workedHours)}
                    </Typography>
                    {bar}
                    <Box>
                      <Chip size="small" variant="outlined" color={st.color} label={st.label} />
                    </Box>
                  </Box>
                );
              })}
          </Box>
        </>
      )}
      <PayrollExportDialog open={payrollOpen} onClose={() => setPayrollOpen(false)} />
    </LocalizationProvider>
  );
}

export default FacilityHoursDashboard;
