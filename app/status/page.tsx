'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /status → /systemstatus
 * This page redirects to the German system status route.
 */
export default function StatusRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/systemstatus');
  }, [router]);

  return null;
}


