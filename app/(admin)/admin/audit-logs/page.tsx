import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';

/**
 * Redirect für klare Auffindbarkeit: /admin/audit-logs zeigt dieselben
 * Audit-Logs wie /admin/pruefprotokolle (AuditLogViewer).
 */
export default function AuditLogsRedirectPage() {
  redirect(ROUTES.ADMIN.PRÜFPROTOKOLLE);
}
