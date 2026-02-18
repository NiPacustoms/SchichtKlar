'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
} from '@mui/material';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useAdminReports } from '@/lib/hooks/useAdminReports';

export type ReportType = 'time' | 'employee' | 'all';
export type ExportFormat = 'pdf' | 'excel';

interface ExportReportDialogProps {
  open: boolean;
  onClose: () => void;
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  time: 'Zeitkonten',
  employee: 'Mitarbeiter-Statistik',
  all: 'Alle Berichte',
};

export function ExportReportDialog({ open, onClose }: ExportReportDialogProps) {
  const [reportType, setReportType] = useState<ReportType>('time');
  const [format, setFormat] = useState<ExportFormat>('pdf');

  const defaultFilters = useMemo(() => {
    const now = new Date();
    return {
      startDate: startOfMonth(now),
      endDate: endOfMonth(now),
    };
  }, []);

  const {
    exportTimeAccountReportAsync,
    exportEmployeeStatisticsAsync,
    exportAllReportsAsync,
    isExporting,
  } = useAdminReports(defaultFilters);

  const handleExport = async () => {
    try {
      let url: string;
      switch (reportType) {
        case 'time':
          url = await exportTimeAccountReportAsync(format);
          break;
        case 'employee':
          url = await exportEmployeeStatisticsAsync(format);
          break;
        case 'all':
          url = await exportAllReportsAsync(format);
          break;
        default:
          url = await exportTimeAccountReportAsync(format);
      }
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      onClose();
    } catch {
      // Toast wird bereits in useAdminReports bei onError gesetzt
      // Optional: onClose() bei Fehler nicht schließen, damit User erneut versuchen kann
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bericht exportieren</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="export-report-type">Berichtstyp</InputLabel>
            <Select
              labelId="export-report-type"
              value={reportType}
              label="Berichtstyp"
              onChange={(e) => setReportType(e.target.value as ReportType)}
            >
              {(Object.entries(REPORT_TYPE_LABELS) as [ReportType, string][]).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="export-format">Format</InputLabel>
            <Select
              labelId="export-format"
              value={format}
              label="Format"
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            Zeitraum: aktueller Monat (von {defaultFilters.startDate.toLocaleDateString('de-DE')} bis{' '}
            {defaultFilters.endDate.toLocaleDateString('de-DE')})
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isExporting}>
          Abbrechen
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting}
          startIcon={isExporting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {isExporting ? 'Wird erstellt…' : 'Export starten'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
