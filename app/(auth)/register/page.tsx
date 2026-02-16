'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /register → /registrieren
 * This page redirects to the German registration route.
 * Permanent redirect is also configured in next.config.js
 */
export default function RegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/registrieren');
  }, [router]);

  return null;
}
