'use client';

import { useEffect, useMemo, useState } from 'react';
import { subscribeAuditLogs, type AuditLogViewItem } from '@/lib/services/auditLogService';

type Props = {
  companyId?: string;
};

export default function AuditLogViewer({ companyId }: Props) {
  const [logs, setLogs] = useState<AuditLogViewItem[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');

  useEffect(() => {
    const unsub = subscribeAuditLogs({ companyId, limit: 100 }, setLogs);
    return unsub;
  }, [companyId]);

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

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
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
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Zeit</th>
              <th className="text-left p-2">Action</th>
              <th className="text-left p-2">Actor</th>
              <th className="text-left p-2">Target</th>
              <th className="text-left p-2">RequestId</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l: AuditLogViewItem) => {
              const date: Date | undefined = l.createdAt
                ? l.createdAt instanceof Date
                  ? l.createdAt
                  : new Date(((l.createdAt as { seconds?: number }).seconds ?? 0) * 1000)
                : undefined;
              return (
                <tr key={l.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">
                    {date ? new Date(date).toLocaleString() : '-'}
                  </td>
                  <td className="p-2">{l.action}</td>
                  <td className="p-2">{l.actorUid}</td>
                  <td className="p-2">
                    {l.target ? `${l.target.collection}/${l.target.id}` : '-'}
                  </td>
                  <td className="p-2">{l.requestId || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
