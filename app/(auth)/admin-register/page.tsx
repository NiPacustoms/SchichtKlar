'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /admin-register → /admin-registrieren
 * This page redirects to the German admin registration route.
 */
export default function AdminRegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin-registrieren');
  }, [router]);

  return null;
}

