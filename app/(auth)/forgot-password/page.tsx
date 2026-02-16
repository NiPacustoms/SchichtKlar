'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /forgot-password → /passwort-vergessen
 * This page redirects to the German forgot password route.
 */
export default function ForgotPasswordRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/passwort-vergessen');
  }, [router]);

  return null;
}
