'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page: /admin/chat → /admin/kommunikation
 * This page redirects to the German communication route.
 */
export default function AdminChatRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/kommunikation');
  }, [router]);

  return null;
}
