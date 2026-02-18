'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ZeiterfassungRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/employee/zeiterfassung');
  }, [router]);

  return null;
}

