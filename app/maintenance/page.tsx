'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /maintenance → /wartung
 * This page redirects to the German maintenance route.
 */
export default function MaintenanceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/wartung');
  }, [router]);

  return null;
}

