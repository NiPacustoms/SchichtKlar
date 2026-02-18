'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /admin/dashboard → /admin/uebersicht
 * This page redirects to the German overview route.
 */
export default function AdminDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/uebersicht');
  }, [router]);

  return null;
}
