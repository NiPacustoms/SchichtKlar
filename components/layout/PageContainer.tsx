'use client';

import { Box, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { PAGE_MAX_WIDTH_MAP, type PageMaxWidthPreset } from '@/lib/constants/layout';

export interface PageContainerProps {
  children: ReactNode;
  /** standard 1200 | wide 1400 | narrow 800 | form 720 */
  maxWidth?: PageMaxWidthPreset;
  /** Zusätzliches Padding unten (z. B. für BottomNavigation: pb: 10) */
  withBottomNav?: boolean;
  sx?: SxProps<Theme>;
}

const PADDING_RESPONSIVE = { px: { xs: 2, sm: 3 }, py: 3 };

/**
 * Einheitlicher Seiten-Container: maxWidth, zentriert, responsives Padding (DS: px xs 2, sm 3; py 3).
 * Nutzt [lib/constants/layout.ts](lib/constants/layout.ts).
 */
export function PageContainer({
  children,
  maxWidth = 'standard',
  withBottomNav = false,
  sx = {},
}: PageContainerProps) {
  const width = PAGE_MAX_WIDTH_MAP[maxWidth];
  return (
    <Box
      sx={{
        maxWidth: width,
        mx: 'auto',
        ...PADDING_RESPONSIVE,
        ...(withBottomNav && { pb: 10 }),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
