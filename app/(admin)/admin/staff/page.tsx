'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /admin/staff → /admin/mitarbeiter
 * This page redirects to the German staff route.
 */
export default function AdminStaffRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/mitarbeiter');
  }, [router]);

  return null;
}
