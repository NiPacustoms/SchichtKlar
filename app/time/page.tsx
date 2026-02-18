'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /time → /employee/zeiten
 * This page redirects to the German time tracking route.
 */
export default function TimeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/employee/zeiten');
  }, [router]);

  return null;
}

