'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Inner component that uses useSearchParams – must be wrapped in Suspense for static export.
 */
function AcceptInviteRedirectInner() {
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

/**
 * Redirect page: /accept-invite → /einladung-annehmen
 * This page redirects to the German accept invite route, preserving query parameters.
 */
export default function AcceptInviteRedirect() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteRedirectInner />
    </Suspense>
  );
}
