'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /legal/privacy → /recht/datenschutz
 * This page redirects to the German privacy route.
 */
export default function PrivacyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/recht/datenschutz');
  }, [router]);

  return null;
}
