'use client';

import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import { duration, easing } from '@/lib/design-tokens';

/**
 * Dezenter Seiten-Reveal: Inhalt blendet bei jedem Routenwechsel sanft ein
 * und steigt minimal auf (iOS-artiger „Content-Reveal"). Der `key` auf dem
 * Pathname sorgt dafür, dass die Animation bei jeder Navigation neu abspielt.
 * `prefers-reduced-motion` deaktiviert die Bewegung vollständig.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Box
      key={pathname}
      sx={{
        animation: `pageReveal ${duration.smooth}ms ${easing} both`,
        '@keyframes pageReveal': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
      }}
    >
      {children}
    </Box>
  );
}
