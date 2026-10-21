'use client';

import { Alert, Box, Button, Chip, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { EventBusyOutlined, LocalHospitalOutlined, WarningAmberRounded } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatStrip } from '@/components/ui/StatStrip';
import { userService } from '@/lib/services';
import { absenceService, type AbsenceWithConflicts } from '@/lib/services/absences';
import { ABSENCE_STATUS_LABEL, absencesOverlap, daysBetween, deRange } from '@/lib/domain/absence';
import { berlinDayKey } from '@/lib/utils/dateKey';

type Filter = 'current' | 'upcoming' | 'all';

/**
 * Krankmeldungen der Firma für die Disposition: wer ist krank, welche
 * Einsätze sind betroffen, wer fehlt gleichzeitig. Keine Urlaubsverwaltung.
 */
export function AbsenceInbox() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? '';
  const today = berlinDayKey(new Date());
  const [filter, setFilter] = useState<Filter>('current');

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
  const { data: names = {} } = useQuery({
    queryKey: ['absence-inbox-people', companyId],
    queryFn: async () => {
      const res = await userService.getAll(1, 1000, { companyId });
      const arr = Array.isArray(res) ? res : res.data;
      return Object.fromEntries(arr.map(u => [u.id, u.displayName || u.email || 'Unbekannt'])) as Record<string, string>;
    },
    enabled: !!companyId,
  });

  const reported = useMemo(() => list.filter(a => a.status === 'reported'), [list]);
  const groups = useMemo(
    () => ({
      current: reported.filter(a => a.fromKey <= today && today <= a.toKey),
      upcoming: reported.filter(a => a.fromKey > today).sort((a, b) => a.fromKey.localeCompare(b.fromKey)),
      all: list,
    }),
    [list, reported, today]
  );
  const nameOf = (uid: string) => names[uid] ?? '…';

  const row = (a: AbsenceWithConflicts) => {
    const calDays = daysBetween(a.fromKey, a.toKey).length;
    const affected = a.status === 'reported' ? (a.affectedAssignmentIds?.length ?? 0) : 0;
    const overlapping =
      a.status === 'reported'
        ? [...new Set(reported.filter(o => o.id !== a.id && o.userId !== a.userId && absencesOverlap(o, a)).map(o => nameOf(o.userId)))]
        : [];
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0, width: '100%' }}>
          <Box
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              bgcolor: t => alpha(t.palette.info.main, 0.1),
              color: 'info.main',
            }}
          >
            <LocalHospitalOutlined fontSize="small" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
              {nameOf(a.userId)} · Krank {deRange(a.fromKey, a.toKey)}
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {calDays} {calDays === 1 ? 'Kalendertag' : 'Kalendertage'} ·{' '}
              {a.auProvided ? 'ärztlich festgestellt' : calDays > 3 ? 'eAU ab Tag 4 bei der Krankenkasse abrufen' : 'ohne Attest'}
            </Typography>
            {(affected > 0 || overlapping.length > 0) && (
              <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.75 }}>
                {affected > 0 && (
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    icon={<WarningAmberRounded />}
                    component={Link}
                    href="/admin/einsaetze"
                    clickable
                    label={affected === 1 ? '1 Einsatz betroffen' : `${affected} Einsätze betroffen`}
                  />
                )}
                {overlapping.length > 0 && (
                  <Tooltip title={overlapping.join(', ')}>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Gleichzeitig krank: ${overlapping.length === 1 ? overlapping[0] : `${overlapping.length} Personen`}`}
                    />
                  </Tooltip>
                )}
              </Stack>
            )}
          </Box>
        </Box>
        <Chip
          size="small"
          color={a.status === 'cancelled' ? 'default' : 'info'}
          variant={a.status === 'cancelled' ? 'outlined' : 'filled'}
          label={ABSENCE_STATUS_LABEL[a.status]}
          sx={{ ml: { xs: 6, md: 0 } }}
        />
      </Box>
    );
  };

  const rows = groups[filter];
  const empty: Record<Filter, string> = {
    current: 'Heute ist niemand krank gemeldet.',
    upcoming: 'Keine Krankmeldungen ab morgen.',
    all: 'Noch keine Krankmeldungen.',
  };

  return (
    <>
      <PageHeader title="Krankmeldungen" subtitle="Wer ist krank, welche Einsätze sind betroffen – Krankmeldungen gelten sofort" />
      <StatStrip
        aria-label="Krankmeldungen"
        items={[
          { label: 'Heute krank', value: groups.current.length, tone: groups.current.length ? 'attention' : 'default', selected: filter === 'current', onClick: () => setFilter('current') },
          { label: 'Ab morgen', value: groups.upcoming.length, selected: filter === 'upcoming', onClick: () => setFilter('upcoming') },
          { label: 'Alle', value: list.length, tone: 'muted', selected: filter === 'all', onClick: () => setFilter('all') },
        ]}
      />

      {isError ? (
        <Alert severity="error" action={<Button size="small" variant="text" onClick={() => refetch()}>Erneut laden</Button>}>
          Krankmeldungen konnten nicht geladen werden.
        </Alert>
      ) : isLoading ? (
        <Stack spacing={1}>
          {[0, 1, 2].map(i => (
            <Skeleton key={i} variant="rounded" height={68} />
          ))}
        </Stack>
      ) : rows.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
          <EventBusyOutlined sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
          <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{empty[filter]}</Typography>
          <Typography sx={{ fontSize: 14 }}>Neue Krankmeldungen melden sich über die Glocke.</Typography>
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
          {rows.map(row)}
        </Box>
      )}
    </>
  );
}
