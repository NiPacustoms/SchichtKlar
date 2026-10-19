'use client';
export const dynamic = 'force-dynamic';
import { useAssignments } from '@/lib/hooks/useAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { AssignShiftDialog } from '@/components/admin/AssignShiftDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatStrip } from '@/components/ui/StatStrip';
import { AssignmentTable, type AssignmentRow } from '@/components/admin/AssignmentTable';
import { ASSIGNMENT_GROUPS, assignmentStatusMeta, type AssignmentGroup } from '@/lib/domain/assignmentStatus';
import { facilityService } from '@/lib/services/facilities';
import { userService } from '@/lib/services/users';
import { useQuery } from '@tanstack/react-query';
import { shiftService } from '@/lib/services/shifts';
import type { Shift as ShiftEntity } from '@/lib/services/shifts';
import type { Shift as DomainShift } from '@/lib/types';
import {
  Assignment as AssignmentIcon,
  Refresh,
  Search,
  Clear,
  PictureAsPdf,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  Alert,
  Tooltip,
} from '@mui/material';
import { useState, useMemo } from 'react';
import { cloudFunctions } from '@/lib/services/cloudFunctions';
import { SignatureDialog } from '@/components/ui/SignatureDialog';
import { firebaseStorageService } from '@/lib/services/firebaseStorage';
import { assignmentService } from '@/lib/services/assignments';
import {
  buildAssignmentCollectionPdf,
  downloadCollectionPdf,
  type AssignmentForCollection,
} from '@/lib/services/assignmentCollectionPdf';
import { toast } from '@/lib/utils/toast';

function convertToDomainShift(shift: ShiftEntity): DomainShift {
  const parsedDate =
    typeof shift.date === 'string' ? new Date(shift.date) : (shift.date as unknown as Date);
  const safeDate =
    parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date();
  return {
    id: shift.id,
    facilityId: shift.facilityId,
    stationId: shift.stationId ?? '',
    companyId: (shift as ShiftEntity & { companyId?: string }).companyId || '',
    date: safeDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    type: (shift.type as DomainShift['type']) || 'Frühdienst',
    requiredQualifications: shift.requiredQualifications || [],
    maxStaff: shift.maxStaff || shift.capacity || 1,
    status: shift.status || 'open',
    createdAt: shift.createdAt ?? new Date(),
    updatedAt: shift.updatedAt ?? new Date(),
    capacity: shift.capacity || shift.maxStaff || 1,
    assignedCount: shift.assignedCount || 0,
    tz: shift.timezone || 'Europe/Berlin',
    notes: shift.notes,
    createdBy: shift.createdBy || 'system',
  };
}

export default function AssignmentsPage() {
  const { user } = useAuth();

  // State für Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [signatureOpenFor, setSignatureOpenFor] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [exportingCollection, setExportingCollection] = useState(false);
  const [reassignShift, setReassignShift] = useState<DomainShift | null>(null);
  const [loadingReassignId, setLoadingReassignId] = useState<string | null>(null);

  // Filtern/Suchen geschieht clientseitig – ein stabiler Query-Key verhindert
  // Neuladen bei jedem Tastendruck in der Suche.
  const filters = useMemo(() => ({}), []);

  const {
    assignments,
    isLoading,
    error,
    acceptAssignment,
    declineAssignment,
    updateAssignment: _updateAssignment,
    deleteAssignment,
    getPriorityColor: _getPriorityColor,
    getPriorityLabel: _getPriorityLabel,
    formatDate: _formatDate,
    formatTime: _formatTime,
    formatDateTime: _formatDateTime,
    refetch,
  } = useAssignments(filters);


  // Nachschlagetabellen: Namen statt interner IDs, Dienstzeit aus der Schicht
  const companyId = user?.companyId;
  const { data: facilities = [] } = useQuery({
    queryKey: ['einsaetze-facilities', companyId],
    queryFn: () => facilityService.getAll(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
  const { data: staff = [] } = useQuery({
    queryKey: ['einsaetze-staff', companyId],
    queryFn: async () => {
      const res = await userService.getAll(1, 500, { companyId });
      return Array.isArray(res) ? res : res.data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
  const { data: shiftList = [] } = useQuery({
    queryKey: ['einsaetze-shifts', companyId],
    queryFn: () => shiftService.getAll({ companyId }),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });

  const [activeGroup, setActiveGroup] = useState<AssignmentGroup | 'all'>('all');

  const rows = useMemo((): AssignmentRow[] => {
    const facilityById = new Map(facilities.map(f => [f.id, f]));
    const personById = new Map(staff.map(u => [u.id, u.displayName || u.email]));
    const shiftById = new Map(shiftList.map(s => [s.id, s]));
    return assignments.map(a => {
      const ext = a as typeof a & {
        facilityId?: string;
        startDate?: Date;
        startTime?: string;
        endTime?: string;
        relievingSignatures?: unknown[];
      };
      const shift = a.shiftId ? shiftById.get(a.shiftId) : undefined;
      const facilityId = ext.facilityId || shift?.facilityId;
      const facility = facilityId ? facilityById.get(facilityId) : undefined;
      const rawDate = ext.startDate ?? (shift?.date ? new Date(shift.date as unknown as string) : null);
      const date = rawDate && !Number.isNaN(new Date(rawDate).getTime()) ? new Date(rawDate) : null;
      const start = ext.startTime || shift?.startTime;
      const end = ext.endTime || shift?.endTime;
      return {
        id: a.id,
        status: a.status,
        date,
        timeRange: start && end ? `${start} – ${end}` : null,
        facilityName: facility?.name ?? 'Einrichtung unbekannt',
        facilityColor: facility?.colorCode,
        personName: a.userId ? (personById.get(a.userId) ?? 'Unbekannte Person') : null,
        declineReason: a.declineReason,
        pdfUrl: (a as { pdfUrl?: string }).pdfUrl,
        canGeneratePdf: Array.isArray(ext.relievingSignatures) && ext.relievingSignatures.length > 0,
        shiftId: a.shiftId || undefined,
      };
    });
  }, [assignments, facilities, staff, shiftList]);

  const groupCounts = useMemo(() => {
    const counts: Record<AssignmentGroup, number> = { open: 0, planned: 0, signature: 0, done: 0, declined: 0 };
    for (const r of rows) counts[assignmentStatusMeta(r.status).group]++;
    return counts;
  }, [rows]);

  const visibleRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows
      .filter(r => activeGroup === 'all' || assignmentStatusMeta(r.status).group === activeGroup)
      .filter(r => !q || r.facilityName.toLowerCase().includes(q) || (r.personName ?? '').toLowerCase().includes(q))
      .sort((x, y) => (y.date?.getTime() ?? 0) - (x.date?.getTime() ?? 0));
  }, [rows, activeGroup, searchTerm]);

  /** Einsätze mit Einsatzmitteilung (pdfUrl) für Sammel-PDF */
  const assignmentsWithPdf = useMemo((): AssignmentForCollection[] => {
    return assignments
      .filter((a): a is typeof a & { pdfUrl: string } => Boolean(a.pdfUrl))
      .map(a => ({ id: a.id, userId: a.userId, pdfUrl: a.pdfUrl! }));
  }, [assignments]);

  const handleExportCollectionPdf = async () => {
    if (assignmentsWithPdf.length === 0) {
      toast.error('Keine Einsätze mit Einsatzmitteilung vorhanden.');
      return;
    }
    setExportingCollection(true);
    try {
      const bytes = await buildAssignmentCollectionPdf({
        assignments: assignmentsWithPdf,
        title: 'Einsatzmitteilungen mit Zeiterfassung',
      });
      downloadCollectionPdf(bytes);
      toast.success(
        `Sammel-PDF mit ${assignmentsWithPdf.length} Einsatzmitteilung(en) erstellt. Download gestartet.`
      );
    } catch (e) {
      toast.error(
        'Fehler beim Erstellen des Sammel-PDFs: ' +
          (e instanceof Error ? e.message : 'Unbekannter Fehler')
      );
    } finally {
      setExportingCollection(false);
    }
  };

  const handleAccept = (assignmentId: string) => {
    acceptAssignment(assignmentId);
  };

  const handleDecline = (assignmentId: string) => {
    declineAssignment(assignmentId);
  };

  const handleSignDecline = (assignmentId: string) => {
    setSignatureOpenFor(assignmentId);
  };

  const handleGeneratePDF = async (assignmentId: string) => {
    setGeneratingPDF(assignmentId);
    try {
      const result = await assignmentService.generateSignaturePDFAndSendEmails(assignmentId);
      toast.success(
        `PDF erfolgreich generiert${result.emailsSent ? ' und E-Mails versendet' : ''}`
      );
      refetch();
    } catch (error) {
      toast.error(
        'Fehler beim Generieren des PDFs: ' +
          (error instanceof Error ? error.message : 'Unbekannter Fehler')
      );
    } finally {
      setGeneratingPDF(null);
    }
  };

  const handleAdminSignatureSave = async (dataUrl: string, signerName?: string) => {
    const assignmentId = signatureOpenFor;
    if (!assignmentId) {
      toast.error('Keine Assignment-ID gefunden');
      return;
    }

    // Setze signatureOpenFor erst zurück, wenn alles erfolgreich war
    try {
      // Upload admin signature (muss zuerst erfolgreich sein)
      const res = await fetch(dataUrl);
      if (!res.ok) {
        throw new Error('Fehler beim Konvertieren der Signatur');
      }
      const blob = await res.blob();
      const file = new File([blob], 'admin-signature.png', { type: 'image/png' });
      const upload = await firebaseStorageService.uploadFile(
        file,
        `signatures/assignments/${assignmentId}/admin-signature.png`,
        { kind: 'assignment-decline', role: 'admin' }
      );

      if (!upload?.url) {
        throw new Error('Upload fehlgeschlagen - keine URL erhalten');
      }

      // Confirm decline with admin signature
      await cloudFunctions.declineAssignment({
        assignmentId,
        declineType: 'nurse-initiated',
        adminSignature: 'true',
      });

      await assignmentService.update(assignmentId, {
        adminSignatureUrl: upload.url,
        adminSignedAt: new Date(),
        ...(signerName && { adminSignerName: signerName }),
      });

      setSignatureOpenFor(null);
      refetch();
      toast.success('Admin-Signatur erfolgreich gespeichert');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Fehler beim Speichern der Admin-Signatur';
      toast.error(errorMessage);
      // Dialog bleibt offen, damit User es erneut versuchen kann
    }
  };

  const handleDelete = (assignmentId: string) => {
    deleteAssignment(assignmentId);
  };

  const handleReassignClick = async (assignment: { id: string; shiftId?: string }) => {
    if (!assignment.shiftId) {
      toast.error('Keine Schicht mit diesem Einsatz verknüpft.');
      return;
    }
    setLoadingReassignId(assignment.id);
    try {
      const shift = await shiftService.getById(assignment.shiftId);
      if (!shift) {
        toast.error('Schicht nicht gefunden.');
        return;
      }
      setReassignShift(convertToDomainShift(shift));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Schicht konnte nicht geladen werden.'
      );
    } finally {
      setLoadingReassignId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner variant="skeleton" message="Einsätze werden geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bitte melde dich an, um Einsätze zu verwalten.</Alert>
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="wide">
      <PageHeader
        title="Einsätze"
        subtitle="Wer arbeitet wann wo – Zusagen, Unterschriften und Einsatzmitteilungen"
        actions={
          <>
            <Tooltip title="Aktualisieren">
              <IconButton onClick={() => refetch()} aria-label="Aktualisieren">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={handleExportCollectionPdf}
              disabled={exportingCollection || assignmentsWithPdf.length === 0}
            >
              {exportingCollection ? 'Wird erstellt…' : `Sammel-PDF (${assignmentsWithPdf.length})`}
            </Button>
          </>
        }
      />

      <StatStrip
        aria-label="Einsätze nach Status"
        items={[
          { label: 'Alle', value: rows.length, onClick: () => setActiveGroup('all'), selected: activeGroup === 'all' },
          ...ASSIGNMENT_GROUPS.map(g => ({
            label: g.label,
            value: groupCounts[g.key],
            tone: (g.key === 'signature' || g.key === 'open') && groupCounts[g.key] > 0 ? ('attention' as const) : ('default' as const),
            onClick: () => setActiveGroup(g.key),
            selected: activeGroup === g.key,
          })),
        ]}
      />

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Einrichtung oder Person suchen"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', md: 320 } }}
          inputProps={{ 'aria-label': 'Einsätze durchsuchen' }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={() => setSearchTerm('')} aria-label="Suche löschen">
                <Clear fontSize="small" />
              </IconButton>
            ),
          }}
        />
        <Typography sx={{ ml: 'auto', fontSize: 13, color: 'text.secondary', display: { xs: 'none', md: 'block' } }}>
          {visibleRows.length} {visibleRows.length === 1 ? 'Einsatz' : 'Einsätze'}
        </Typography>
      </Box>

      {visibleRows.length === 0 ? (
        <Box
          sx={{
            p: 5,
            textAlign: 'center',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
          }}
        >
          <AssignmentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Keine Einsätze in dieser Ansicht</Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            {searchTerm || activeGroup !== 'all'
              ? 'Suche oder Statusfilter anpassen.'
              : 'Einsätze entstehen, sobald Sie einer Schicht jemanden zuweisen.'}
          </Typography>
        </Box>
      ) : (
        <AssignmentTable
          rows={visibleRows}
          actions={{
            onAccept: handleAccept,
            onDecline: handleDecline,
            onCancel: handleDelete,
            onDelete: handleDelete,
            onSignDecline: handleSignDecline,
            onGeneratePdf: handleGeneratePDF,
            onReassign: row => handleReassignClick({ id: row.id, shiftId: row.shiftId }),
            busyId: generatingPDF ?? loadingReassignId,
          }}
        />
      )}

      <SignatureDialog
        open={!!signatureOpenFor}
        title="Ablehnung unterschreiben"
        onClose={() => setSignatureOpenFor(null)}
        onSave={handleAdminSignatureSave}
        requireName={true}
        nameLabel="Ihr Name"
      />

      {reassignShift && (
        <AssignShiftDialog
          open={!!reassignShift}
          shift={reassignShift}
          onClose={() => {
            setReassignShift(null);
            refetch();
          }}
        />
      )}
    </PageContainer>
  );
}
