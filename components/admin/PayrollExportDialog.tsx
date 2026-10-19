'use client';

import {
  Alert,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { ChevronLeft, ChevronRight, FileDownloadOutlined, SettingsOutlined } from '@mui/icons-material';
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { timesheetService, userService } from '@/lib/services';
import { payrollSettingsService } from '@/lib/services/payrollSettings';
import {
  buildLodasExport,
  DEFAULT_PAYROLL_SETTINGS,
  validatePayrollSettings,
  type PayrollExportSettings,
} from '@/lib/domain/datevLodas';
import { toast } from '@/lib/utils/toast';

const fmtH = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const KIND_LABEL = { grund: 'Grund', ueberstunden: 'Überst.', nacht: 'Nacht', sonntag: 'Sonntag', feiertag: 'Feiertag' } as const;

/**
 * Lohnexport für DATEV LODAS: freigegebene Stunden eines Monats je Person und
 * Lohnart. Personen ohne Personalnummer und offene Zeiten werden vorab gemeldet.
 */
export function PayrollExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const companyId = user?.companyId ?? '';
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => startOfMonth(addMonths(new Date(), -1)));
  const [form, setForm] = useState<PayrollExportSettings>(DEFAULT_PAYROLL_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const settingsQ = useQuery({
    queryKey: ['payroll-settings', companyId],
    queryFn: () => payrollSettingsService.get(companyId),
    enabled: open && !!companyId,
  });
  // Beim Laden übernehmen; unvollständige Einstellungen einmalig aufklappen
  useEffect(() => {
    if (!settingsQ.data) return;
    setForm(settingsQ.data);
    if (validatePayrollSettings(settingsQ.data).length) setShowSettings(true);
  }, [settingsQ.data]);

  const range = useMemo(() => [startOfMonth(month), endOfMonth(month)] as const, [month]);
  const sheetsQ = useQuery({
    queryKey: ['payroll-sheets', companyId, format(month, 'yyyy-MM')],
    queryFn: () => timesheetService.listApprovedInRange(companyId, range[0], range[1]),
    enabled: open && !!companyId,
  });
  const openQ = useQuery({
    queryKey: ['payroll-open', companyId, format(month, 'yyyy-MM')],
    queryFn: async () => {
      const all = await timesheetService.listForReview(companyId, 'submitted', 1000);
      return all.filter(t => t.date >= range[0] && t.date <= range[1]).length;
    },
    enabled: open && !!companyId,
  });
  const peopleQ = useQuery({
    queryKey: ['payroll-people', companyId],
    queryFn: async () => {
      const res = await userService.getAll(1, 1000, { companyId });
      return (Array.isArray(res) ? res : res.data).map(u => ({
        userId: u.id,
        name: u.displayName || u.email || 'Unbekannt',
        personnelNumber: u.personnelNumber,
      }));
    },
    enabled: open && !!companyId,
  });

  const save = useMutation({
    mutationFn: () => payrollSettingsService.save(companyId, form),
    onSuccess: () => {
      toast.success('Lohnexport-Einstellungen gespeichert');
      qc.invalidateQueries({ queryKey: ['payroll-settings', companyId] });
      setShowSettings(false);
    },
    onError: e => toast.error(e instanceof Error ? e.message : 'Speichern fehlgeschlagen'),
  });

  const result = useMemo(
    () =>
      buildLodasExport(
        { year: month.getFullYear(), month: month.getMonth() + 1 },
        (sheetsQ.data ?? []).map(t => ({
          userId: t.userId,
          totalHours: t.totalHours,
          overtimeHours: (t as { overtimeHours?: number }).overtimeHours,
          nightHours: t.nightHours,
          sundayNonHolidayHours: t.sundayNonHolidayHours,
          holidayHours: t.holidayHours,
        })),
        peopleQ.data ?? [],
        form
      ),
    [sheetsQ.data, peopleQ.data, form, month]
  );

  // Vorschau: je Person eine Zeile mit allen Lohnarten
  const preview = useMemo(() => {
    const m = new Map<string, { name: string; pnr: string; v: Record<string, number> }>();
    result.lines.forEach(l => {
      const row = m.get(l.personnelNumber) ?? { name: l.name, pnr: l.personnelNumber, v: {} };
      row.v[l.kind] = l.hours;
      m.set(l.personnelNumber, row);
    });
    return [...m.values()];
  }, [result]);
  const kinds = (Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).filter(k => preview.some(r => r.v[k]));

  const download = () => {
    if (!result.file) return;
    const url = URL.createObjectURL(new Blob([result.file], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `LODAS_Bewegungsdaten_${format(month, 'yyyy-MM')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportdatei erstellt');
  };

  const setLa = (k: keyof PayrollExportSettings['lohnarten'], v: string) => setForm(f => ({ ...f, lohnarten: { ...f.lohnarten, [k]: v } }));
  const loading = sheetsQ.isLoading || peopleQ.isLoading || settingsQ.isLoading;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        Lohnexport DATEV LODAS
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <IconButton aria-label="Vorheriger Monat" onClick={() => setMonth(m => addMonths(m, -1))}>
            <ChevronLeft />
          </IconButton>
          <Typography sx={{ fontSize: 15, fontWeight: 600, minWidth: 120, textAlign: 'center' }}>
            {format(month, 'MMMM yyyy', { locale: de })}
          </Typography>
          <IconButton aria-label="Nächster Monat" onClick={() => setMonth(m => addMonths(m, 1))}>
            <ChevronRight />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2 }}>
        <Box>
          <Button size="small" variant="text" startIcon={<SettingsOutlined />} onClick={() => setShowSettings(v => !v)} sx={{ px: 0 }}>
            {showSettings ? 'Einstellungen ausblenden' : 'Berater-, Mandantennummer und Lohnarten'}
          </Button>
          <Collapse in={showSettings}>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, mt: 1.5 }}>
              <TextField size="small" label="Beraternummer" value={form.beraterNr} onChange={e => setForm(f => ({ ...f, beraterNr: e.target.value }))} />
              <TextField size="small" label="Mandantennummer" value={form.mandantenNr} onChange={e => setForm(f => ({ ...f, mandantenNr: e.target.value }))} />
              <TextField size="small" label="Bearbeitungsschlüssel Stunden" value={form.bsStunden} onChange={e => setForm(f => ({ ...f, bsStunden: e.target.value }))} />
              <TextField size="small" label="Lohnart Grundstunden" value={form.lohnarten.grund} onChange={e => setLa('grund', e.target.value)} />
              <TextField size="small" label="Lohnart Überstunden (optional)" value={form.lohnarten.ueberstunden ?? ''} onChange={e => setLa('ueberstunden', e.target.value)} />
              <TextField size="small" label="Lohnart Nachtzuschlag" value={form.lohnarten.nacht ?? ''} onChange={e => setLa('nacht', e.target.value)} />
              <TextField size="small" label="Lohnart Sonntagszuschlag" value={form.lohnarten.sonntag ?? ''} onChange={e => setLa('sonntag', e.target.value)} />
              <TextField size="small" label="Lohnart Feiertagszuschlag" value={form.lohnarten.feiertag ?? ''} onChange={e => setLa('feiertag', e.target.value)} />
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 1 }}>
              Nummern und Bearbeitungsschlüssel gibt Ihr Steuerbüro vor. Leere Zuschlags-Lohnarten werden nicht exportiert. Bitte die
              erste Datei gemeinsam mit dem Steuerbüro testen.
            </Typography>
            <Button sx={{ mt: 1 }} variant="outlined" size="small" onClick={() => save.mutate()} disabled={save.isPending}>
              Einstellungen speichern
            </Button>
          </Collapse>
        </Box>

        {settingsQ.isError && <Alert severity="error">Einstellungen konnten nicht geladen werden.</Alert>}
        {result.settingsErrors.length > 0 && <Alert severity="warning">{result.settingsErrors.join(' ')}</Alert>}
        {!!openQ.data && (
          <Alert severity="info">
            {openQ.data} {openQ.data === 1 ? 'Zeitnachweis ist' : 'Zeitnachweise sind'} in diesem Monat noch nicht freigegeben und fehlen im
            Export. <Link href="/admin/zeitnachweise">Jetzt prüfen</Link>
          </Alert>
        )}
        {result.missingPersonnelNumber.length > 0 && (
          <Alert severity="warning">
            Ohne Personalnummer nicht exportiert: {result.missingPersonnelNumber.map(p => p.name).join(', ')}.{' '}
            <Link href="/admin/mitarbeiter">Bei Mitarbeiter ergänzen</Link>
          </Alert>
        )}

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `minmax(140px,1fr) 64px repeat(${Math.max(kinds.length, 1)}, 84px)`,
              gap: 1.5,
              px: 2,
              py: 1,
              bgcolor: 'action.hover',
              '& > span': { fontSize: 13, fontWeight: 600, color: 'text.secondary' },
            }}
          >
            <span>Person</span>
            <span>Pers.-Nr.</span>
            {(kinds.length ? kinds : ['grund' as const]).map(k => (
              <span key={k} style={{ textAlign: 'right' }}>
                {KIND_LABEL[k]}
              </span>
            ))}
          </Box>
          {loading && (
            <Box sx={{ px: 2, py: 1.5 }}>
              <Skeleton width="60%" />
            </Box>
          )}
          {!loading && preview.length === 0 && (
            <Typography sx={{ px: 2, py: 4, textAlign: 'center', color: 'text.secondary' }}>
              Keine exportierbaren Stunden in {format(month, 'MMMM yyyy', { locale: de })}.
            </Typography>
          )}
          {preview.map(r => (
            <Box
              key={r.pnr}
              sx={{
                display: 'grid',
                gridTemplateColumns: `minmax(140px,1fr) 64px repeat(${Math.max(kinds.length, 1)}, 84px)`,
                gap: 1.5,
                px: 2,
                py: 1.1,
                borderTop: '1px solid',
                borderColor: 'divider',
                fontSize: 14,
              }}
            >
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                {r.name}
              </Typography>
              <Typography sx={{ fontSize: 14 }} className="tabular-nums">
                {r.pnr}
              </Typography>
              {kinds.map(k => (
                <Typography key={k} sx={{ fontSize: 14, textAlign: 'right' }} className="tabular-nums">
                  {r.v[k] ? fmtH(r.v[k]) : '—'}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
        {preview.length > 0 && (
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
            {result.totals.people} {result.totals.people === 1 ? 'Person' : 'Personen'}, {fmtH(result.totals.hours)} Stunden (Grund +
            Überstunden). Zuschläge als Stunden je Lohnart.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Schließen
        </Button>
        <Button variant="contained" startIcon={<FileDownloadOutlined />} disabled={!result.file} onClick={download}>
          Exportdatei herunterladen
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PayrollExportDialog;
