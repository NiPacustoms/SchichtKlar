'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /legal/imprint → /recht/impressum
 * This page redirects to the German imprint route.
 */
export default function ImprintRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/recht/impressum');
  }, [router]);

  return null;
}
