'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Redirect page: /accept-invite → /einladung-annehmen
 * This page redirects to the German accept invite route, preserving query parameters.
 */
export default function AcceptInviteRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams?.get('token');
    const target = token
      ? `/einladung-annehmen?token=${encodeURIComponent(token)}`
      : '/einladung-annehmen';
    router.replace(target);
  }, [router, searchParams]);

  return null;
}
