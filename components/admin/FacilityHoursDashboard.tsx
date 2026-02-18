'use client';

import React, { useState } from 'react';
import {
  Box,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import { useFacilityHours } from '@/lib/hooks/useFacilityHours';
import { AppError } from '@/lib/errors';
import { GlassCard } from '@/components/ui/GlassCard';
import { format } from 'date-fns';

interface FacilityHoursDashboardProps {
  facilityId?: string;
}

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Stundenübersicht Einrichtungen
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <Download />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" onClick={() => refetch()} disabled={isLoading}>
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
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 2, overflow: 'hidden', overflowX: 'auto' }}
          >
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Einrichtung</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                    Geplant (h)
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                    Geleistet (h)
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                    Differenz (h)
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                    Schichten
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                    Timesheets
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                    Fehlend
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                    Ausstehend
                  </TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaries.map(summary => {
                  const diff = summary.workedHours - summary.plannedHours;
                  const diffPercent =
                    summary.plannedHours > 0 ? Math.round((diff / summary.plannedHours) * 100) : 0;

                  return (
                    <TableRow key={summary.facilityId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {summary.facilityName}
                        </Typography>
                        {summary.incompleteData && (
                          <Typography variant="caption" color="warning.main">
                            Daten unvollständig (Migration erforderlich)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{summary.plannedHours.toFixed(1)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {summary.workedHours.toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            color: diff >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 500,
                          }}
                        >
                          {diff >= 0 ? '+' : ''}
                          {diff.toFixed(1)} ({diffPercent >= 0 ? '+' : ''}
                          {diffPercent}%)
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{summary.shiftCount}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{summary.timesheetCount}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {summary.missingEntries > 0 ? (
                          <Chip
                            label={summary.missingEntries}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {summary.pendingTimesheets > 0 ? (
                          <Chip
                            label={summary.pendingTimesheets}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusLabel(summary)}
                          size="small"
                          color={getStatusColor(summary)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {summaries.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }, minWidth: 0 }}>
              <GlassCard>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Gesamt geplant
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
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
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
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
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
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
