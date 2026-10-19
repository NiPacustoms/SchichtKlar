'use client';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircleRounded, ErrorOutlineRounded, ReportProblemOutlined, UndoRounded } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  approvalErrorMessage,
  facilityApprovalService,
  type ApprovalEntry,
  type ApprovalView,
} from '@/lib/services/facilityApproval';

const fmtH = (n: number) => `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h`;

function periodLabel(from: string, to: string) {
  const f = parseISO(from);
  const t = parseISO(to);
  const sameMonth = f.getMonth() === t.getMonth() && f.getFullYear() === t.getFullYear();
  return `${format(f, sameMonth ? 'd.' : 'd. MMMM', { locale: de })} – ${format(t, 'd. MMMM yyyy', { locale: de })}`;
}

/**
 * Öffentliche Seite für Einrichtungen: erfasste Dienste ansehen, gesammelt
 * bestätigen oder einzelne mit Grund beanstanden. Kein Konto nötig.
 */
export default function FreigabePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';
  const [view, setView] = useState<ApprovalView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [objections, setObjections] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [done, setDone] = useState<{ approved: number; rejected: number } | null>(null);

  useEffect(() => {
    let alive = true;
    facilityApprovalService
      .get(token)
      .then(v => alive && setView(v))
      .catch(e => alive && setLoadError(approvalErrorMessage(e)));
    return () => {
      alive = false;
    };
  }, [token]);

  const open = useMemo(() => (view?.entries ?? []).filter(e => e.status === 'open'), [view]);
  const objected = open.filter(e => e.id in objections);
  const toApprove = open.filter(e => !(e.id in objections));
  const objectionsValid = objected.every(e => (objections[e.id] ?? '').trim().length >= 5);
  const canSend = open.length > 0 && name.trim().length >= 3 && confirmed && objectionsValid && !sending;

  const [showDone, setShowDone] = useState(false);
  const group = (list: ApprovalEntry[]) => {
    const m = new Map<string, ApprovalEntry[]>();
    list.forEach(e => m.set(e.day, [...(m.get(e.day) ?? []), e]));
    return [...m.entries()];
  };
  // Offene Dienste zuerst; bereits Bestätigtes eingeklappt darunter
  const byDay = useMemo(() => group((view?.entries ?? []).filter(e => e.status === 'open')), [view]);
  const doneByDay = useMemo(() => group((view?.entries ?? []).filter(e => e.status === 'approved')), [view]);

  const submit = async () => {
    setSending(true);
    setSendError(null);
    try {
      const r = await facilityApprovalService.decide({
        token,
        signerName: name.trim(),
        signerRole: role.trim() || undefined,
        approveIds: toApprove.map(e => e.id),
        rejections: objected.map(e => ({ id: e.id, reason: objections[e.id].trim() })),
        confirm: true,
      });
      setDone(r);
    } catch (e) {
      setSendError(approvalErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#f6f8f7', py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="sm">{children}</Container>
    </Box>
  );

  if (loadError) {
    return shell(
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <ErrorOutlineRounded sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
        <Typography component="h1" sx={{ fontSize: 22, fontWeight: 700, mb: 1 }}>
          {loadError}
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Bitte fordern Sie bei der Disposition einen neuen Link an.
        </Typography>
      </Box>
    );
  }

  if (done) {
    return shell(
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CheckCircleRounded sx={{ fontSize: 52, color: 'success.main', mb: 1.5 }} />
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 700, mb: 1 }}>
          Vielen Dank, {name.trim().split(' ')[0]}
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          {done.approved === 1 ? '1 Dienst bestätigt' : `${done.approved} Dienste bestätigt`}
          {done.rejected ? `, ${done.rejected} beanstandet – die Disposition meldet sich dazu.` : '.'}
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1 }}>Sie können dieses Fenster schließen.</Typography>
      </Box>
    );
  }

  if (!view) {
    return shell(
      <Box>
        <Skeleton width={180} />
        <Skeleton width="70%" height={44} />
        <Skeleton variant="rounded" height={220} sx={{ mt: 3 }} />
      </Box>
    );
  }

  const total = open.reduce((s, e) => s + e.totalHours, 0);

  return shell(
    <>
      <Box component="header" sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 0.5 }}>
          {view.companyName ? `${view.companyName} · ` : ''}Stundennachweis zur Bestätigung
        </Typography>
        <Typography component="h1" sx={{ fontSize: { xs: 26, sm: 30 }, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {view.facilityName}
        </Typography>
        <Typography sx={{ fontSize: 16, mt: 0.5 }}>{periodLabel(view.from, view.to)}</Typography>
      </Box>

      {open.length === 0 ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          Alle Dienste dieses Zeitraums sind bereits bestätigt.
        </Alert>
      ) : (
        <Typography sx={{ fontSize: 15, color: 'text.secondary', mb: 2.5 }}>
          Bitte prüfen Sie die {open.length === 1 ? 'erfasste Arbeitszeit' : `${open.length} erfassten Dienste`} ({fmtH(total)}).
          Stimmt etwas nicht, tippen Sie bei dem Dienst auf „Beanstanden“.
        </Typography>
      )}

      <Box sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: '14px', overflow: 'hidden', mb: 3 }}>
        {byDay.map(([day, items], gi) => (
          <Box key={day} sx={{ borderTop: gi ? '1px solid' : 'none', borderColor: 'divider' }}>
            <Typography component="h2" sx={{ px: 2, pt: 1.75, pb: 0.5, fontSize: 14, fontWeight: 650 }}>
              {format(parseISO(day), 'EEEE, d. MMMM', { locale: de })}
            </Typography>
            {items.map(e => {
              const isObjected = e.id in objections;
              const approvedAlready = e.status === 'approved';
              return (
                <Box key={e.id} sx={{ px: 2, py: 1.25, opacity: approvedAlready ? 0.6 : 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                    <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
                      {e.person}
                    </Typography>
                    <Typography sx={{ fontWeight: 650 }} className="tabular-nums">
                      {fmtH(e.totalHours)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 14, color: 'text.secondary', flex: 1, minWidth: 0 }} className="tabular-nums">
                      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{e.startTime}–{e.endTime}</Box>
                      {' · '}
                      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{e.breakMinutes} min Pause</Box>
                      {e.station ? ` · ${e.station}` : ''}
                    </Typography>
                    {approvedAlready ? (
                      <Typography sx={{ fontSize: 13, color: 'success.main' }}>
                        Bestätigt{e.signerName ? ` von ${e.signerName}` : ''}
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        variant="text"
                        color={isObjected ? 'inherit' : 'warning'}
                        startIcon={isObjected ? <UndoRounded /> : <ReportProblemOutlined />}
                        onClick={() =>
                          setObjections(o => {
                            const n = { ...o };
                            if (isObjected) delete n[e.id];
                            else n[e.id] = '';
                            return n;
                          })
                        }
                        sx={{ minHeight: 36, flexShrink: 0, px: 1 }}
                      >
                        {isObjected ? 'Doch bestätigen' : 'Beanstanden'}
                      </Button>
                    )}
                  </Box>
                  {isObjected && (
                    <TextField
                      autoFocus
                      fullWidth
                      size="small"
                      label="Was stimmt nicht?"
                      placeholder="z. B. Ende war 13:30 Uhr"
                      value={objections[e.id]}
                      onChange={ev => setObjections(o => ({ ...o, [e.id]: ev.target.value }))}
                      error={(objections[e.id] ?? '').trim().length > 0 && (objections[e.id] ?? '').trim().length < 5}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
        {byDay.length === 0 && (
          <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            {doneByDay.length ? 'Keine offenen Dienste.' : 'Für diesen Zeitraum sind keine Dienste erfasst.'}
          </Typography>
        )}
      </Box>

      {doneByDay.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Button size="small" variant="text" onClick={() => setShowDone(v => !v)} sx={{ px: 0 }}>
            {showDone ? 'Bereits bestätigte ausblenden' : `Bereits bestätigt anzeigen (${doneByDay.reduce((n, [, l]) => n + l.length, 0)})`}
          </Button>
          {showDone && (
            <Box sx={{ mt: 1, display: 'grid', gap: 0.5 }}>
              {doneByDay.flatMap(([day, items]) =>
                items.map(e => (
                  <Typography key={e.id} sx={{ fontSize: 13.5, color: 'text.secondary' }} className="tabular-nums">
                    {format(parseISO(day), 'EEEEEE dd.MM.', { locale: de })} · {e.person} · {e.startTime}–{e.endTime} · {fmtH(e.totalHours)}
                    {e.signerName ? ` · bestätigt von ${e.signerName}` : ''}
                  </Typography>
                ))
              )}
            </Box>
          )}
        </Box>
      )}

      {open.length > 0 && (
        <Box component="form" onSubmit={e => (e.preventDefault(), canSend && submit())} sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '3fr 2fr' } }}>
            <TextField label="Ihr Name" required value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
            <TextField label="Funktion (optional)" placeholder="z. B. PDL" value={role} onChange={e => setRole(e.target.value)} />
          </Box>
          <FormControlLabel
            control={<Checkbox checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />}
            label={
              <Typography sx={{ fontSize: 14.5 }}>
                Ich bestätige, dass {toApprove.length === 1 ? 'der Dienst' : 'die Dienste'} wie angegeben in unserer Einrichtung geleistet
                {toApprove.length === 1 ? ' wurde' : ' wurden'}.
              </Typography>
            }
            sx={{ alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.25 } }}
          />
          {sendError && <Alert severity="error">{sendError}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={!canSend} sx={{ minHeight: 52 }}>
            {sending ? (
              <CircularProgress size={22} sx={{ color: 'inherit' }} />
            ) : toApprove.length && objected.length ? (
              `${toApprove.length} bestätigen, ${objected.length} beanstanden`
            ) : toApprove.length ? (
              toApprove.length === 1 ? 'Dienst bestätigen' : `${toApprove.length} Dienste bestätigen`
            ) : (
              `${objected.length} beanstanden`
            )}
          </Button>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', textAlign: 'center' }}>
            Gültig bis {format(new Date(view.expiresAt), 'd. MMMM yyyy', { locale: de })}. Ihre Bestätigung wird mit Name und Zeitpunkt gespeichert.
          </Typography>
        </Box>
      )}
    </>
  );
}
