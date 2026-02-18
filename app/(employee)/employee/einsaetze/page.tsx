'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageContainer } from '@/components/layout/PageContainer';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { useDomainAssignments } from '@/lib/hooks/useDomainAssignments';
import { shiftService } from '@/lib/services/shifts';
import { facilityService } from '@/lib/services/facilities';
import { documentService } from '@/lib/services';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logging';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
} from '@mui/material';
import { AccessTime, LocationOn, Description } from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState, useMemo } from 'react';

type AssignmentDetail = {
  assignment: import('@/lib/types/assignment').Assignment & { formStatus?: string; pdfUrl?: string };
  shift: Awaited<ReturnType<typeof shiftService.getById>>;
  facility: Awaited<ReturnType<typeof facilityService.getById>> | null;
  station: { id: string; name: string } | undefined;
};

export default function MyAssignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const { assignments = [], isLoading, error } = useDomainAssignments({
    limit: 100,
  });

  const { data: assignmentDetails = [], isLoading: loadingDetails } = useQuery({
    queryKey: ['assignmentDetailsList', assignments.map(a => a.id).join(',')],
    queryFn: async () => {
      const details: AssignmentDetail[] = [];
      for (const assignment of assignments) {
        try {
          const shift = await shiftService.getById(assignment.shiftId);
          if (!shift) continue;
          const facility = shift.facilityId
            ? await facilityService.getById(shift.facilityId)
            : null;
          const station = facility?.stations?.find(s => s.id === shift.stationId);
          details.push({ assignment, shift, facility, station });
        } catch (err) {
          logger.error(`Error loading details for assignment ${assignment.id}`, err instanceof Error ? err : new Error(String(err)));
        }
      }
      return details;
    },
    enabled: assignments.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userDocuments = [] } = useQuery({
    queryKey: ['userDocuments', user?.id],
    queryFn: () => (user?.id ? documentService.getByUserId(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const signedDetails = useMemo(() => {
    return assignmentDetails.filter(
      d => (d.assignment as { formStatus?: string }).formStatus === 'acknowledged' || (d.assignment as { formStatus?: string }).formStatus === 'declined'
    );
  }, [assignmentDetails]);

  const countAll = signedDetails.length;
  const countAccepted = signedDetails.filter(d => (d.assignment as { formStatus?: string }).formStatus === 'acknowledged').length;
  const countDeclined = signedDetails.filter(d => (d.assignment as { formStatus?: string }).formStatus === 'declined').length;

  const filteredAssignments = useMemo(() => {
    switch (activeTab) {
      case 0:
        return signedDetails;
      case 1:
        return signedDetails.filter(d => (d.assignment as { formStatus?: string }).formStatus === 'acknowledged');
      case 2:
        return signedDetails.filter(d => (d.assignment as { formStatus?: string }).formStatus === 'declined');
      default:
        return signedDetails;
    }
  }, [signedDetails, activeTab]);

  const getPdfUrl = (assignmentId: string, assignment: { pdfUrl?: string }) => {
    if (assignment.pdfUrl) return assignment.pdfUrl;
    const doc = userDocuments.find(d => d.notes?.includes(assignmentId) || d.name?.toLowerCase().includes('einsatzmitteilung'));
    return doc?.url ?? null;
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getFormStatusLabel = (formStatus: string | undefined): string => {
    if (formStatus === 'acknowledged') return 'Angenommen';
    if (formStatus === 'declined') return 'Abgelehnt';
    return '–';
  };

  const getFormStatusColor = (formStatus: string | undefined): 'success' | 'error' | 'default' => {
    if (formStatus === 'acknowledged') return 'success';
    if (formStatus === 'declined') return 'error';
    return 'default';
  };

  if (authLoading || isLoading || loadingDetails) {
    return <LoadingSpinner message="Einsätze werden geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
        }}
      >
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Bitte melde dich an, um fortzufahren
        </Typography>
      </Box>
    );
  }

  return (
    <PageContainer maxWidth="standard">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700, mb: 0.5 }}>
          Meine Einsatzmitteilungen
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Ihre unterschriebenen Einsatzmitteilungen (§ 11 AÜG)
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          '& .Mui-selected': { color: 'primary.main' },
        }}
      >
        <Tab label={`Alle (${countAll})`} id="einsatz-tab-0" aria-controls="einsatz-tabpanel-0" />
        <Tab label={`Angenommen (${countAccepted})`} id="einsatz-tab-1" aria-controls="einsatz-tabpanel-1" />
        <Tab label={`Abgelehnt (${countDeclined})`} id="einsatz-tab-2" aria-controls="einsatz-tabpanel-2" />
      </Tabs>

      {filteredAssignments.length === 0 ? (
        <Alert severity="info">
          {activeTab === 0
            ? 'Sie haben noch keine unterschriebenen Einsatzmitteilungen.'
            : 'Keine Einträge in dieser Kategorie.'}
        </Alert>
      ) : (
        <TableContainer component={Paper} className="glass" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="medium" aria-label="Einsatzmitteilungen">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Einrichtung / Adresse
                </TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Zeitraum
                </TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Unterschrieben am
                </TableCell>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Dokument
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssignments.map(({ assignment, shift, facility }) => {
                if (!assignment) return null;
                const formStatus = (assignment as { formStatus?: string }).formStatus;
                const formSignedAt = (assignment as { formSignedAt?: Date | string }).formSignedAt;
                const signedAtStr = formSignedAt
                  ? format(new Date(formSignedAt), 'dd.MM.yyyy HH:mm', { locale: de })
                  : '–';
                const facilityAddress = facility
                  ? [facility.name, facility.address].filter(Boolean).join(', ') || '–'
                  : '–';
                const shiftDateStr = shift?.date
                  ? format(new Date(shift.date), 'dd.MM.yyyy', { locale: de })
                  : '–';
                const pdfUrl = getPdfUrl(assignment.id, assignment as { pdfUrl?: string });

                return (
                  <TableRow key={assignment.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">{facilityAddress}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">{shiftDateStr}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getFormStatusLabel(formStatus)}
                        color={getFormStatusColor(formStatus)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{signedAtStr}</Typography>
                    </TableCell>
                    <TableCell>
                      {pdfUrl ? (
                        <Button
                          variant="contained"
                          size="small"
                          component="a"
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<Description />}
                          sx={{ textTransform: 'none' }}
                        >
                          PDF anzeigen
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          –
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PageContainer>
  );
}
