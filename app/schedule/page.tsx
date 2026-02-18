'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /schedule → /admin/dienstplan
 * This page redirects to the German schedule route.
 * Note: For employees, use /employee/dienstplan directly.
 */
export default function ScheduleRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dienstplan');
  }, [router]);

  return null;
}

