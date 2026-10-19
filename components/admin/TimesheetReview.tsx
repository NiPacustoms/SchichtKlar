'use client';

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CheckRounded, CloseRounded, DrawOutlined, LinkRounded, RefreshOutlined, SearchRounded, SendRounded } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { timesheetService, userService } from '@/lib/services';
import { facilityService } from '@/lib/services/facilities';
import type { Timesheet } from '@/lib/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatStrip } from '@/components/ui/StatStrip';
import { toast } from '@/lib/utils/toast';
import { FacilityApprovalLinkDialog } from '@/components/admin/FacilityApprovalLinkDialog';
import type { Facility } from '@/lib/types';

type Status = Timesheet['status'];
type Filter = Status | 'all';

const STATUS_LABEL: Record<Status, string> = {
  draft: 'Entwurf',
  submitted: 'Zu prüfen',
  approved: 'Freigegeben',
  rejected: 'Abgelehnt',
};
const STATUS_COLOR: Record<Status, 'default' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
};
const FLAG_LABEL: Record<string, string> = {
  BREAK_TOO_SHORT: 'Pause zu kurz',
  OVER_10H: 'Über 10 h',
  OVER_8H: 'Über 8 h',
};

const fmtH = (n: number) => `${(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h`;

/**
 * Prüfliste der Disposition: eingereichte Zeiten freigeben oder mit Begründung
 * ablehnen. Freigegebene Zeiten sind danach unveränderlich (GoBD).
 */
export function TimesheetReview() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? '';
  const qc = useQueryClient();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [filter, setFilter] = useState<Filter>('submitted');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [rejecting, setRejecting] = useState<Timesheet | null>(null);
  const [reason, setReason] = useState('');
  const [confirmFlagged, setConfirmFlagged] = useState<Timesheet[] | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);

  const { data: sheets = [], isLoading, refetch } = useQuery({
    queryKey: ['timesheet-review', companyId],
    queryFn: () => timesheetService.listForReview(companyId, 'all', 600),
    enabled: !!companyId,
  });
  const { data: names = {} } = useQuery({
    queryKey: ['timesheet-review-names', companyId],
    queryFn: async () => {
      const res = await userService.getAll(1, 1000, { companyId });
      const list = Array.isArray(res) ? res : res.data;
      return Object.fromEntries(list.map(u => [u.id, u.displayName || u.email || 'Unbekannt'])) as Record<string, string>;
    },
    enabled: !!companyId,
  });
  const { data: facilityList = [] } = useQuery({
    queryKey: ['timesheet-review-facilities', companyId],
    queryFn: async () => (await facilityService.getAll(companyId)) as Facility[],
    enabled: !!companyId,
  });
  const facilities = useMemo(
    () => Object.fromEntries(facilityList.map(f => [f.id, f.name])) as Record<string, string>,
    [facilityList]
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: sheets.length, draft: 0, submitted: 0, approved: 0, rejected: 0 };
    sheets.forEach(s => (c[s.status] = (c[s.status] ?? 0) + 1));
    return c;
  }, [sheets]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sheets.filter(s => {
      if (filter !== 'all' && s.status !== filter) return false;
      if (!q) return true;
      return [names[s.userId], s.facilityId ? facilities[s.facilityId] : '', s.station].some(v => v?.toLowerCase().includes(q));
    });
  }, [sheets, filter, search, names, facilities]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['timesheet-review'] });
    qc.invalidateQueries({ queryKey: ['admin'] });
  };

  const approve = useMutation({
    mutationFn: async (list: Timesheet[]) => {
      let ok = 0;
      const failed: string[] = [];
      for (const s of list) {
        try {
          await timesheetService.approve(s.id, user!.id);
          ok++;
        } catch (e) {
          failed.push(e instanceof Error ? e.message : String(e));
        }
      }
      return { ok, failed };
    },
    onSuccess: ({ ok, failed }) => {
      if (ok) toast.success(ok === 1 ? 'Zeiten freigegeben' : `${ok} Zeitnachweise freigegeben`);
      if (failed.length) toast.error(`${failed.length} nicht freigegeben: ${failed[0]}`);
      setSelected([]);
      invalidate();
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, why }: { id: string; why: string }) => timesheetService.reject(id, why),
    onSuccess: () => {
      toast.success('Zeiten abgelehnt – die Pflegekraft kann sie korrigieren');
      setRejecting(null);
      setReason('');
      invalidate();
    },
    onError: e => toast.error(e instanceof Error ? e.message : 'Ablehnen fehlgeschlagen'),
  });

  const requestApprove = (list: Timesheet[]) => {
    const flagged = list.filter(s => (s.arbzgFlags ?? []).some(f => f !== 'OVER_8H'));
    if (flagged.length) setConfirmFlagged(list);
    else approve.mutate(list);
  };

  const selectable = rows.filter(s => s.status === 'submitted');
  const allSelected = selectable.length > 0 && selectable.every(s => selected.includes(s.id));
  const selectedSheets = sheets.filter(s => selected.includes(s.id));

  const cols = '36px 84px minmax(110px,1fr) minmax(130px,1.2fr) 112px 72px minmax(96px,0.8fr) minmax(104px,0.8fr) 100px 72px';

  const flagChips = (s: Timesheet) =>
    (s.arbzgFlags ?? []).map(f => (
      <Chip key={f} size="small" variant="outlined" color={f === 'OVER_8H' ? 'default' : 'warning'} label={FLAG_LABEL[f] ?? f} />
    ));

  const signer = (s: Timesheet) =>
    s.facilitySignerName ? (
      <Tooltip title={s.facilitySignedAt ? `Unterschrieben am ${format(s.facilitySignedAt, 'dd.MM.yyyy HH:mm', { locale: de })}` : 'Unterschrieben'}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          {s.facilityApprovedVia === 'link' ? (
            <LinkRounded sx={{ fontSize: 16, color: 'success.main' }} />
          ) : (
            <DrawOutlined sx={{ fontSize: 16, color: 'success.main' }} />
          )}
          <Typography noWrap sx={{ fontSize: 13.5 }}>
            {s.facilitySignerName}
          </Typography>
        </Box>
      </Tooltip>
    ) : (
      <Typography sx={{ fontSize: 13.5, color: 'text.disabled' }}>—</Typography>
    );

  const actions = (s: Timesheet) =>
    s.status === 'submitted' || s.status === 'draft' ? (
      <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
        <Tooltip title={s.status === 'draft' ? 'Noch nicht eingereicht' : 'Freigeben'}>
          <span>
            <IconButton
              size="small"
              aria-label={`Zeiten von ${names[s.userId] ?? 'Person'} freigeben`}
              disabled={s.status !== 'submitted' || approve.isPending}
              onClick={() => requestApprove([s])}
              sx={{ color: 'success.main' }}
            >
              <CheckRounded fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Ablehnen">
          <span>
            <IconButton
              size="small"
              aria-label={`Zeiten von ${names[s.userId] ?? 'Person'} ablehnen`}
              disabled={s.status !== 'submitted'}
              onClick={() => setRejecting(s)}
              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
            >
              <CloseRounded fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    ) : null;

  return (
    <>
      <PageHeader
        title="Zeitnachweise"
        subtitle="Eingereichte Zeiten prüfen und freigeben – Freigegebenes ist danach unveränderlich"
        actions={
          <>
            <Tooltip title="Neu laden">
              <IconButton aria-label="Neu laden" onClick={() => refetch()}>
                <RefreshOutlined />
              </IconButton>
            </Tooltip>
            <Button variant={selected.length ? 'outlined' : 'contained'} startIcon={<SendRounded />} onClick={() => setLinkOpen(true)}>
              Freigabe anfragen
            </Button>
            {selected.length > 0 && (
              <Button variant="contained" startIcon={<CheckRounded />} disabled={approve.isPending} onClick={() => requestApprove(selectedSheets)}>
                {selected.length} freigeben
              </Button>
            )}
          </>
        }
      />

      <StatStrip
        aria-label="Zeitnachweise nach Status"
        items={[
          { label: 'Zu prüfen', value: counts.submitted, tone: counts.submitted ? 'attention' : 'default', selected: filter === 'submitted', onClick: () => setFilter('submitted') },
          { label: 'Entwürfe', value: counts.draft, tone: 'muted', selected: filter === 'draft', onClick: () => setFilter('draft') },
          { label: 'Freigegeben', value: counts.approved, selected: filter === 'approved', onClick: () => setFilter('approved') },
          { label: 'Abgelehnt', value: counts.rejected, tone: 'muted', selected: filter === 'rejected', onClick: () => setFilter('rejected') },
        ]}
      />

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)} aria-label="Status">
          <ToggleButton value="submitted">Zu prüfen</ToggleButton>
          <ToggleButton value="all">Alle</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          size="small"
          placeholder="Person, Einrichtung oder Station"
          value={search}
          onChange={e => setSearch(e.target.value)}
          inputProps={{ 'aria-label': 'Zeitnachweise durchsuchen' }}
          sx={{ width: { xs: '100%', sm: 320 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }}
        />
      </Box>

      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
        {isDesktop && (
          <Box
            role="row"
            sx={{
              display: 'grid',
              gridTemplateColumns: cols,
              gap: 1.5,
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              bgcolor: 'action.hover',
              '& > span': { fontSize: 13, fontWeight: 600, color: 'text.secondary' },
            }}
          >
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={!allSelected && selectable.some(s => selected.includes(s.id))}
              disabled={!selectable.length}
              onChange={() => setSelected(allSelected ? [] : selectable.map(s => s.id))}
              inputProps={{ 'aria-label': 'Alle zu prüfenden auswählen' }}
            />
            <span>Datum</span>
            <span>Person</span>
            <span>Einrichtung</span>
            <span>Zeit</span>
            <span style={{ textAlign: 'right' }}>Stunden</span>
            <span>Hinweise</span>
            <span>Unterschrift</span>
            <span>Status</span>
            <span />
          </Box>
        )}

        {isLoading &&
          [0, 1, 2, 3].map(i => (
            <Box key={i} sx={{ px: 2, py: 1.75, borderTop: '1px solid', borderColor: 'divider' }}>
              <Skeleton width="70%" />
            </Box>
          ))}

        {!isLoading && rows.length === 0 && (
          <Box sx={{ px: 2, py: 7, textAlign: 'center', borderTop: isDesktop ? '1px solid' : 'none', borderColor: 'divider' }}>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
              {filter === 'submitted' ? 'Nichts zu prüfen' : 'Keine Zeitnachweise'}
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
              {filter === 'submitted'
                ? 'Sobald Pflegekräfte Zeiten ohne Unterschrift der Einrichtung einreichen, erscheinen sie hier. Über „Freigabe anfragen“ bestätigt die Einrichtung per Link.'
                : 'Für diese Auswahl gibt es keine Einträge.'}
            </Typography>
          </Box>
        )}

        {!isLoading &&
          rows.map((s, i) => {
            const person = names[s.userId] ?? 'Unbekannt';
            const facility = s.facilityId ? facilities[s.facilityId] ?? 'Einrichtung unbekannt' : '—';
            const day = format(s.date, 'EEEEEE, dd.MM.', { locale: de });
            const time = s.endTime && s.endTime !== s.startTime ? `${s.startTime}–${s.endTime}` : `${s.startTime}– läuft`;
            const chip = <Chip size="small" variant="outlined" color={STATUS_COLOR[s.status]} label={STATUS_LABEL[s.status]} />;
            const isSel = selected.includes(s.id);

            if (!isDesktop) {
              return (
                <Box key={s.id} sx={{ px: 1.75, py: 1.5, borderTop: i ? '1px solid' : 'none', borderColor: 'divider', display: 'grid', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography noWrap sx={{ fontWeight: 600 }}>
                      {person}
                    </Typography>
                    {chip}
                  </Box>
                  <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }} className="tabular-nums">
                    {day} · {time} · {s.breakMinutes} min Pause · {fmtH(s.totalHours)}
                  </Typography>
                  <Typography noWrap sx={{ fontSize: 13.5, color: 'text.secondary' }}>
                    {facility}
                    {s.station ? ` · ${s.station}` : ''}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {flagChips(s)}
                    {s.rejectionReason && s.status === 'rejected' && (
                      <Typography sx={{ fontSize: 13, color: 'error.main' }}>Grund: {s.rejectionReason}</Typography>
                    )}
                    <Box sx={{ ml: 'auto' }}>{actions(s)}</Box>
                  </Box>
                </Box>
              );
            }

            return (
              <Box
                key={s.id}
                role="row"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: cols,
                  gap: 1.5,
                  alignItems: 'center',
                  px: 1.5,
                  minHeight: 54,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: isSel ? 'rgba(15,118,110,0.05)' : undefined,
                  '& > *': { minWidth: 0 },
                }}
              >
                <Checkbox
                  size="small"
                  checked={isSel}
                  disabled={s.status !== 'submitted'}
                  onChange={() => setSelected(x => (isSel ? x.filter(id => id !== s.id) : [...x, s.id]))}
                  inputProps={{ 'aria-label': `${person} ${day} auswählen` }}
                />
                <Typography sx={{ fontSize: 14 }} className="tabular-nums">
                  {day}
                </Typography>
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                  {person}
                </Typography>
                <Box>
                  <Typography noWrap sx={{ fontSize: 14 }}>
                    {facility}
                  </Typography>
                  {s.station && (
                    <Typography noWrap sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      {s.station}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 14 }} className="tabular-nums">
                    {time}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }} className="tabular-nums">
                    {s.breakMinutes} min Pause
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }} className="tabular-nums">
                  {fmtH(s.totalHours)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {flagChips(s)}
                  {s.status === 'rejected' && s.rejectionReason && (
                    <Tooltip title={s.rejectionReason}>
                      <Typography noWrap sx={{ fontSize: 13, color: 'error.main' }}>
                        {s.rejectionReason}
                      </Typography>
                    </Tooltip>
                  )}
                </Box>
                {signer(s)}
                <Box>{chip}</Box>
                {actions(s)}
              </Box>
            );
          })}
      </Box>

      <FacilityApprovalLinkDialog
        open={linkOpen}
        onClose={() => {
          setLinkOpen(false);
          invalidate();
        }}
        facilities={facilityList}
      />

      <Dialog open={!!rejecting} onClose={() => setRejecting(null)} fullWidth maxWidth="xs">
        <DialogTitle>Zeiten ablehnen</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 2 }}>
            {rejecting && `${names[rejecting.userId] ?? 'Person'}, ${format(rejecting.date, 'EEEE, dd.MM.yyyy', { locale: de })}, ${rejecting.startTime}–${rejecting.endTime}`}.
            Die Pflegekraft sieht den Grund und kann die Zeiten korrigieren.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Grund"
            placeholder="z. B. Pause fehlt, Ende laut Dienstplan 14:00"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setRejecting(null)}>Abbrechen</Button>
          <Button
            color="error"
            variant="contained"
            disabled={reason.trim().length < 5 || reject.isPending}
            onClick={() => rejecting && reject.mutate({ id: rejecting.id, why: reason.trim() })}
          >
            Ablehnen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmFlagged} onClose={() => setConfirmFlagged(null)} fullWidth maxWidth="xs">
        <DialogTitle>Trotz Hinweis freigeben?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            {confirmFlagged && confirmFlagged.filter(s => (s.arbzgFlags ?? []).some(f => f !== 'OVER_8H')).length} der
            ausgewählten Zeitnachweise verstoßen gegen das Arbeitszeitgesetz (Pause zu kurz oder mehr als 10 Stunden). Freigegebene
            Zeiten lassen sich nicht mehr ändern.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setConfirmFlagged(null)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (confirmFlagged) approve.mutate(confirmFlagged);
              setConfirmFlagged(null);
            }}
          >
            Trotzdem freigeben
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default TimesheetReview;
