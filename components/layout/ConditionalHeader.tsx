'use client';

import { usePathname } from 'next/navigation';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useEffect, useState, useMemo } from 'react';

export function ConditionalHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Route-Prüfung nur nach Hydration (verhindert Hydration-Mismatch)
  const shouldRender = useMemo(() => {
    // Während SSR oder vor Hydration: nichts rendern
    if (!mounted || typeof window === 'undefined') {
      return false;
    }

    // Prüfe Route - verwende pathname (Next.js Hook)
    const currentPath = pathname || '';

    if (!currentPath) {
      // Wenn wir den Pfad nicht bestimmen können, rendern wir nichts (sicherer)
      return false;
    }

    // Header NUR rendern wenn Route NICHT ausgeschlossen ist
    // Admin/Employee-Bereiche haben ihren eigenen Header über AppLayout
    const isExcluded =
      currentPath === '/' ||
      currentPath === '/anmelden' ||
      currentPath === '/registrieren' ||
      currentPath === '/admin-registrieren' ||
      currentPath === '/passwort-vergessen' ||
      currentPath.startsWith('/anmeldung/') ||
      currentPath.startsWith('/recht/') ||
      currentPath.startsWith('/admin') ||
      currentPath.startsWith('/employee');

    return !isExcluded;
  }, [pathname, mounted]);

  // NIE rendern während SSR oder wenn Route ausgeschlossen ist
  if (!mounted || !shouldRender) {
    return null;
  }

  return <GlobalHeader />;
}
