'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /login → /anmelden
 * This page redirects to the German login route.
 * Permanent redirect is also configured in next.config.js
 */
export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/anmelden');
  }, [router]);

  return null;
}
