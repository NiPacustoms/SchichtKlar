'use client';

import React, { useState } from 'react';
import {
  Box,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Download, CheckCircleRounded, WarningAmberRounded } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import { useFacilityHours } from '@/lib/hooks/useFacilityHours';
import { AppError } from '@/lib/errors';
import { GlassCard } from '@/components/ui/GlassCard';
import { radius } from '@/lib/design-tokens';
import { format } from 'date-fns';

interface FacilityHoursDashboardProps {
  facilityId?: string;
}

/** Tönung der Status-/ArbZG-Pille – OK = grün, sonst amber/rot Warnung */
const STATUS_TONE: Record<'success' | 'warning' | 'error', { fg: string; bg: string }> = {
  success: { fg: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  warning: { fg: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  error: { fg: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export function FacilityHoursDashboard({ facilityId }: FacilityHoursDashboardProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('week');

  const { summaries, isLoading, error, refetch } = useFacilityHours({
    facilityId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const handleDateRangeChange = (range: 'week' | 'month' | 'custom') => {
    setDateRange(range);
    const now = new Date();

    if (range === 'week') {
      const mondayOffset = (now.getDay() + 6) % 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - mondayOffset);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      setStartDate(weekStart);
      setEndDate(weekEnd);
    } else if (range === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      setStartDate(monthStart);
      setEndDate(monthEnd);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  };

  React.useEffect(() => {
    if (dateRange === 'week') {
      handleDateRangeChange('week');
    }
  }, [dateRange]);

  const handleExportCSV = () => {
    if (summaries.length === 0) return;

    const headers = [
      'Einrichtung',
      'Geplant (h)',
      'Geleistet (h)',
      'Differenz (h)',
      'Differenz (%)',
      'Schichten',
      'Timesheets',
      'Fehlend',
      'Ausstehend',
      'Status',
    ];

    const rows = summaries.map(summary => {
      const diff = summary.workedHours - summary.plannedHours;
      const diffPercent =
        summary.plannedHours > 0 ? Math.round((diff / summary.plannedHours) * 100) : 0;

      return [
        summary.facilityName,
        summary.plannedHours.toFixed(1),
        summary.workedHours.toFixed(1),
        diff.toFixed(1),
        `${diffPercent >= 0 ? '+' : ''}${diffPercent}`,
        summary.shiftCount.toString(),
        summary.timesheetCount.toString(),
        summary.missingEntries.toString(),
        summary.pendingTimesheets.toString(),
        getStatusLabel(summary),
      ];
    });

    const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const dateRangeStr =
      summaries[0]?.range.startDate && summaries[0]?.range.endDate
        ? `${format(summaries[0].range.startDate, 'yyyy-MM-dd')}_${format(summaries[0].range.endDate, 'yyyy-MM-dd')}`
        : format(new Date(), 'yyyy-MM-dd');

    link.setAttribute('href', url);
    link.setAttribute('download', `stundenuebersicht_${dateRangeStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (summary: (typeof summaries)[0]) => {
    if (summary.missingEntries > 5) return 'error';
    if (summary.missingEntries > 0) return 'warning';
    if (summary.pendingTimesheets > 0) return 'warning';
    return 'success';
  };

  const getStatusLabel = (summary: (typeof summaries)[0]) => {
    if (summary.missingEntries > 5) return 'Kritisch';
    if (summary.missingEntries > 0) return 'Offen';
    if (summary.pendingTimesheets > 0) return 'Ausstehend';
    return 'Vollständig';
  };

  const hasIncompleteData = summaries.some(summary => summary.incompleteData);

  if (error) {
    const errorMessage =
      error instanceof AppError
        ? error.userMessage
        : error instanceof Error
          ? error.message
          : 'Unbekannter Fehler';
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Fehler beim Laden der Stundenübersicht: {errorMessage}
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Box>
        {hasIncompleteData && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Einige Einrichtungen enthalten historische Daten ohne <code>companyId</code>. Die
            Stunden sind unvollständig und müssen über eine Migration nachgezogen werden.
          </Alert>
        )}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            gap: 2,
            mb: 1,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 28, sm: 32 },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.08,
            }}
          >
            Stundenübersicht Einrichtungen
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Zeitraum</InputLabel>
              <Select
                value={dateRange}
                label="Zeitraum"
                onChange={e => handleDateRangeChange(e.target.value as 'week' | 'month' | 'custom')}
              >
                <MenuItem value="week">Aktuelle Woche</MenuItem>
                <MenuItem value="month">Aktueller Monat</MenuItem>
                <MenuItem value="custom">Benutzerdefiniert</MenuItem>
              </Select>
            </FormControl>
            {dateRange === 'custom' && (
              <>
                <DatePicker
                  label="Von"
                  value={startDate}
                  onChange={newValue => setStartDate(newValue)}
                  slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                />
                <DatePicker
                  label="Bis"
                  value={endDate}
                  onChange={newValue => setEndDate(newValue)}
                  slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                />
              </>
            )}
            <Tooltip title="Als CSV exportieren">
              <IconButton
                onClick={handleExportCSV}
                disabled={isLoading || summaries.length === 0}
                color="primary"
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: `${radius.md}px` }}
              >
                <Download />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              onClick={() => refetch()}
              disabled={isLoading}
              sx={{ minHeight: 44, borderRadius: `${radius.md}px` }}
            >
              Aktualisieren
            </Button>
          </Box>
        </Box>

        {summaries.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Zeitraum:{' '}
              {summaries[0]?.range.startDate && format(summaries[0].range.startDate, 'dd.MM.yyyy')}{' '}
              - {summaries[0]?.range.endDate && format(summaries[0].range.endDate, 'dd.MM.yyyy')}
            </Typography>
          </Box>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : summaries.length === 0 ? (
          <Alert severity="info">Keine Daten für den ausgewählten Zeitraum gefunden.</Alert>
        ) : (
          <Grid container spacing={2}>
            {summaries.map(summary => {
              const diff = summary.workedHours - summary.plannedHours;
              const diffPercent =
                summary.plannedHours > 0 ? Math.round((diff / summary.plannedHours) * 100) : 0;
              const status = getStatusColor(summary);
              const tone = STATUS_TONE[status];
              const StatusIcon = status === 'success' ? CheckCircleRounded : WarningAmberRounded;

              return (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={summary.facilityId}>
                  <GlassCard sx={{ height: '100%' }}>
                    <CardContent
                      sx={{
                        p: 2.5,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:last-child': { pb: 2.5 },
                      }}
                    >
                      {/* Kopf: Einrichtung + ArbZG-/Status-Badge */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 1.5,
                          mb: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 17,
                              fontWeight: 700,
                              letterSpacing: '-0.01em',
                              lineHeight: 1.25,
                            }}
                          >
                            {summary.facilityName}
                          </Typography>
                          {summary.incompleteData && (
                            <Typography variant="caption" color="warning.main">
                              Daten unvollständig (Migration erforderlich)
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.25,
                            py: 0.4,
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            color: tone.fg,
                            bgcolor: tone.bg,
                          }}
                        >
                          <StatusIcon sx={{ fontSize: 15 }} />
                          {getStatusLabel(summary)}
                        </Box>
                      </Box>

                      {/* Kernzahl: geleistete vs. geplante Stunden */}
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                          sx={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}
                          className="tabular-nums"
                        >
                          {summary.workedHours.toFixed(1)} h
                        </Typography>
                        <Typography variant="body2" color="text.secondary" className="tabular-nums">
                          von {summary.plannedHours.toFixed(1)} h geplant
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        className="tabular-nums"
                        sx={{
                          mt: 0.25,
                          fontWeight: 600,
                          color: diff >= 0 ? 'success.main' : 'error.main',
                        }}
                      >
                        {diff >= 0 ? '+' : ''}
                        {diff.toFixed(1)} h ({diffPercent >= 0 ? '+' : ''}
                        {diffPercent}%)
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      {/* Kennzahlen */}
                      <Grid container spacing={1.5} sx={{ mt: 'auto' }}>
                        {[
                          { label: 'Schichten', value: summary.shiftCount, color: undefined },
                          { label: 'Timesheets', value: summary.timesheetCount, color: undefined },
                          {
                            label: 'Fehlend',
                            value: summary.missingEntries,
                            color:
                              summary.missingEntries > 0 ? 'error.main' : ('text.primary' as const),
                          },
                          {
                            label: 'Ausstehend',
                            value: summary.pendingTimesheets,
                            color:
                              summary.pendingTimesheets > 0
                                ? 'warning.main'
                                : ('text.primary' as const),
                          },
                        ].map(stat => (
                          <Grid size={6} key={stat.label}>
                            <Typography variant="caption" color="text.secondary">
                              {stat.label}
                            </Typography>
                            <Typography
                              className="tabular-nums"
                              sx={{ fontSize: 17, fontWeight: 600, color: stat.color }}
                            >
                              {stat.value}
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </GlassCard>
                </Grid>
              );
            })}
          </Grid>
        )}

        {summaries.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }, minWidth: 0 }}>
              <GlassCard>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Gesamt geplant
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }} className="tabular-nums">
                    {summaries.reduce((sum, s) => sum + s.plannedHours, 0).toFixed(1)} h
                  </Typography>
                </CardContent>
              </GlassCard>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }, minWidth: 0 }}>
              <GlassCard>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Gesamt geleistet
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 600, color: 'primary.main' }}
                    className="tabular-nums"
                  >
                    {summaries.reduce((sum, s) => sum + s.workedHours, 0).toFixed(1)} h
                  </Typography>
                </CardContent>
              </GlassCard>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }, minWidth: 0 }}>
              <GlassCard>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Fehlende Einträge
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 600, color: 'error.main' }}
                    className="tabular-nums"
                  >
                    {summaries.reduce((sum, s) => sum + s.missingEntries, 0)}
                  </Typography>
                </CardContent>
              </GlassCard>
            </Box>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
}
