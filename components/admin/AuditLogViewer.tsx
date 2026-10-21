'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Chip, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { DownloadRounded, SearchRounded } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/services';
import { subscribeAuditLogs, type AuditLogViewItem } from '@/lib/services/auditLogService';

export type AuditLogViewerProps = {
  companyId?: string;
  /** Maximale Anzahl Einträge (Standard: 300 auf Vollseite, 10 im Compact-Modus) */
  limit?: number;
  /** Kompakte Einbettung: weniger Spalten, keine Filter, optionaler Link zur Vollseite */
  compact?: boolean;
  /** Filter anzeigen (Standard: true bei compact=false) */
  showFilters?: boolean;
  /** Bei compact: Link zur Vollseite anzeigen (z. B. /admin/pruefprotokolle) */
  linkToFullPage?: string;
};

type Item = AuditLogViewItem & { summary?: string; subjectUid?: string | null };

const GROUPS = [
  { key: 'all', label: 'Alle', match: () => true },
  { key: 'timesheet', label: 'Zeiten', match: (a: string) => a.startsWith('timesheet.') },
  { key: 'statement', label: 'Stundennachweise', match: (a: string) => a.startsWith('statement.') },
  { key: 'assignment', label: 'Einsätze', match: (a: string) => a.startsWith('assignment.') },
  { key: 'master', label: 'Stammdaten & Lohn', match: (a: string) => a.startsWith('user.') || a.startsWith('payroll.') || a.startsWith('facility.') },
] as const;

const toDate = (l: Item): Date | null => {
  const c = l.createdAt;
  if (!c) return null;
  if (c instanceof Date) return c;
  return new Date(((c as { seconds?: number }).seconds ?? 0) * 1000);
};
const fmt = (d: Date | null) =>
  d ? d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }) : '–';

/**
 * Prüfprotokoll: wer hat wann was an Zeiten, Nachweisen,
 * Einsätzen und Stammdaten geändert. Einträge schreibt nur der Server.
 */
export default function AuditLogViewer({ companyId, limit: limitProp, compact = false, showFilters: showFiltersProp, linkToFullPage }: AuditLogViewerProps) {
  const limit = limitProp ?? (compact ? 10 : 300);
  const showFilters = showFiltersProp ?? !compact;
  const { user } = useAuth();
  // Ohne explizite Firma: eigene Firma (Rules erlauben nur diese)
  const cid = companyId ?? user?.companyId ?? undefined;
  const [logs, setLogs] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [group, setGroup] = useState<(typeof GROUPS)[number]['key']>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!cid) return;
    setLoadError(false);
    const unsub = subscribeAuditLogs(
      { companyId: cid, limit },
      l => {
        setLogs(l as Item[]);
        setLoaded(true);
      },
      () => {
        setLoadError(true);
        setLoaded(true);
      }
    );
    return unsub;
  }, [cid, limit]);

  const { data: names = {} } = useQuery({
    queryKey: ['audit-names', cid],
    queryFn: async () => {
      const res = await userService.getAll(1, 1000, { companyId: cid });
      const list = Array.isArray(res) ? res : res.data;
      return Object.fromEntries(list.map(u => [u.id, u.displayName || u.email || u.id])) as Record<string, string>;
    },
    enabled: !!cid,
  });

  const filtered = useMemo(() => {
    const who = (uid?: string | null) => (uid ? names[uid] ?? '' : '');
    const g = GROUPS.find(x => x.key === group)!;
    const q = search.trim().toLowerCase();
    return logs.filter(l => {
      if (!g.match(l.action || '')) return false;
      if (!q) return true;
      return [l.summary, l.action, who(l.actorUid), who(l.subjectUid)].some(v => v?.toLowerCase().includes(q));
    });
  }, [logs, group, search, names]);

  const who = (uid?: string | null) => (!uid ? '–' : uid === 'system' ? 'System' : names[uid] ?? 'Unbekannt');

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ['Zeitpunkt', 'Vorgang', 'Aktion', 'Ausgeführt von', 'Betroffen', 'Objekt'],
      ...filtered.map(l => [fmt(toDate(l)), l.summary || '', l.action, who(l.actorUid), who(l.subjectUid), l.target ? `${l.target.collection}/${l.target.id}` : '']),
    ];
    const blob = new Blob(['﻿' + rows.map(r => r.map(esc).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Pruefprotokoll_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {loadError && <Alert severity="error">Prüfprotokolle konnten nicht geladen werden.</Alert>}
      {showFilters && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75, flex: 1 }}>
            {GROUPS.map(g => (
              <Chip key={g.key} label={g.label} color={group === g.key ? 'primary' : 'default'} variant={group === g.key ? 'filled' : 'outlined'} onClick={() => setGroup(g.key)} />
            ))}
          </Stack>
          <TextField
            size="small"
            placeholder="Person oder Vorgang suchen"
            value={search}
            onChange={e => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }}
            sx={{ minWidth: { md: 260 } }}
          />
          <Button variant="outlined" startIcon={<DownloadRounded />} disabled={!filtered.length} onClick={exportCsv}>
            CSV
          </Button>
        </Stack>
      )}

      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }} role="table" aria-label="Prüfprotokoll">
        {!loaded ? (
          <Typography sx={{ p: 3, color: 'text.secondary' }}>Lade …</Typography>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>Keine Einträge</Typography>
            <Typography sx={{ fontSize: 14 }}>Freigaben, Unterschriften, Einsätze und Stammdaten-Änderungen erscheinen hier automatisch.</Typography>
          </Box>
        ) : (
          filtered.map((l, i) => (
            <Box
              key={l.id}
              role="row"
              data-testid="audit-row"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: compact ? '140px 1fr' : '150px minmax(0,1fr) 180px 180px' },
                gap: { xs: 0.25, md: 2 },
                px: 2,
                py: 1.25,
                borderTop: i ? '1px solid' : 'none',
                borderColor: 'divider',
                fontSize: 14,
              }}
            >
              <Box role="cell" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{fmt(toDate(l))}</Box>
              <Box role="cell" sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{l.summary || l.action}</Typography>
                {!compact && <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>{l.action}</Typography>}
              </Box>
              {!compact && (
                <>
                  <Box role="cell" sx={{ color: 'text.secondary' }}>
                    <Box component="span" sx={{ display: { md: 'none' } }}>von </Box>
                    {who(l.actorUid)}
                  </Box>
                  <Box role="cell" sx={{ color: 'text.secondary' }}>
                    <Box component="span" sx={{ display: { md: 'none' } }}>betrifft </Box>
                    {who(l.subjectUid)}
                  </Box>
                </>
              )}
            </Box>
          ))
        )}
      </Box>

      {compact && linkToFullPage && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button component={Link} href={linkToFullPage} size="small" variant="text">
            Alle Prüfprotokolle anzeigen
          </Button>
        </Box>
      )}
    </Box>
  );
}
