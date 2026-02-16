'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { assignmentService } from '@/lib/services/assignments';
import { shiftService } from '@/lib/services/shifts';
import { facilityService } from '@/lib/services/facilities';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logging';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Stack,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { AccessTime, LocationOn, Person, Phone, Email, Event } from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState, useMemo } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`assignments-tabpanel-${index}`}
      aria-labelledby={`assignments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MyAssignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Lade alle Assignments des Benutzers
  const {
    data: assignments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['myAssignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await assignmentService.getByUserId(user.id);
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Lade Details für alle Assignments
  const { data: assignmentDetails = [], isLoading: loadingDetails } = useQuery({
    queryKey: ['assignmentDetailsList', assignments.map(a => a.id).join(',')],
    queryFn: async () => {
      const details = [];
      for (const assignment of assignments) {
        try {
          const shift = await shiftService.getById(assignment.shiftId);
          if (!shift) continue;

          const facility = shift.facilityId
            ? await facilityService.getById(shift.facilityId)
            : null;
          const station = facility?.stations?.find(s => s.id === shift.stationId);

          details.push({
            assignment,
            shift,
            facility,
            station,
          });
        } catch (error) {
          logger.error(
            `Error loading details for assignment ${assignment.id}`,
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
      return details;
    },
    enabled: assignments.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filtere Assignments nach Status
  const filteredAssignments = useMemo(() => {
    switch (activeTab) {
      case 0: // Alle
        return assignmentDetails;
      case 1: // Ausstehend
        return assignmentDetails.filter(
          d => d.assignment.status === 'requested' || d.assignment.status === 'pending'
        );
      case 2: // Angenommen
        return assignmentDetails.filter(
          d => d.assignment.status === 'accepted' || d.assignment.status === 'assigned'
        );
      case 3: // Abgelehnt
        return assignmentDetails.filter(d => d.assignment.status === 'declined');
      case 4: // Abgeschlossen
        return assignmentDetails.filter(
          d => d.assignment.status === 'completed' || d.assignment.status === 'done'
        );
      default:
        return assignmentDetails;
    }
  }, [assignmentDetails, activeTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'accepted':
      case 'assigned':
        return 'success';
      case 'requested':
      case 'pending':
        return 'warning';
      case 'declined':
        return 'error';
      case 'completed':
      case 'done':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'accepted':
        return 'Angenommen';
      case 'assigned':
        return 'Zugewiesen';
      case 'requested':
        return 'Angefragt';
      case 'pending':
        return 'Ausstehend';
      case 'declined':
        return 'Abgelehnt';
      case 'completed':
        return 'Abgeschlossen';
      case 'done':
        return 'Erledigt';
      default:
        return status;
    }
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: 'text.primary',
            fontWeight: 700,
            mb: 1,
          }}
        >
          Meine Einsätze
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Übersicht über alle Ihre zugewiesenen Einsätze
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Alle" />
        <Tab label="Ausstehend" />
        <Tab label="Angenommen" />
        <Tab label="Abgelehnt" />
        <Tab label="Abgeschlossen" />
      </Tabs>

      {filteredAssignments.length === 0 ? (
        <Alert severity="info">
          {activeTab === 0
            ? 'Sie haben noch keine Einsätze.'
            : `Keine Einsätze in dieser Kategorie.`}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredAssignments.map(({ assignment, shift, facility, station }) => (
            <Grid size={{ xs: 12, md: 6 }} key={assignment.id}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {facility?.name || 'Unbekannte Einrichtung'}
                    </Typography>
                    <Chip
                      label={getStatusLabel(assignment.status)}
                      color={getStatusColor(assignment.status)}
                      size="small"
                    />
                  </Box>

                  <Stack spacing={2}>
                    {/* Datum und Zeit */}
                    {shift && (
                      <Stack direction="row" alignItems="flex-start" spacing={1}>
                        <Event sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Datum
                          </Typography>
                          <Typography variant="body1">
                            {shift.date
                              ? format(new Date(shift.date), 'EEEE, dd.MM.yyyy', { locale: de })
                              : 'Nicht angegeben'}
                          </Typography>
                        </Box>
                      </Stack>
                    )}

                    {/* Arbeitszeiten */}
                    {shift && (
                      <Stack direction="row" alignItems="flex-start" spacing={1}>
                        <AccessTime sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Arbeitszeiten
                          </Typography>
                          <Typography variant="body1">
                            {shift.startTime} - {shift.endTime}
                          </Typography>
                          {shift.type && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {shift.type}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    )}

                    {/* Einrichtung und Adresse */}
                    {facility && (
                      <Stack direction="row" alignItems="flex-start" spacing={1}>
                        <LocationOn sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Einrichtung
                          </Typography>
                          <Typography variant="body1">
                            {facility.name}
                            {station && ` - ${station.name}`}
                          </Typography>
                          {facility.address && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {facility.address}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    )}

                    {/* Ansprechpartner */}
                    {facility?.contactPerson && (
                      <Stack direction="row" alignItems="flex-start" spacing={1}>
                        <Person sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Ansprechpartner
                          </Typography>
                          <Typography variant="body1">{facility.contactPerson}</Typography>
                          {facility.phone && (
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                              <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {facility.phone}
                              </Typography>
                            </Stack>
                          )}
                          {facility.email && (
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                              <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {facility.email}
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                    )}

                    {/* Notizen */}
                    {assignment.notes && (
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          Notizen
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {assignment.notes}
                        </Typography>
                      </Box>
                    )}

                    {/* Status-Informationen */}
                    <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                        {assignment.acceptedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Angenommen:{' '}
                            {format(new Date(assignment.acceptedAt), 'dd.MM.yyyy HH:mm')}
                          </Typography>
                        )}
                        {assignment.declinedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Abgelehnt: {format(new Date(assignment.declinedAt), 'dd.MM.yyyy HH:mm')}
                          </Typography>
                        )}
                        {assignment.completedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Abgeschlossen:{' '}
                            {format(new Date(assignment.completedAt), 'dd.MM.yyyy HH:mm')}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
