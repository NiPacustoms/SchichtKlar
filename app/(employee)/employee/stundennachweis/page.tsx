'use client';

import { Alert, Box, Button, Chip, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import { ChevronLeftRounded, ChevronRightRounded, DownloadRounded, DrawOutlined } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatStrip } from '@/components/ui/StatStrip';
import { SignatureDialog } from '@/components/ui/SignatureDialog';
import { StatementTable, fmtStd } from '@/components/timesheets/StatementTable';
import { userService } from '@/lib/services';
import { timesheetStatementService } from '@/lib/services/timesheetStatements';
import { buildStatementPdf } from '@/lib/services/statementPdfClient';
import { downloadBlob, useMonthlyStatement } from '@/lib/hooks/useMonthlyStatement';
import { monthLabel, shiftMonth } from '@/lib/domain/stundennachweis';
import { statementFileName } from '@/lib/services/pdf/stundennachweisPdf';
import { berlinDayKey } from '@/lib/utils/dateKey';
import { toast } from '@/lib/utils/toast';

const STATE_CHIP = {
  open: { label: 'Noch nicht unterschrieben', color: 'default' },
  'employee-signed': { label: 'Unterschrieben – wartet auf Anerkennung', color: 'info' },
  acknowledged: { label: 'Vom Arbeitgeber anerkannt', color: 'success' },
  changed: { label: 'Geändert – bitte neu unterschreiben', color: 'warning' },
} as const;

/** Monatlicher Stundennachweis – digitaler Ersatz für den Papierbogen */
export default function EmployeeStatementPage() {
  const { user } = useAuth();
  const uid = user?.id ?? '';
  const companyId = user?.companyId ?? '';
  const qc = useQueryClient();
  const thisMonth = berlinDayKey(new Date()).slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const [signOpen, setSignOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const { data, isLoading, isError, refetch, state } = useMonthlyStatement(companyId, uid, month);
  const { data: profile } = useQuery({ queryKey: ['statement-profile', uid], queryFn: () => userService.getById(uid), enabled: !!uid });

  const sign = useMutation({
    mutationFn: async ({ dataUrl, name }: { dataUrl: string; name: string }) => {
      if (!data) throw new Error('Nachweis nicht geladen');
      await timesheetStatementService.signAsEmployee({ companyId, userId: uid, month, statement: data.statement, signature: dataUrl, name, exists: !!data.signatures });
    },
    onSuccess: () => {
      toast.success('Stundennachweis unterschrieben – die Disposition wird ihn anerkennen');
      setSignOpen(false);
      qc.invalidateQueries({ queryKey: ['monthly-statement'] });
    },
    onError: e => toast.error(e instanceof Error ? e.message : 'Unterschrift fehlgeschlagen'),
  });

  const downloadPdf = async () => {
    if (!data) return;
    setPdfBusy(true);
    try {
      const u = profile ?? user;
      const blob = await buildStatementPdf([{ user: { displayName: u?.displayName ?? '', email: u?.email ?? '', personnelNumber: profile?.personnelNumber, qualifications: profile?.qualifications }, loaded: data }]);
      downloadBlob(blob, statementFileName(month, u?.displayName));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'PDF konnte nicht erstellt werden');
    } finally {
      setPdfBusy(false);
    }
  };

  const s = data?.statement;
  const t = s?.totals;
  const canSign = !!s && s.rows.some(r => r.sheetId) && !s.hasDrafts && (state === 'open' || state === 'changed');
  const isFuture = month > thisMonth;

  return (
    <PageContainer maxWidth="standard" withBottomNav>
      <PageHeader
        title="Stundennachweis"
        subtitle="Ihre Arbeitszeiten des Monats – statt Papierbogen digital bestätigen"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<DownloadRounded />} disabled={!data || pdfBusy} onClick={downloadPdf}>
              PDF
            </Button>
            <Button variant="contained" startIcon={<DrawOutlined />} disabled={!canSign || sign.isPending} onClick={() => setSignOpen(true)}>
              {state === 'changed' ? 'Neu unterschreiben' : 'Monat unterschreiben'}
            </Button>
          </Stack>
        }
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <IconButton aria-label="Vormonat" onClick={() => setMonth(m => shiftMonth(m, -1))}>
          <ChevronLeftRounded />
        </IconButton>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700, minWidth: 150, textAlign: 'center' }} data-testid="statement-month">
          {monthLabel(month)}
        </Typography>
        <IconButton aria-label="Folgemonat" disabled={isFuture || month === thisMonth} onClick={() => setMonth(m => shiftMonth(m, 1))}>
          <ChevronRightRounded />
        </IconButton>
        {state && <Chip size="small" color={STATE_CHIP[state].color} label={STATE_CHIP[state].label} data-testid="statement-state" sx={{ ml: { sm: 1 } }} />}
      </Box>

      {t && (
        <StatStrip
          aria-label="Monatssummen"
          items={[
            { label: 'Summe', value: `${fmtStd(t.hours)} h` },
            { label: 'Freigegeben', value: `${fmtStd(t.approvedHours)} h`, tone: 'muted' },
            { label: 'In Prüfung', value: `${fmtStd(t.openHours)} h`, tone: t.openHours ? 'attention' : 'muted' },
            { label: 'Urlaub / Krank', value: `${t.vacationDays} / ${t.sickDays}`, tone: 'muted', hint: 'Tage' },
          ]}
        />
      )}

      {s?.hasDrafts && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }} action={<Button size="small" variant="text" component={Link} href="/employee/zeiterfassung">Zur Zeiterfassung</Button>}>
          Es gibt noch Entwürfe. Reichen Sie diese zuerst ein, dann können Sie den Monat unterschreiben.
        </Alert>
      )}
      {state === 'changed' && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          Nach Ihrer Unterschrift wurden Zeiten geändert. Bitte prüfen und neu unterschreiben.
        </Alert>
      )}
      {data?.signatures?.employeeSignedAt && state !== 'changed' && (
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 2 }}>
          Unterschrieben am {data.signatures.employeeSignedAt.toLocaleDateString('de-DE')}
          {data.signatures.employerSignedAt ? ` · anerkannt am ${data.signatures.employerSignedAt.toLocaleDateString('de-DE')} von ${data.signatures.employerSignedName}` : ''}
        </Typography>
      )}

      {isError ? (
        <Alert severity="error" action={<Button size="small" variant="text" onClick={() => refetch()}>Erneut laden</Button>}>
          Stundennachweis konnte nicht geladen werden.
        </Alert>
      ) : isLoading || !s ? (
        <Stack spacing={1}>
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} variant="rounded" height={48} />
          ))}
        </Stack>
      ) : (
        <StatementTable statement={s} />
      )}

      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 2 }}>
        Mit Ihrer Unterschrift bestätigen Sie die erfassten Zeiten (wie „Unterschrift Arbeitnehmer – erfasst“ auf dem Papierbogen). Die Bestätigung der
        Einrichtung ist je Tag vermerkt. U = Urlaub, K = Krank.
      </Typography>

      <SignatureDialog
        open={signOpen}
        title={`Stundennachweis ${monthLabel(month)} unterschreiben`}
        onClose={() => setSignOpen(false)}
        onSave={(dataUrl, name) => sign.mutate({ dataUrl, name: name || user?.displayName || '' })}
        requireName
        nameLabel="Ihr Name"
        initialName={user?.displayName || ''}
      />
    </PageContainer>
  );
}
