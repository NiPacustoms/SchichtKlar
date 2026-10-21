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
import { EventBusyOutlined, LocalHospitalOutlined } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { absenceService, type AbsenceWithConflicts } from '@/lib/services/absences';
import { ABSENCE_STATUS_LABEL, daysBetween, deRange } from '@/lib/domain/absence';
import { berlinDayKey } from '@/lib/utils/dateKey';
import { toast } from '@/lib/utils/toast';

/** Krank melden, verlängern, zurückziehen – für Pflegekräfte (keine Urlaubsverwaltung) */
export default function EmployeeSickPage() {
  const { user } = useAuth();
  const uid = user?.id ?? '';
  const companyId = user?.companyId ?? '';
  const qc = useQueryClient();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const today = berlinDayKey(new Date());

  const [open, setOpen] = useState(false);
  const [fromKey, setFromKey] = useState(today);
  const [toKey, setToKey] = useState(today);
  const [au, setAu] = useState(false);
  const [extending, setExtending] = useState<AbsenceWithConflicts | null>(null);
  const [extendTo, setExtendTo] = useState(today);

  function openDialog() {
    const t = berlinDayKey(new Date());
    setFromKey(t);
    setToKey(t);
    setAu(false);
    setOpen(true);
  }

  // ?neu=krank öffnet direkt die Krankmeldung
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('neu') === 'krank') openDialog();
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

  const invalidate = () => qc.invalidateQueries({ queryKey: ['absences-mine'] });
  const rangeError = !fromKey || !toKey ? 'Bitte Zeitraum wählen' : toKey < fromKey ? 'Das Ende liegt vor dem Beginn' : '';
  const overlapsExisting = useMemo(
    () => !rangeError && list.some(a => a.status === 'reported' && a.fromKey <= toKey && fromKey <= a.toKey),
    [list, fromKey, toKey, rangeError]
  );

  const submit = useMutation({
    mutationFn: () => absenceService.reportSick({ userId: uid, companyId, fromKey, toKey, auProvided: au }),
    onSuccess: () => {
      toast.success('Krankmeldung gesendet – gute Besserung!');
      setOpen(false);
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
    mutationFn: (p: { id: string; toKey?: string; auProvided?: boolean }) => absenceService.updateSick(p.id, p),
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
    const calDays = daysBetween(a.fromKey, a.toKey).length;
    const active = a.status === 'reported' && a.toKey >= today;
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
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>Krank · {deRange(a.fromKey, a.toKey)}</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {calDays} {calDays === 1 ? 'Kalendertag' : 'Kalendertage'}
              {a.auProvided ? ' · ärztlich festgestellt' : ''}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', pl: { xs: 6, sm: 0 } }}>
          <Chip
            size="small"
            color={a.status === 'cancelled' ? 'default' : 'info'}
            variant={a.status === 'cancelled' ? 'outlined' : 'filled'}
            label={ABSENCE_STATUS_LABEL[a.status]}
          />
          {active && (
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
                <Button size="small" variant="text" onClick={() => updateSick.mutate({ id: a.id, auProvided: true })}>
                  Arzt war da
                </Button>
              )}
            </>
          )}
          {a.status === 'reported' && a.fromKey > today && (
            <Button size="small" variant="text" color="inherit" disabled={cancel.isPending} onClick={() => cancel.mutate(a.id)}>
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
        <Typography component="h2" sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4, mb: 1 }}>
          {title}
        </Typography>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
          {items.map(row)}
        </Box>
      </Box>
    );

  return (
    <PageContainer maxWidth="standard" withBottomNav>
      <PageHeader
        title="Krankmeldung"
        subtitle="Krank melden, verlängern oder zurückziehen – die Disposition wird sofort informiert"
        actions={
          <Button variant="contained" startIcon={<LocalHospitalOutlined />} onClick={openDialog}>
            Krank melden
          </Button>
        }
      />

      {isError ? (
        <Alert severity="error" action={<Button size="small" variant="text" onClick={() => refetch()}>Erneut laden</Button>}>
          Krankmeldungen konnten nicht geladen werden.
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
          <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>Keine Krankmeldungen</Typography>
          <Typography sx={{ fontSize: 14 }}>Ihre Krankmeldungen erscheinen hier.</Typography>
        </Box>
      ) : (
        <>
          {section('Aktuell', current)}
          {section('Vergangen', past)}
        </>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" fullScreen={fullScreen}>
        <DialogTitle>Krank melden</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info" variant="outlined">
              Bitte melden Sie sich vor Dienstbeginn. Eine Diagnose geben Sie nicht an. Dauert die Krankheit länger als drei
              Kalendertage, lassen Sie die Arbeitsunfähigkeit ärztlich feststellen – die eAU ruft das Büro bei der Krankenkasse ab.
            </Alert>
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Krank seit"
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
                label="Voraussichtlich bis"
                type="date"
                fullWidth
                value={toKey}
                onChange={e => setToKey(e.target.value)}
                error={!!rangeError}
                helperText={rangeError || ' '}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: fromKey } }}
              />
            </Stack>
            {overlapsExisting && (
              <Alert severity="warning" variant="outlined">
                Für diesen Zeitraum gibt es bereits eine Krankmeldung.
              </Alert>
            )}
            <FormControlLabel
              control={<Checkbox checked={au} onChange={e => setAu(e.target.checked)} />}
              label="Ich war schon beim Arzt (Arbeitsunfähigkeit festgestellt)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="inherit" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button variant="contained" disabled={!!rangeError || submit.isPending} onClick={() => submit.mutate()}>
            Krankmeldung senden
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
