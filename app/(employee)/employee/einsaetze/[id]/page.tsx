'use client';

import { logger } from '@/lib/logging';

import { useAuth } from '@/contexts/AuthContext';
import { PageBreadcrumbs } from '@/components/layout/PageBreadcrumbs';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useDomainAssignment } from '@/lib/hooks/useDomainAssignments';
import { assignmentService } from '@/lib/services/assignments';
import { facilityService } from '@/lib/services/facilities';
import { cloudFunctions } from '@/lib/services/cloudFunctions';
import { toast } from '@/lib/utils/toast';
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { AccessTime, LocationOn, CheckCircle, Cancel, Description } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { DeclineAssignmentModal } from '@/components/assignments/DeclineAssignmentModal';

export default function AssignmentDetailPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [declineModalOpen, setDeclineModalOpen] = useState(false);

  const { assignment, isLoading, error } = useDomainAssignment(id ?? null);

  const { data: facility } = useQuery({
    queryKey: ['facility', assignment?.facilityId],
    queryFn: () => facilityService.getById(assignment!.facilityId!),
    enabled: !!assignment?.facilityId,
  });

  const isCandidate =
    assignment?.status === 'published' &&
    user?.id &&
    (assignment.candidateUserIds ?? []).includes(user.id);
  const isAssigned = assignment?.userId === user?.id;
  const canAcceptOrDecline = isCandidate;
  const alreadyAccepted =
    isAssigned && (assignment?.status === 'accepted' || assignment?.status === 'assigned');

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !assignment?.id) throw new Error('Nicht autorisiert');
      await assignmentService.update(assignment.id, {
        userId: user.id,
        status: 'accepted',
        acceptedAt: new Date(),
      });
      try {
        await cloudFunctions.notifyFacilityForAssignment({
          assignmentId: assignment.id,
          employeeName: user.displayName || user.email || 'Mitarbeiter',
          contact: user.phone,
        });
      } catch (e) {
        logger.warn('Notify facility failed', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['domain-assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['domain-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Einsatz angenommen. Die Einrichtung wurde benachrichtigt.');
      router.push('/employee/einsaetze');
    },
    onError: err => {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Annehmen');
    },
  });

  const handleDeclineConfirm = async (
    assignmentId: string,
    reason: string,
    signatureDataUrl: string
  ) => {
    await cloudFunctions.declineAssignmentWithSignature({
      assignmentId,
      reason,
      signatureDataUrl,
    });
    queryClient.invalidateQueries({ queryKey: ['assignment', id] });
    queryClient.invalidateQueries({ queryKey: ['domain-assignment', id] });
    queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
    queryClient.invalidateQueries({ queryKey: ['domain-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
    toast.success('Einsatz abgelehnt.');
    setDeclineModalOpen(false);
    router.push('/employee/einsaetze');
  };

  if (isLoading || !assignment) {
    return <LoadingSpinner message={isLoading ? 'Einsatz wird geladen…' : undefined} />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Einsatz konnte nicht geladen werden.</Alert>
        <Button component={Link} href="/employee/einsaetze" sx={{ mt: 2 }}>
          Zurück zu Meine Einsätze
        </Button>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Bitte anmelden, um diesen Einsatz zu sehen.</Alert>
      </Box>
    );
  }

  if (!canAcceptOrDecline && !isAssigned) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Dieser Einsatz ist für dich nicht verfügbar oder wurde bereits vergeben.
        </Alert>
        <Button component={Link} href="/employee/einsaetze" sx={{ mt: 2 }}>
          Zurück zu Meine Einsätze
        </Button>
      </Box>
    );
  }

  const facilityName = facility?.name ?? assignment.facilityId ?? 'Einrichtung';
  const startDate = assignment.startDate
    ? format(
        assignment.startDate instanceof Date
          ? assignment.startDate
          : new Date(assignment.startDate),
        'EEEE, d. MMMM yyyy',
        { locale: de }
      )
    : '–';
  const timeRange =
    assignment.startTime && assignment.endTime
      ? `${assignment.startTime} – ${assignment.endTime}`
      : '–';

  return (
    <PageContainer maxWidth="narrow">
      <PageBreadcrumbs
        items={[
          { label: 'Einsätze', href: '/employee/einsaetze' },
          { label: facilityName || 'Einsatzdetails' },
        ]}
      />
      <PageHeader
        title="Einsatzdetails"
        subtitle={facilityName}
        actions={
          <Button component={Link} href="/employee/einsaetze" variant="outlined" size="medium">
            Zurück
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn color="action" />
              <Typography variant="subtitle1" fontWeight={600}>
                {facilityName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime color="action" />
              <Typography variant="body1">{startDate}</Typography>
            </Box>
            <Typography variant="body1">
              <strong>Zeit:</strong> {timeRange}
            </Typography>
            {assignment.qualification && (
              <Typography variant="body1">
                <strong>Qualifikation:</strong> {assignment.qualification}
              </Typography>
            )}
          </Stack>

          {alreadyAccepted && (
            <>
              <Alert severity="success" sx={{ mt: 2 }}>
                Du hast diesen Einsatz angenommen.
              </Alert>
              <Button
                component={Link}
                href={`/employee/formulare/einsaetze/${assignment.id}`}
                variant="outlined"
                startIcon={<Description />}
                sx={{ alignSelf: 'flex-start' }}
              >
                Einsatzmitteilung (§ 11 AÜG) anzeigen & Formular
              </Button>
            </>
          )}

          {canAcceptOrDecline && (
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircle />}
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? 'Wird übernommen…' : 'Annehmen'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => setDeclineModalOpen(true)}
                disabled={acceptMutation.isPending}
              >
                Ablehnen
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      <DeclineAssignmentModal
        open={declineModalOpen}
        assignmentId={id}
        onClose={() => setDeclineModalOpen(false)}
        onConfirm={handleDeclineConfirm}
      />
    </PageContainer>
  );
}
