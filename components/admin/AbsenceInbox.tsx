'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  BeachAccessOutlined,
  CheckRounded,
  CloseRounded,
  EventBusyOutlined,
  LocalHospitalOutlined,
  WarningAmberRounded,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatStrip } from '@/components/ui/StatStrip';
import { userService } from '@/lib/services';
import { absenceService, type AbsenceWithConflicts } from '@/lib/services/absences';
import {
  ABSENCE_STATUS_LABEL,
  absencesOverlap,
  daysBetween,
  deRange,
  vacationBalance,
  vacationDays,
  type AbsenceStatus,
} from '@/lib/domain/absence';
import { useHolidayKeys } from '@/lib/hooks/useHolidayKeys';
import { berlinDayKey } from '@/lib/utils/dateKey';
import { toast } from '@/lib/utils/toast';

type Filter = 'open' | 'sick' | 'upcoming' | 'all';

const STATUS_COLOR: Record<AbsenceStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  requested: 'warning',
  approved: 'success',
  rejected: 'error',
  reported: 'info',
  cancelled: 'default',
};

interface Person {
  name: string;
  entitlement?: number;
}

/**
 * Posteingang der Disposition: Urlaubsanträge entscheiden, Krankmeldungen
 * sehen, betroffene Einsätze und gleichzeitige Abwesenheiten im Team erkennen.
 */
export function AbsenceInbox() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? '';
  const qc = useQueryClient();
  const today = berlinDayKey(new Date());
  const year = Number(today.slice(0, 4));
  const [filter, setFilter] = useState<Filter>('open');
  const [rejecting, setRejecting] = useState<AbsenceWithConflicts | null>(null);
  const [reason, setReason] = useState('');

  const {
    data: list = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['absence-inbox', companyId],
    queryFn: () => absenceService.listForCompany(companyId),
    enabled: !!companyId,
  });
  const { data: people = {} } = useQuery({
    queryKey: ['absence-inbox-people', companyId],
    queryFn: async () => {
      const res = await userService.getAll(1, 1000, { companyId });
      const arr = Array.isArray(res) ? res : res.data;
      return Object.fromEntries(
        arr.map(u => [
          u.id,
          {
            name: u.displayName || u.email || 'Unbekannt',
            entitlement: u.vacationDaysPerYear,
          } satisfies Person,
        ])
      ) as Record<string, Person>;
    },
    enabled: !!companyId,
  });
  const { data: holidays = new Set<string>() } = useHolidayKeys([year - 1, year, year + 1]);

  const active = (a: AbsenceWithConflicts) => a.status !== 'cancelled' && a.status !== 'rejected';
  const groups = useMemo(
    () => ({
      open: list
        .filter(a => a.status === 'requested')
        .sort((a, b) => a.fromKey.localeCompare(b.fromKey)),
      sick: list.filter(a => a.type === 'sick' && a.status === 'reported' && a.toKey >= today),
      upcoming: list
        .filter(a => a.status === 'approved' && a.toKey >= today)
        .sort((a, b) => a.fromKey.localeCompare(b.fromKey)),
      all: list,
    }),
    [list, today]
  );
  const absentToday = list.filter(
    a =>
      (a.status === 'approved' || a.status === 'reported') && a.fromKey <= today && today <= a.toKey
  ).length;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['absence-inbox'] });
  };
  const decide = useMutation({
    mutationFn: ({
      a,
      approve,
      note,
    }: {
      a: AbsenceWithConflicts;
      approve: boolean;
      note?: string;
    }) => absenceService.decide(a.id, user!.id, approve, note),
    onSuccess: (_r, v) => {
      toast.success(
        v.approve ? 'Urlaub genehmigt – die Pflegekraft wird benachrichtigt' : 'Antrag abgelehnt'
      );
      setRejecting(null);
      setReason('');
      invalidate();
    },
    onError: e => toast.error(e instanceof Error ? e.message : 'Speichern fehlgeschlagen'),
  });

  const nameOf = (uid: string) => people[uid]?.name ?? '…';

  const row = (a: AbsenceWithConflicts) => {
    const isSick = a.type === 'sick';
    const workdays = vacationDays(a.fromKey, a.toKey, holidays);
    const calDays = daysBetween(a.fromKey, a.toKey).length;
    const affected = a.affectedAssignmentIds?.length ?? 0;
    const overlapping =
      a.status === 'requested'
        ? [
            ...new Set(
              list
                .filter(
                  o => o.id !== a.id && o.userId !== a.userId && active(o) && absencesOverlap(o, a)
                )
                .map(o => nameOf(o.userId))
            ),
          ]
        : [];
    const ent = people[a.userId]?.entitlement;
    const bal =
      a.type === 'vacation' && typeof ent === 'number'
        ? vacationBalance(
            Number(a.fromKey.slice(0, 4)),
            ent,
            list.filter(o => o.userId === a.userId && o.id !== a.id),
            today,
            holidays
          )
        : null;

    return (
      <Box
        key={a.id}
        data-testid="absence-inbox-row"
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
          px: 2,
          py: 1.75,
          borderTop: '1px solid',
          borderColor: 'divider',
          '&:first-of-type': { borderTop: 'none' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flex: 1,
            minWidth: 0,
            width: '100%',
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              bgcolor: t => alpha(isSick ? t.palette.info.main : t.palette.success.main, 0.1),
              color: isSick ? 'info.main' : 'success.main',
            }}
          >
            {isSick ? (
              <LocalHospitalOutlined fontSize="small" />
            ) : (
              <BeachAccessOutlined fontSize="small" />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
              {nameOf(a.userId)} · {isSick ? 'Krank' : 'Urlaub'} {deRange(a.fromKey, a.toKey)}
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {isSick
                ? `${calDays} ${calDays === 1 ? 'Kalendertag' : 'Kalendertage'} · ${a.auProvided ? 'ärztlich festgestellt' : calDays > 3 ? 'eAU ab Tag 4 bei der Krankenkasse abrufen' : 'ohne Attest'}`
                : `${workdays} ${workdays === 1 ? 'Urlaubstag' : 'Urlaubstage'}${bal ? ` · Rest danach ${bal.remaining - (a.status === 'requested' ? workdays : 0)} von ${bal.entitlement}` : ''}`}
              {a.note ? ` · „${a.note}“` : ''}
              {a.status === 'rejected' && a.decisionNote ? ` · Grund: ${a.decisionNote}` : ''}
            </Typography>
            {(affected > 0 || overlapping.length > 0) && (
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.75 }}
              >
                {affected > 0 && a.status !== 'rejected' && a.status !== 'cancelled' && (
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    icon={<WarningAmberRounded />}
                    component={Link}
                    href="/admin/einsaetze"
                    clickable
                    label={
                      affected === 1 ? '1 Einsatz betroffen' : `${affected} Einsätze betroffen`
                    }
                  />
                )}
                {overlapping.length > 0 && (
                  <Tooltip title={overlapping.join(', ')}>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Gleichzeitig weg: ${overlapping.length === 1 ? overlapping[0] : `${overlapping.length} Personen`}`}
                    />
                  </Tooltip>
                )}
              </Stack>
            )}
          </Box>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', pl: { xs: 6, md: 0 } }}>
          {a.status === 'requested' ? (
            <>
              <Button
                size="small"
                variant="text"
                color="inherit"
                startIcon={<CloseRounded />}
                disabled={decide.isPending}
                onClick={() => setRejecting(a)}
              >
                Ablehnen
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckRounded />}
                disabled={decide.isPending}
                onClick={() => decide.mutate({ a, approve: true })}
                aria-label={`Urlaub von ${nameOf(a.userId)} genehmigen`}
              >
                Genehmigen
              </Button>
            </>
          ) : (
            <Chip
              size="small"
              color={STATUS_COLOR[a.status]}
              variant={a.status === 'cancelled' ? 'outlined' : 'filled'}
              label={ABSENCE_STATUS_LABEL[a.status]}
            />
          )}
        </Stack>
      </Box>
    );
  };

  const rows = groups[filter];
  const empty: Record<Filter, string> = {
    open: 'Keine offenen Urlaubsanträge.',
    sick: 'Aktuell ist niemand krank gemeldet.',
    upcoming: 'Kein genehmigter Urlaub geplant.',
    all: 'Noch keine Abwesenheiten.',
  };

  return (
    <>
      <PageHeader
        title="Abwesenheiten"
        subtitle="Urlaubsanträge entscheiden, Krankmeldungen im Blick, Dienstplan bleibt planbar"
      />
      <StatStrip
        aria-label="Abwesenheiten nach Art"
        items={[
          {
            label: 'Offene Anträge',
            value: groups.open.length,
            tone: groups.open.length ? 'attention' : 'default',
            selected: filter === 'open',
            onClick: () => setFilter('open'),
          },
          {
            label: 'Krank gemeldet',
            value: groups.sick.length,
            selected: filter === 'sick',
            onClick: () => setFilter('sick'),
          },
          {
            label: 'Urlaub geplant',
            value: groups.upcoming.length,
            selected: filter === 'upcoming',
            onClick: () => setFilter('upcoming'),
          },
          {
            label: 'Heute abwesend',
            value: absentToday,
            tone: 'muted',
            selected: filter === 'all',
            onClick: () => setFilter('all'),
            hint: 'Alle anzeigen',
          },
        ]}
      />

      {isError ? (
        <Alert
          severity="error"
          action={
            <Button size="small" variant="text" onClick={() => refetch()}>
              Erneut laden
            </Button>
          }
        >
          Abwesenheiten konnten nicht geladen werden.
        </Alert>
      ) : isLoading ? (
        <Stack spacing={1}>
          {[0, 1, 2].map(i => (
            <Skeleton key={i} variant="rounded" height={68} />
          ))}
        </Stack>
      ) : rows.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
          }}
        >
          <EventBusyOutlined sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
          <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{empty[filter]}</Typography>
          <Typography sx={{ fontSize: 14 }}>
            Neue Anträge und Krankmeldungen melden sich über die Glocke.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {rows.map(row)}
        </Box>
      )}

      <Dialog open={!!rejecting} onClose={() => setRejecting(null)} fullWidth maxWidth="xs">
        <DialogTitle>Urlaubsantrag ablehnen</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, mb: 2 }}>
            {rejecting &&
              `${nameOf(rejecting.userId)}, ${deRange(rejecting.fromKey, rejecting.toKey)}. Die Begründung sieht die Pflegekraft.`}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Begründung"
            value={reason}
            onChange={e => setReason(e.target.value.slice(0, 300))}
            helperText="z. B. Personalengpass in der Woche – bitte anderen Zeitraum wählen"
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="inherit" onClick={() => setRejecting(null)}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={reason.trim().length < 5 || decide.isPending}
            onClick={() =>
              rejecting && decide.mutate({ a: rejecting, approve: false, note: reason })
            }
          >
            Ablehnen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
