'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /employee/assignments → /employee/einsaetze
 * This page redirects to the German assignments route.
 */
export default function EmployeeAssignmentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/employee/einsaetze');
  }, [router]);

  return null;
}

