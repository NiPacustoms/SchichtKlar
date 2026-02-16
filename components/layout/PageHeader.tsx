'use client';

import { Box, Typography, Stack } from '@mui/material';
import type { ReactNode } from 'react';
import { Fragment } from 'react';

export interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
  children?: ReactNode; // Für Filter/Tabs etc.
}

/**
 * Standard-Page-Header-Komponente gemäß Design System 2026
 *
 * Verwendung:
 * ```tsx
 * <PageHeader
 *   title="Seitentitel"
 *   subtitle="Optionaler Untertitel"
 *   actions={
 *     <Stack direction="row" spacing={1}>
 *       <Button variant="outlined">Sekundär</Button>
 *       <Button variant="contained">Primär</Button>
 *     </Stack>
 *   }
 * >
 *   {/* Optional: Filter/Tabs darunter *\/}
 * </PageHeader>
 * ```
 */
export function PageHeader({ title, subtitle, actions, children }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box
        key="page-header-row"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: subtitle ? 1 : 0,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: 2,
        }}
      >
        <Fragment key="page-header-title">
          {typeof title === 'string' ? (
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          ) : (
            title
          )}
        </Fragment>
        {actions && (
          <Stack
            key="page-header-actions"
            direction="row"
            spacing={1}
            sx={{
              flexShrink: 0,
              width: { xs: '100%', sm: 'auto' },
              '& > *': {
                width: { xs: '100%', sm: 'auto' },
              },
            }}
          >
            {actions}
          </Stack>
        )}
      </Box>
      {subtitle && (
        <Box key="page-header-subtitle" component="span" sx={{ display: 'block' }}>
          {typeof subtitle === 'string' ? (
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          ) : (
            subtitle
          )}
        </Box>
      )}
      {children && (
        <Box key="page-header-children" sx={{ mt: 2 }}>
          {children}
        </Box>
      )}
    </Box>
  );
}
