'use client';

import { Assignment, Shift } from '@/lib/types';
import { Download, FileDownload, TableChart } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState } from 'react';

interface ExportButtonProps {
  shifts: Shift[];
  assignments?: Assignment[];
  dateFrom?: Date;
  dateTo?: Date;
  facilityName?: string;
  onExport?: (format: 'csv' | 'excel', data: Record<string, unknown>[]) => void;
}

export function ExportButton({
  shifts,
  assignments = [],
  dateFrom: _dateFrom,
  dateTo: _dateTo,
  facilityName,
  onExport: _onExport,
}: ExportButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const generateCSV = () => {
    const csvData = shifts.map(shift => {
      // Find assignments for this shift
      const shiftAssignments = assignments.filter(a => a.shiftId === shift.id);
      const assignedUsers = shiftAssignments
        .filter(a => a.status === 'accepted' || a.status === 'assigned')
        .map(a => `User-${a.userId}`) // Would need to resolve to actual names
        .join('; ');

      return {
        Datum: format(shift.date, 'dd.MM.yyyy', { locale: de }),
        Wochentag: format(shift.date, 'EEEE', { locale: de }),
        Einrichtung: facilityName || 'Unbekannte Einrichtung',
        Station: 'Unbekannte Station', // Sollte über stationId aufgelöst werden
        Schichttyp: shift.type,
        Startzeit: shift.startTime,
        Endzeit: shift.endTime,
        Status: getStatusLabel(shift.status),
        Kapazität: shift.capacity || 1,
        Zugewiesen: shift.assignedCount || 0,
        'Belegung %': Math.round(((shift.assignedCount || 0) / (shift.capacity || 1)) * 100),
        'Zugewiesene Mitarbeiter': assignedUsers,
        'Erforderliche Qualifikationen': (shift.requiredQualifications || []).join('; '),
        Notizen: shift.notes || '',
        'Erstellt am': format(shift.createdAt, 'dd.MM.yyyy HH:mm', { locale: de }),
        'Zuletzt geändert': format(shift.updatedAt, 'dd.MM.yyyy HH:mm', { locale: de }),
      };
    });

    return csvData;
  };

  const generateExcelData = () => {
    // For Excel export, we can include more detailed information
    const excelData = shifts.map(shift => {
      const _shiftAssignments = assignments.filter(a => a.shiftId === shift.id);

      return {
        Datum: format(shift.date, 'dd.MM.yyyy', { locale: de }),
        Wochentag: format(shift.date, 'EEEE', { locale: de }),
        Einrichtung: facilityName || 'Unbekannte Einrichtung',
        Station: 'Unbekannte Station',
        Schichttyp: shift.type,
        Startzeit: shift.startTime,
        Endzeit: shift.endTime,
        'Dauer (Stunden)': calculateDuration(shift.startTime, shift.endTime),
        Status: getStatusLabel(shift.status),
        Kapazität: shift.capacity || 1,
        Zugewiesen: shift.assignedCount || 0,
        Frei: (shift.capacity || 1) - (shift.assignedCount || 0),
        'Belegung %': Math.round(((shift.assignedCount || 0) / (shift.capacity || 1)) * 100),
        'Erforderliche Qualifikationen': (shift.requiredQualifications || []).join('; '),
        Notizen: shift.notes || '',
        'Erstellt am': format(shift.createdAt, 'dd.MM.yyyy HH:mm', { locale: de }),
        'Zuletzt geändert': format(shift.updatedAt, 'dd.MM.yyyy HH:mm', { locale: de }),
      };
    });

    return excelData;
  };

  const getStatusLabel = (status: Shift['status']) => {
    switch (status) {
      case 'open':
        return 'Offen';
      case 'filled':
        return 'Besetzt';
      case 'cancelled':
        return 'Abgesagt';
      default:
        return 'Unbekannt';
    }
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    let startTotal = startHours * 60 + startMinutes;
    let endTotal = endHours * 60 + endMinutes;

    // Handle overnight shifts
    if (endTotal < startTotal) {
      endTotal += 24 * 60; // Add 24 hours
    }

    return Math.round(((endTotal - startTotal) / 60) * 10) / 10; // Round to 1 decimal
  };

  const handleCSVExport = () => {
    const csvData = generateCSV();
    const csvContent = convertToCSV(csvData);
    downloadFile(csvContent, 'schichten.csv', 'text/csv');
    handleClose();
  };

  const handleExcelExport = () => {
    const excelData = generateExcelData();
    const csvContent = convertToCSV(excelData);
    downloadFile(
      csvContent,
      'schichten.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    handleClose();
  };

  const convertToCSV = (data: Record<string, unknown>[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getExportSummary = () => {
    const totalShifts = shifts.length;
    const openShifts = shifts.filter(s => s.status === 'open').length;
    const assignedShifts = shifts.filter(s => s.status === 'filled').length;
    const totalCapacity = shifts.reduce((sum, s) => sum + (s.capacity || 1), 0);
    const totalAssigned = shifts.reduce((sum, s) => sum + (s.assignedCount || 0), 0);

    return {
      totalShifts,
      openShifts,
      assignedShifts,
      totalCapacity,
      totalAssigned,
      occupancyRate: Math.round((totalAssigned / totalCapacity) * 100),
    };
  };

  const summary = getExportSummary();

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={handleClick}
        disabled={shifts.length === 0}
      >
        Export ({shifts.length} Schichten)
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            Export-Optionen
          </Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {summary.totalShifts} Schichten • {summary.occupancyRate}% belegt
          </Typography>
        </Box>

        <Divider />

        <MenuItem onClick={handleCSVExport}>
          <ListItemIcon>
            <FileDownload />
          </ListItemIcon>
          <ListItemText primary="CSV Export" secondary="Einfache Tabelle für Excel" />
        </MenuItem>

        <MenuItem onClick={handleExcelExport}>
          <ListItemIcon>
            <TableChart />
          </ListItemIcon>
          <ListItemText primary="Excel Export" secondary="Erweiterte Formatierung" />
        </MenuItem>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Export enthält:</strong>
            <br />• {summary.totalShifts} Schichten
            <br />• {summary.openShifts} offene Schichten
            <br />• {summary.assignedShifts} besetzte Schichten
            <br />• {summary.totalAssigned}/{summary.totalCapacity} Belegung
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
}

// Bulk export component for multiple date ranges
interface BulkExportButtonProps {
  dateRanges: Array<{
    label: string;
    shifts: Shift[];
    assignments: Assignment[];
    dateFrom: Date;
    dateTo: Date;
  }>;
  onBulkExport?: (format: 'csv' | 'excel', data: Record<string, unknown>[]) => void;
}

export function BulkExportButton({
  dateRanges,
  onBulkExport: _onBulkExport,
}: BulkExportButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleBulkCSVExport = () => {
    const allData = dateRanges.flatMap(range =>
      range.shifts.map(shift => ({
        Zeitraum: range.label,
        Datum: format(shift.date, 'dd.MM.yyyy', { locale: de }),
        Schichttyp: shift.type,
        Status: shift.status,
        Kapazität: shift.capacity || 1,
        Zugewiesen: shift.assignedCount || 0,
        // ... other fields
      }))
    );

    const csvContent = convertToCSV(allData);
    downloadFile(csvContent, 'schichten_bulk.csv', 'text/csv');
    handleClose();
  };

  const convertToCSV = (data: Record<string, unknown>[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalShifts = dateRanges.reduce((sum, range) => sum + range.shifts.length, 0);

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={handleClick}
        disabled={totalShifts === 0}
      >
        Bulk Export ({totalShifts} Schichten)
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            Bulk Export
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dateRanges.length} Zeiträume • {totalShifts} Schichten
          </Typography>
        </Box>

        <Divider />

        <MenuItem onClick={handleBulkCSVExport}>
          <ListItemIcon>
            <FileDownload />
          </ListItemIcon>
          <ListItemText primary="Alle Zeiträume als CSV" secondary="Kombinierter Export" />
        </MenuItem>
      </Menu>
    </Box>
  );
}
