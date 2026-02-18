'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /admin/shifts → /admin/schichten
 * This page redirects to the German shifts route.
 */
export default function AdminShiftsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/schichten');
  }, [router]);

  return null;
}
