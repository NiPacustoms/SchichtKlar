'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { subscribeAuditLogs, type AuditLogViewItem } from '@/lib/services/auditLogService';
import { Box } from '@mui/material';
import Button from '@mui/material/Button';

export type AuditLogViewerProps = {
  companyId?: string;
  /** Maximale Anzahl Einträge (Standard: 100 auf Vollseite, 10 im Compact-Modus) */
  limit?: number;
  /** Kompakte Einbettung: weniger Spalten, keine Filter, optionaler Link zur Vollseite */
  compact?: boolean;
  /** Filter-Inputs anzeigen (Standard: true bei compact=false) */
  showFilters?: boolean;
  /** Bei compact: Link zur Vollseite anzeigen (z. B. /admin/pruefprotokolle) */
  linkToFullPage?: string;
};

export default function AuditLogViewer({
  companyId,
  limit: limitProp,
  compact = false,
  showFilters: showFiltersProp,
  linkToFullPage,
}: AuditLogViewerProps) {
  const limit = limitProp ?? (compact ? 10 : 100);
  const showFilters = showFiltersProp ?? !compact;

  const [logs, setLogs] = useState<AuditLogViewItem[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');

  useEffect(() => {
    const unsub = subscribeAuditLogs({ companyId, limit }, setLogs);
    return unsub;
  }, [companyId, limit]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const byAction = actionFilter
        ? l.action?.toLowerCase().includes(actionFilter.toLowerCase())
        : true;
      const byActor = actorFilter
        ? l.actorUid?.toLowerCase().includes(actorFilter.toLowerCase())
        : true;
      return byAction && byActor;
    });
  }, [logs, actionFilter, actorFilter]);

  const formatDate = (l: AuditLogViewItem) => {
    const date: Date | undefined = l.createdAt
      ? l.createdAt instanceof Date
        ? l.createdAt
        : new Date(((l.createdAt as { seconds?: number }).seconds ?? 0) * 1000)
      : undefined;
    return date ? new Date(date).toLocaleString() : '-';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {showFilters && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <input
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            placeholder="Action filtern (z. B. shift.update)"
            className="border rounded px-3 py-2 w-64"
          />
          <input
            value={actorFilter}
            onChange={e => setActorFilter(e.target.value)}
            placeholder="Actor UID filtern"
            className="border rounded px-3 py-2 w-64"
          />
        </Box>
      )}

      <Box sx={{ overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Zeit</th>
              <th className="text-left p-2">Action</th>
              {!compact && <th className="text-left p-2">Actor</th>}
              <th className="text-left p-2">Target</th>
              {!compact && <th className="text-left p-2">RequestId</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={compact ? 3 : 5} className="p-4 text-center text-gray-500">
                  Keine Einträge
                </td>
              </tr>
            ) : (
              filtered.map((l: AuditLogViewItem) => (
                <tr key={l.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">{formatDate(l)}</td>
                  <td className="p-2">{l.action}</td>
                  {!compact && <td className="p-2">{l.actorUid}</td>}
                  <td className="p-2">
                    {l.target ? `${l.target.collection}/${l.target.id}` : '-'}
                  </td>
                  {!compact && <td className="p-2">{l.requestId || '-'}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
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
