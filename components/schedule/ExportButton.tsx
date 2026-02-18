'use client';

import { Assignment, Shift } from '@/lib/types';
import { PictureAsPdf } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState } from 'react';
import { getShiftDisplayStatus, getShiftStatusLabel } from '@/lib/utils/shiftStatus';

interface ExportButtonProps {
  shifts: Shift[];
  assignments?: Assignment[];
  dateFrom?: Date;
  dateTo?: Date;
  facilityName?: string;
  onExport?: (format: 'pdf') => void;
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const startTotal = startHours * 60 + startMinutes;
  let endTotal = endHours * 60 + endMinutes;
  if (endTotal < startTotal) endTotal += 24 * 60;
  return Math.round(((endTotal - startTotal) / 60) * 10) / 10;
}

export function ExportButton({
  shifts,
  assignments = [],
  facilityName,
  onExport,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const getTableRows = (): string[][] => {
    return shifts.map(shift => {
      const shiftAssignments = assignments.filter(a => a.shiftId === shift.id);
      const assignedUsers = shiftAssignments
        .filter(a => a.status === 'accepted' || a.status === 'assigned')
        .map(a => `User-${a.userId}`)
        .join('; ');
      return [
        format(shift.date, 'dd.MM.yyyy', { locale: de }),
        format(shift.date, 'EEEE', { locale: de }),
        facilityName || 'Unbekannte Einrichtung',
        shift.startTime,
        shift.endTime,
        String(calculateDuration(shift.startTime, shift.endTime)),
        getShiftStatusLabel(getShiftDisplayStatus(shift)),
        String(shift.capacity ?? 1),
        String(shift.assignedCount ?? 0),
        String(Math.round(((shift.assignedCount || 0) / (shift.capacity || 1)) * 100) + '%'),
        assignedUsers,
        (shift.requiredQualifications || []).join('; '),
        shift.notes || '',
      ];
    });
  };

  const handlePdfExport = async () => {
    if (shifts.length === 0) return;
    setLoading(true);
    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const autoTable = (autoTableModule as { default: (doc: unknown, options: unknown) => void }).default;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const margin = 14;
      let y = 18;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Schichten-Export', margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const totalCapacity = shifts.reduce((s, sh) => s + (sh.capacity || 1), 0);
      const totalAssigned = shifts.reduce((s, sh) => s + (sh.assignedCount || 0), 0);
      doc.text(
        `${shifts.length} Schichten • ${totalAssigned}/${totalCapacity} belegt (${Math.round((totalAssigned / totalCapacity) * 100)}%)`,
        margin,
        y
      );
      y += 10;

      const headers = [
        'Datum',
        'Wochentag',
        'Einrichtung',
        'Start',
        'Ende',
        'Dauer (h)',
        'Status',
        'Kapazität',
        'Zugewiesen',
        'Belegung',
        'Zugewiesene',
        'Qualifikationen',
        'Notizen',
      ];
      const body = getTableRows();

      autoTable(doc, {
        head: [headers],
        body,
        startY: y,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [66, 139, 202] },
        theme: 'striped',
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
      });

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schichten_${format(new Date(), 'yyyy-MM-dd', { locale: de })}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      onExport?.('pdf');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<PictureAsPdf />}
        onClick={handlePdfExport}
        disabled={shifts.length === 0 || loading}
      >
        {loading ? 'PDF wird erstellt…' : `Als PDF exportieren (${shifts.length} Schichten)`}
      </Button>
    </Box>
  );
}

// Bulk export component for multiple date ranges (nur PDF)
interface BulkExportButtonProps {
  dateRanges: Array<{
    label: string;
    shifts: Shift[];
    assignments: Assignment[];
    dateFrom: Date;
    dateTo: Date;
    facilityName?: string;
  }>;
  onBulkExport?: (format: 'pdf') => void;
}

export function BulkExportButton({
  dateRanges,
  onBulkExport,
}: BulkExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const totalShifts = dateRanges.reduce((sum, range) => sum + range.shifts.length, 0);

  const handleBulkPdfExport = async () => {
    if (totalShifts === 0) return;
    setLoading(true);
    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const autoTable = (autoTableModule as { default: (doc: unknown, options: unknown) => void }).default;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const margin = 14;
      let y = 18;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Schichten Bulk-Export', margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${dateRanges.length} Zeiträume • ${totalShifts} Schichten`, margin, y);
      y += 10;

      const headers = [
        'Zeitraum',
        'Datum',
        'Wochentag',
        'Start',
        'Ende',
        'Dauer (h)',
        'Status',
        'Kapazität',
        'Zugewiesen',
        'Belegung',
        'Notizen',
      ];
      const body: string[][] = [];
      for (const range of dateRanges) {
        for (const shift of range.shifts) {
          const shiftAssignments = range.assignments.filter(a => a.shiftId === shift.id);
          const assigned = shiftAssignments.filter(
            a => a.status === 'accepted' || a.status === 'assigned'
          ).length;
          body.push([
            range.label,
            format(shift.date, 'dd.MM.yyyy', { locale: de }),
            format(shift.date, 'EEEE', { locale: de }),
            shift.startTime,
            shift.endTime,
            String(calculateDuration(shift.startTime, shift.endTime)),
            getShiftStatusLabel(getShiftDisplayStatus(shift)),
            String(shift.capacity ?? 1),
            String(shift.assignedCount ?? 0),
            String(Math.round(((shift.assignedCount || 0) / (shift.capacity || 1)) * 100) + '%'),
            shift.notes || '',
          ]);
        }
      }

      autoTable(doc, {
        head: [headers],
        body,
        startY: y,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [66, 139, 202] },
        theme: 'striped',
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
      });

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schichten_bulk_${format(new Date(), 'yyyy-MM-dd', { locale: de })}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      onBulkExport?.('pdf');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<PictureAsPdf />}
        onClick={handleBulkPdfExport}
        disabled={totalShifts === 0 || loading}
      >
        {loading ? 'PDF wird erstellt…' : `Als PDF exportieren (${totalShifts} Schichten)`}
      </Button>
    </Box>
  );
}
