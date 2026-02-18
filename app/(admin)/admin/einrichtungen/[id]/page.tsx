'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { PageContainer } from '@/components/layout/PageContainer';
import { facilityService } from '@/lib/services/facilities';
import { shiftService, type Shift } from '@/lib/services/shifts';
import { assignmentService, type Assignment } from '@/lib/services/assignments';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';

export default function AdminFacilityDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [tab, setTab] = useState(0);

  const facilityQuery = useQuery({
    queryKey: ['facility', id],
    queryFn: async () => (id ? await facilityService.getById(id) : null),
    enabled: !!id,
  });

  const shiftsQuery = useQuery({
    queryKey: ['facility-shifts', id],
    queryFn: async () => (id ? await shiftService.getAll({ facilityId: id as string }) : []),
    enabled: !!id,
  });

  const assignmentsQuery = useQuery({
    queryKey: ['facility-assignments', id],
    queryFn: async () => {
      if (!id) return [] as Assignment[];
      const result = await assignmentService.getAll(1, 200);
      return result.data;
    },
    enabled: !!id,
  });

  if (facilityQuery.isLoading || shiftsQuery.isLoading || assignmentsQuery.isLoading) {
    return <LoadingSpinner message="Einrichtungsdaten werden geladen..." />;
  }
  if (facilityQuery.error || shiftsQuery.error || assignmentsQuery.error) {
    return (
      <ErrorDisplay
        error={(facilityQuery.error || shiftsQuery.error || assignmentsQuery.error) as Error}
      />
    );
  }
  if (!facilityQuery.data) return null;

  const facility = facilityQuery.data as {
    name?: string;
    address?: string;
    contactName?: string;
    phone?: string;
    email?: string;
  };

  return (
    <PageContainer maxWidth="wide">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {facility.name || 'Einrichtung'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {facility.address || '-'}
        </Typography>
      </Box>

      <Paper className="glass" sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Übersicht" />
          <Tab label="Schichten" />
          <Tab label="Zuweisungen" />
          <Tab label="Stationen" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="glass">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Kontaktdaten
                </Typography>
                <Typography variant="body2">Kontakt: {facility.contactName || '-'}</Typography>
                <Typography variant="body2">Telefon: {facility.phone || '-'}</Typography>
                <Typography variant="body2">E-Mail: {facility.email || '-'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="glass">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Statistiken
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Card className="glass">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Schichten
                        </Typography>
                        <Typography variant="h6">{shiftsQuery.data?.length || 0}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Card className="glass">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Zuweisungen
                        </Typography>
                        <Typography variant="h6">{assignmentsQuery.data?.length || 0}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Card className="glass">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Schichten
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Datum</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>Ende</TableCell>
                  <TableCell>Rolle</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(shiftsQuery.data || []).slice(0, 50).map((s: Shift) => {
                  const d = new Date(s.date);
                  return (
                    <TableRow key={s.id} hover>
                      <TableCell>{format(d, 'dd.MM.yyyy')}</TableCell>
                      <TableCell>{s.startTime || '-'}</TableCell>
                      <TableCell>{s.endTime || '-'}</TableCell>
                      <TableCell>{s.type || '-'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={s.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card className="glass">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Zuweisungen
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mitarbeiter</TableCell>
                  <TableCell>Zeitraum</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(assignmentsQuery.data || []).slice(0, 50).map((a: Assignment) => {
                  const aAny = a as unknown as {
                    startDate?: string | Date;
                    endDate?: string | Date;
                    employeeName?: string;
                    status?: string;
                    id: string;
                    declinedAt?: Date | string;
                  };
                  const s = aAny.startDate ? new Date(aAny.startDate) : undefined;
                  const e = aAny.endDate ? new Date(aAny.endDate) : undefined;
                  return (
                    <TableRow key={aAny.id} hover>
                      <TableCell>{aAny.employeeName || '-'}</TableCell>
                      <TableCell>
                        {s && e ? `${format(s, 'dd.MM.yyyy')} - ${format(e, 'dd.MM.yyyy')}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={aAny.status || 'assigned'} />
                        {aAny.status === 'declined' && aAny.declinedAt && (
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}
                          >
                            Abgelehnt am{' '}
                            {format(
                              aAny.declinedAt instanceof Date
                                ? aAny.declinedAt
                                : new Date(aAny.declinedAt),
                              'dd.MM.yyyy'
                            )}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Card className="glass">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Stationen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stationsverwaltung folgt (Datenquelle: facilityService)
            </Typography>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
