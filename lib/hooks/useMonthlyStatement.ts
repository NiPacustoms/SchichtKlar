'use client';

import { useQuery } from '@tanstack/react-query';
import { timesheetStatementService } from '@/lib/services/timesheetStatements';
import { statementSignState } from '@/lib/domain/stundennachweis';

/** Lädt den Monatsnachweis einer Person inkl. Unterschriftsstatus */
export function useMonthlyStatement(companyId: string, userId: string, month: string) {
  const q = useQuery({
    queryKey: ['monthly-statement', companyId, userId, month],
    queryFn: () => timesheetStatementService.load({ companyId, userId, month }),
    enabled: !!companyId && !!userId,
  });
  const state = q.data ? statementSignState(q.data.statement, q.data.signatures) : undefined;
  return { ...q, state };
}

/** Blob als Datei herunterladen */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
