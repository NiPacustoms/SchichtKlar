'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const StaffManagementPage = dynamic(
  () => import('./page').then(mod => ({ default: mod.default })),
  {
    loading: () => <LoadingSpinner message="Mitarbeiterverwaltung wird geladen..." />,
    ssr: false, // Disable server-side rendering
  }
);

export default function StaffManagementPageWrapper() {
  return <StaffManagementPage />;
}
