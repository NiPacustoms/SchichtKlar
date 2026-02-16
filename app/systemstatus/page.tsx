'use client';
import { useEffect, useState } from 'react';

export default function StatusPage() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'degraded'>('loading');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) {
          setStatus(res.ok ? 'ok' : 'degraded');
          setDetails(data?.error || '');
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setStatus('degraded');
          const message = e instanceof Error ? e.message : 'unknown';
          setDetails(message);
        }
      }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Systemstatus</h1>
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded ${status === 'ok' ? 'bg-green-100 text-green-800' : status === 'loading' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}
      >
        <span
          className={`h-3 w-3 rounded-full ${status === 'ok' ? 'bg-green-500' : status === 'loading' ? 'bg-gray-500' : 'bg-yellow-500'}`}
        />
        <span>
          {status === 'ok' ? 'Operational' : status === 'loading' ? 'Checking…' : 'Degraded'}
        </span>
      </div>
      {details && <p className="mt-3 text-sm text-gray-600">{details}</p>}
    </div>
  );
}
