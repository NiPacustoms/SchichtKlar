'use client';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { BeachAccessOutlined, EventBusyOutlined, LocalHospitalOutlined } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatStrip } from '@/components/ui/StatStrip';
import { userService } from '@/lib/services';
import { absenceService, type AbsenceWithConflicts } from '@/lib/services/absences';
import {
  ABSENCE_STATUS_LABEL,
  daysBetween,
  deRange,
  vacationBalance,
  vacationDays,
  type AbsenceStatus,
} from '@/lib/domain/absence';
import { useHolidayKeys } from '@/lib/hooks/useHolidayKeys';
import { berlinDayKey } from '@/lib/utils/dateKey';
import { toast } from '@/lib/utils/toast';

const STATUS_COLOR: Record<AbsenceStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  requested: 'warning',
  approved: 'success',
  rejected: 'error',
  reported: 'info',
  cancelled: 'default',
};

type DialogKind = 'vacation' | 'sick' | null;

/** Urlaub beantragen, krank melden, Resturlaub – für Pflegekräfte */
export default function EmployeeAbsencesPage() {
  const { user } = useAuth();
  const uid = user?.id ?? '';
  const companyId = user?.companyId ?? '';
  const qc = useQueryClient();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const today = berlinDayKey(new Date());
  const year = Number(today.slice(0, 4));

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [fromKey, setFromKey] = useState(today);
  const [toKey, setToKey] = useState(today);
  const [note, setNote] = useState('');
  const [au, setAu] = useState(false);
  const [extending, setExtending] = useState<AbsenceWithConflicts | null>(null);
  const [extendTo, setExtendTo] = useState(today);

  // ?neu=krank bzw. ?neu=urlaub öffnet direkt den passenden Dialog
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('neu');
    if (p === 'krank') openDialog('sick');
    if (p === 'urlaub') openDialog('vacation');
  }, []);

  const {
    data: list = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['absences-mine', uid, companyId],
    queryFn: () => absenceService.listMine(uid, companyId),
    enabled: !!uid && !!companyId,
  });
  const { data: holidays = new Set<string>() } = useHolidayKeys([year - 1, year, year + 1]);

  // Anspruch aus dem Personalstamm (das Auth-Profil trägt nur Basisfelder)
  const { data: profile } = useQuery({
    queryKey: ['absences-profile', uid],
    queryFn: () => userService.getById(uid),
    enabled: !!uid,
  });
  const entitlement = profile?.vacationDaysPerYear;
  const balance = useMemo(
    () =>
      typeof entitlement === 'number'
        ? vacationBalance(year, entitlement, list, today, holidays)
        : null,
    [entitlement, year, list, today, holidays]
  );
  const sickDaysThisYear = useMemo(
    () =>
      list
        .filter(a => a.type === 'sick' && a.status === 'reported')
        .reduce(
          (n, a) =>
            n + daysBetween(a.fromKey, a.toKey).filter(k => k.startsWith(String(year))).length,
          0
        ),
    [list, year]
  );

  function openDialog(kind: Exclude<DialogKind, null>) {
    const t = berlinDayKey(new Date());
    setFromKey(t);
    setToKey(t);
    setNote('');
    setAu(false);
    setDialog(kind);
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: ['absences-mine'] });
  const rangeError =
    !fromKey || !toKey
      ? 'Bitte Zeitraum wählen'
      : toKey < fromKey
        ? 'Das Ende liegt vor dem Beginn'
        : '';
  const requestedDays = !rangeError ? vacationDays(fromKey, toKey, holidays) : 0;
  const overlapsExisting = useMemo(
    () =>
      !rangeError &&
      list.some(
        a =>
          ['requested', 'approved', 'reported'].includes(a.status) &&
          a.fromKey <= toKey &&
          fromKey <= a.toKey
      ),
    [list, fromKey, toKey, rangeError]
  );

  const submit = useMutation({
    mutationFn: async () => {
      if (dialog === 'vacation')
        await absenceService.requestVacation({ userId: uid, companyId, fromKey, toKey, note });
      else
        await absenceService.reportSick({ userId: uid, companyId, fromKey, toKey, auProvided: au });
    },
    onSuccess: () => {
      toast.success(
        dialog === 'vacation'
          ? 'Urlaubsantrag gesendet – die Disposition entscheidet'
          : 'Krankmeldung gesendet – gute Besserung!'
      );
      setDialog(null);
      invalidate();
    },
    onError: e => toast.error(e instanceof Error ? e.message : 'Senden fehlgeschlagen'),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => absenceService.cancel(id),
    onSuccess: () => {
      toast.success('Zurückgezogen');
      invalidate();
    },
    onError: () => toast.error('Zurückziehen fehlgeschlagen'),
  });
  const updateSick = useMutation({
    mutationFn: (p: { id: string; toKey?: string; auProvided?: boolean }) =>
      absenceService.updateSick(p.id, p),
    onSuccess: () => {
      toast.success('Krankmeldung aktualisiert');
      setExtending(null);
      invalidate();
    },
    onError: () => toast.error('Aktualisieren fehlgeschlagen'),
  });

  const current = list.filter(a => a.status !== 'cancelled' && a.toKey >= today);
  const past = list.filter(a => a.status === 'cancelled' || a.toKey < today);

  const row = (a: AbsenceWithConflicts) => {
    const workdays = vacationDays(a.fromKey, a.toKey, holidays);
    const calDays = daysBetween(a.fromKey, a.toKey).length;
    const isSick = a.type === 'sick';
    return (
      <Box
        key={a.id}
        data-testid="absence-row"
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
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
              {isSick ? 'Krank' : 'Urlaub'} · {deRange(a.fromKey, a.toKey)}
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {isSick
                ? `${calDays} ${calDays === 1 ? 'Kalendertag' : 'Kalendertage'}${a.auProvided ? ' · ärztlich festgestellt' : ''}`
                : `${workdays} ${workdays === 1 ? 'Urlaubstag' : 'Urlaubstage'}`}
              {a.note ? ` · ${a.note}` : ''}
              {a.status === 'rejected' && a.decisionNote ? ` · Grund: ${a.decisionNote}` : ''}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', pl: { xs: 6, sm: 0 } }}>
          <Chip
            size="small"
            color={STATUS_COLOR[a.status]}
            variant={a.status === 'cancelled' ? 'outlined' : 'filled'}
            label={ABSENCE_STATUS_LABEL[a.status]}
          />
          {isSick && a.status === 'reported' && a.toKey >= today && (
            <>
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  setExtending(a);
                  setExtendTo(a.toKey);
                }}
              >
                Verlängern
              </Button>
              {!a.auProvided && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => updateSick.mutate({ id: a.id, auProvided: true })}
                >
                  Arzt war da
                </Button>
              )}
            </>
          )}
          {(a.status === 'requested' ||
            (isSick && a.status === 'reported' && a.fromKey > today)) && (
            <Button
              size="small"
              variant="text"
              color="inherit"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(a.id)}
            >
              Zurückziehen
            </Button>
          )}
        </Stack>
      </Box>
    );
  };

  const section = (title: string, items: AbsenceWithConflicts[]) =>
    items.length > 0 && (
      <Box sx={{ mb: 3 }}>
        <Typography
          component="h2"
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {items.map(row)}
        </Box>
      </Box>
    );

  return (
    <PageContainer maxWidth="standard" withBottomNav>
      <PageHeader
        title="Urlaub & Krankheit"
        subtitle="Urlaub beantragen, krank melden und Resturlaub im Blick behalten"
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<LocalHospitalOutlined />}
              onClick={() => openDialog('sick')}
            >
              Krank melden
            </Button>
            <Button
              variant="contained"
              startIcon={<BeachAccessOutlined />}
              onClick={() => openDialog('vacation')}
            >
              Urlaub beantragen
            </Button>
          </Stack>
        }
      />

      <StatStrip
        aria-label={`Urlaubskonto ${year}`}
        items={
          balance
            ? [
                { label: `Anspruch ${year}`, value: balance.entitlement },
                { label: 'Genommen', value: balance.taken, tone: 'muted' },
                { label: 'Geplant', value: balance.planned },
                {
                  label: 'Beantragt',
                  value: balance.requested,
                  tone: balance.requested ? 'attention' : 'muted',
                },
                {
                  label: 'Resturlaub',
                  value: balance.remaining,
                  tone: balance.remaining < 0 ? 'attention' : 'default',
                  hint: 'Anspruch minus genommen und geplant',
                },
              ]
            : [
                {
                  label: 'Beantragt',
                  value: list.filter(a => a.status === 'requested').length,
                  tone: 'muted',
                },
                { label: `Krankheitstage ${year}`, value: sickDaysThisYear, tone: 'muted' },
              ]
        }
      />
      {!balance && !isLoading && profile && (
        <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
          Ihr Urlaubsanspruch ist noch nicht hinterlegt – die Disposition trägt ihn im Personalstamm
          ein. Anträge können Sie trotzdem stellen.
        </Alert>
      )}

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
            <Skeleton key={i} variant="rounded" height={64} />
          ))}
        </Stack>
      ) : list.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <EventBusyOutlined sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
          <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
            Noch keine Abwesenheiten
          </Typography>
          <Typography sx={{ fontSize: 14 }}>
            Beantragter Urlaub und Krankmeldungen erscheinen hier.
          </Typography>
        </Box>
      ) : (
        <>
          {section('Aktuell & geplant', current)}
          {section('Vergangen', past)}
        </>
      )}

      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        fullWidth
        maxWidth="xs"
        fullScreen={fullScreen}
      >
        <DialogTitle>{dialog === 'sick' ? 'Krank melden' : 'Urlaub beantragen'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {dialog === 'sick' && (
              <Alert severity="info" variant="outlined">
                Bitte melden Sie sich vor Dienstbeginn. Eine Diagnose geben Sie nicht an. Dauert die
                Krankheit länger als drei Kalendertage, lassen Sie die Arbeitsunfähigkeit ärztlich
                feststellen – die eAU ruft das Büro bei der Krankenkasse ab.
              </Alert>
            )}
            <Stack direction="row" spacing={1.5}>
              <TextField
                label={dialog === 'sick' ? 'Krank seit' : 'Von'}
                type="date"
                fullWidth
                value={fromKey}
                onChange={e => {
                  setFromKey(e.target.value);
                  if (e.target.value > toKey) setToKey(e.target.value);
                }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label={dialog === 'sick' ? 'Voraussichtlich bis' : 'Bis'}
                type="date"
                fullWidth
                value={toKey}
                onChange={e => setToKey(e.target.value)}
                error={!!rangeError}
                helperText={rangeError || ' '}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: fromKey } }}
              />
            </Stack>
            {dialog === 'vacation' && !rangeError && (
              <Typography sx={{ fontSize: 14 }} data-testid="vacation-days-preview">
                <b>{requestedDays}</b> {requestedDays === 1 ? 'Urlaubstag' : 'Urlaubstage'} (Mo–Fr
                ohne Feiertage)
                {balance
                  ? ` · danach ${balance.remaining - balance.requested - requestedDays} Tage Rest`
                  : ''}
              </Typography>
            )}
            {overlapsExisting && (
              <Alert severity="warning" variant="outlined">
                Für diesen Zeitraum gibt es bereits eine Abwesenheit.
              </Alert>
            )}
            {dialog === 'vacation' ? (
              <TextField
                label="Notiz an die Disposition (optional)"
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 300))}
                multiline
                minRows={2}
                helperText={`${note.length}/300`}
              />
            ) : (
              <FormControlLabel
                control={<Checkbox checked={au} onChange={e => setAu(e.target.checked)} />}
                label="Ich war schon beim Arzt (Arbeitsunfähigkeit festgestellt)"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="inherit" onClick={() => setDialog(null)}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            disabled={
              !!rangeError || submit.isPending || (dialog === 'vacation' && requestedDays === 0)
            }
            onClick={() => submit.mutate()}
          >
            {dialog === 'sick' ? 'Krankmeldung senden' : 'Antrag senden'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!extending} onClose={() => setExtending(null)} fullWidth maxWidth="xs">
        <DialogTitle>Krankmeldung verlängern</DialogTitle>
        <DialogContent>
          <TextField
            label="Voraussichtlich bis"
            type="date"
            fullWidth
            sx={{ mt: 1 }}
            value={extendTo}
            onChange={e => setExtendTo(e.target.value)}
            error={!!extending && extendTo < extending.fromKey}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: extending?.fromKey } }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="inherit" onClick={() => setExtending(null)}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            disabled={!extending || extendTo < extending.fromKey || updateSick.isPending}
            onClick={() => extending && updateSick.mutate({ id: extending.id, toKey: extendTo })}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
