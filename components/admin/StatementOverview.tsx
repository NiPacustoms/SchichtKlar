'use client';

import { Alert, Box, Button, Chip, Collapse, IconButton, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { CheckRounded, ChevronLeftRounded, ChevronRightRounded, DownloadRounded, ExpandMoreRounded } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatStrip } from '@/components/ui/StatStrip';
import { SignatureDialog } from '@/components/ui/SignatureDialog';
import { StatementTable, fmtStd } from '@/components/timesheets/StatementTable';
import { userService } from '@/lib/services';
import { timesheetStatementService, type LoadedStatement } from '@/lib/services/timesheetStatements';
import { buildStatementPdf } from '@/lib/services/statementPdfClient';
import { statementFileName } from '@/lib/services/pdf/stundennachweisPdf';
import { downloadBlob } from '@/lib/hooks/useMonthlyStatement';
import { monthLabel, shiftMonth, statementSignState, type StatementSignState } from '@/lib/domain/stundennachweis';
import { berlinDayKey } from '@/lib/utils/dateKey';
import { toast } from '@/lib/utils/toast';
import type { User } from '@/lib/types';

const STATE_CHIP: Record<StatementSignState, { label: string; color: 'default' | 'info' | 'success' | 'warning' }> = {
  open: { label: 'Nicht unterschrieben', color: 'default' },
  'employee-signed': { label: 'Unterschrieben', color: 'info' },
  acknowledged: { label: 'Anerkannt', color: 'success' },
  changed: { label: 'Geändert nach Unterschrift', color: 'warning' },
};

interface Row {
  user: User;
  loaded: LoadedStatement;
  state: StatementSignState;
}

/**
 * Disposition: Stundennachweise aller Mitarbeitenden eines Monats –
 * Status der Unterschriften, Anerkennung („Unterschrift Arbeitgeber“),
 * einzelnes oder Sammel-PDF fürs Lohnbüro.
 */
export function StatementOverview() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? '';
  const qc = useQueryClient();
  const todayKey = berlinDayKey(new Date());
  const today = todayKey.slice(0, 7);
  // Bis zum 10. ist der Vormonat dran (Lohnabrechnung), danach der laufende Monat
  const [month, setMonth] = useState(Number(todayKey.slice(8, 10)) <= 10 ? shiftMonth(today, -1) : today);
  const [open, setOpen] = useState<string | null>(null);
  const [adminSig, setAdminSig] = useState<{ dataUrl: string; name: string } | null>(null);
  const [pendingAck, setPendingAck] = useState<Row[] | null>(null);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  const { data: people = [] } = useQuery({
    queryKey: ['statement-people', companyId],
    queryFn: async () => {
      const res = await userService.getAll(1, 1000, { companyId });
      const list = (Array.isArray(res) ? res : res.data) as User[];
      return list.filter(u => u.role === 'nurse').sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'de'));
    },
    enabled: !!companyId,
  });

  const { data: rows = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['monthly-statement-overview', companyId, month, people.map(p => p.id).join(',')],
    queryFn: async () => {
      const loaded = await Promise.all(people.map(u => timesheetStatementService.load({ companyId, userId: u.id, month })));
      return people
        .map((u, i) => ({ user: u, loaded: loaded[i], state: statementSignState(loaded[i].statement, loaded[i].signatures) }))
        .filter(r => r.loaded.statement.rows.length > 0 || r.loaded.signatures);
    },
    enabled: !!companyId && people.length > 0,
  });

  const counts = useMemo(() => {
    const c = { all: rows.length, open: 0, signed: 0, ack: 0, hours: 0 };
    for (const r of rows) {
      c.hours += r.loaded.statement.totals.hours;
      if (r.state === 'acknowledged') c.ack++;
      else if (r.state === 'employee-signed') c.signed++;
      else c.open++;
    }
    return c;
  }, [rows]);
  const ackable = (r: Row) => r.state === 'employee-signed' && r.loaded.statement.allApproved;
  const readyToAck = rows.filter(ackable);

  const ack = useMutation({
    mutationFn: async ({ list, sig }: { list: Row[]; sig: { dataUrl: string; name: string } }) => {
      for (const r of list) {
        await timesheetStatementService.acknowledge({ companyId, userId: r.user.id, month, adminId: user!.id, name: sig.name, signature: sig.dataUrl });
      }
      return list.length;
    },
    onSuccess: n => {
      toast.success(n === 1 ? 'Stundennachweis anerkannt' : `${n} Stundennachweise anerkannt`);
      qc.invalidateQueries({ queryKey: ['monthly-statement-overview'] });
    },
    onError: e => toast.error(e instanceof Error ? e.message : 'Anerkennen fehlgeschlagen'),
  });
  const revoke = useMutation({
    mutationFn: (r: Row) => timesheetStatementService.revokeAcknowledgement({ companyId, userId: r.user.id, month }),
    onSuccess: () => {
      toast.success('Anerkennung zurückgenommen');
      qc.invalidateQueries({ queryKey: ['monthly-statement-overview'] });
    },
  });

  const requestAck = (list: Row[]) => {
    if (adminSig) ack.mutate({ list, sig: adminSig });
    else setPendingAck(list);
  };

  const pdf = async (list: Row[], key: string) => {
    setPdfBusy(key);
    try {
      const blob = await buildStatementPdf(list.map(r => ({ user: r.user, loaded: r.loaded })));
      downloadBlob(blob, statementFileName(month, list.length === 1 ? list[0].user.displayName : undefined));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'PDF konnte nicht erstellt werden');
    } finally {
      setPdfBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Stundennachweise"
        subtitle="Monatliche Arbeitszeiterfassung je Person – unterschreiben, anerkennen, ans Lohnbüro"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<DownloadRounded />} disabled={!rows.length || !!pdfBusy} onClick={() => pdf(rows, 'all')}>
              Alle als PDF
            </Button>
            <Button variant="contained" startIcon={<CheckRounded />} disabled={!readyToAck.length || ack.isPending} onClick={() => requestAck(readyToAck)}>
              {readyToAck.length ? `${readyToAck.length} anerkennen` : 'Anerkennen'}
            </Button>
          </Stack>
        }
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton aria-label="Vormonat" onClick={() => setMonth(m => shiftMonth(m, -1))}>
          <ChevronLeftRounded />
        </IconButton>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700, minWidth: 150, textAlign: 'center' }}>
          {monthLabel(month)}
        </Typography>
        <IconButton aria-label="Folgemonat" disabled={month >= today} onClick={() => setMonth(m => shiftMonth(m, 1))}>
          <ChevronRightRounded />
        </IconButton>
      </Box>

      <StatStrip
        aria-label="Stundennachweise nach Status"
        items={[
          { label: 'Mitarbeitende', value: counts.all, tone: 'muted' },
          { label: 'Nicht unterschrieben', value: counts.open, tone: counts.open ? 'attention' : 'muted' },
          { label: 'Zur Anerkennung', value: counts.signed },
          { label: 'Anerkannt', value: counts.ack },
          { label: 'Stunden gesamt', value: fmtStd(counts.hours), tone: 'muted' },
        ]}
      />

      {isError ? (
        <Alert severity="error" action={<Button size="small" variant="text" onClick={() => refetch()}>Erneut laden</Button>}>
          Stundennachweise konnten nicht geladen werden.
        </Alert>
      ) : isLoading ? (
        <Stack spacing={1}>
          {[0, 1, 2].map(i => (
            <Skeleton key={i} variant="rounded" height={64} />
          ))}
        </Stack>
      ) : !rows.length ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
          <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>Keine Zeiten im {monthLabel(month)}</Typography>
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
          {rows.map((r, i) => {
            const t = r.loaded.statement.totals;
            const expanded = open === r.user.id;
            const notApproved = r.state === 'employee-signed' && !r.loaded.statement.allApproved;
            return (
              <Box key={r.user.id} data-testid="statement-overview-row" sx={{ borderTop: i ? '1px solid' : 'none', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 1.5, px: 2, py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                    <IconButton size="small" aria-label={expanded ? 'Zuklappen' : `Nachweis von ${r.user.displayName} ansehen`} onClick={() => setOpen(expanded ? null : r.user.id)}>
                      <ExpandMoreRounded sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                    </IconButton>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                        {r.user.displayName}
                        {r.user.personnelNumber ? <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}> · Nr. {r.user.personnelNumber}</Box> : null}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                        {fmtStd(t.hours)} Std. · {t.workDays} Dienste
                        {t.openHours ? ` · ${fmtStd(t.openHours)} Std. noch nicht freigegeben` : ''}
                        {t.sickDays ? ` · ${t.sickDays} K` : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', pl: { xs: 5, md: 0 }, flexWrap: 'wrap', rowGap: 0.75 }}>
                    <Chip size="small" color={STATE_CHIP[r.state].color} label={STATE_CHIP[r.state].label} />
                    <Tooltip title="PDF herunterladen">
                      <span>
                        <IconButton size="small" aria-label={`PDF von ${r.user.displayName}`} disabled={!!pdfBusy} onClick={() => pdf([r], r.user.id)}>
                          <DownloadRounded fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    {r.state === 'acknowledged' ? (
                      <Button size="small" variant="text" color="inherit" disabled={revoke.isPending} onClick={() => revoke.mutate(r)}>
                        Zurücknehmen
                      </Button>
                    ) : notApproved ? (
                      <Button size="small" variant="text" component={Link} href="/admin/zeitnachweise">
                        Erst Zeiten freigeben
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!ackable(r) || ack.isPending}
                        onClick={() => requestAck([r])}
                        aria-label={`Stundennachweis von ${r.user.displayName} anerkennen`}
                      >
                        Anerkennen
                      </Button>
                    )}
                  </Stack>
                </Box>
                <Collapse in={expanded} unmountOnExit>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <StatementTable statement={r.loaded.statement} />
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      )}

      <SignatureDialog
        open={!!pendingAck}
        title="Unterschrift Arbeitgeber (anerkannt)"
        onClose={() => setPendingAck(null)}
        onSave={(dataUrl, name) => {
          const sig = { dataUrl, name: name || user?.displayName || '' };
          setAdminSig(sig); // für weitere Anerkennungen in dieser Sitzung
          if (pendingAck) ack.mutate({ list: pendingAck, sig });
          setPendingAck(null);
        }}
        requireName
        nameLabel="Name (Arbeitgeber)"
        initialName={user?.displayName || ''}
      />
    </>
  );
}
