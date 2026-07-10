import { notFound } from 'next/navigation';

// Admin-Bootstrap-Seite: in Produktion nur erreichbar, wenn der Bootstrap explizit
// aktiviert ist (NEXT_PUBLIC_ENABLE_ADMIN_BOOTSTRAP=true). Die eigentliche Absicherung
// liegt serverseitig in /api/auth/ensure-admin-role (ENABLE_ADMIN_BOOTSTRAP +
// ADMIN_BOOTSTRAP_EMAIL) – dieses Gate nimmt die Seite zusätzlich aus der Produktion.
export default function FixAdminRoleLayout({ children }: { children: React.ReactNode }) {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_ADMIN_BOOTSTRAP !== 'true'
  ) {
    notFound();
  }
  return children;
}
