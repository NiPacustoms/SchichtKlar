'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /employee/chat → /employee/unterhaltungen
 * This page redirects to the German conversations route.
 */
export default function EmployeeChatRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/employee/unterhaltungen');
  }, [router]);

  return null;
}
