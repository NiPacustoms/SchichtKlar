'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /admin/assignments → /admin/einsaetze
 * This page redirects to the German assignments route.
 */
export default function AdminAssignmentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/einsaetze');
  }, [router]);

  return null;
}
