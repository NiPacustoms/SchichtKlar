'use client';

import { Box, Typography, Stack } from '@mui/material';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
  children?: ReactNode; // Für Filter/Tabs etc.
}

/**
 * Einheitlicher Seitenkopf: Titel + Untertitel links als Block, Aktionen rechts.
 *
 * Eine Größe für alle Seiten – der Seitenkopf orientiert, er dekoriert nicht.
 * Mobil rutschen die Aktionen unter den Titel und nehmen die volle Breite.
 *
 * ```tsx
 * <PageHeader
 *   title="Schichten"
 *   subtitle="Alle Schichten Ihrer Einrichtungen"
 *   actions={<Button variant="contained">Neue Schicht</Button>}
 * />
 * ```
 */
export function PageHeader({ title, subtitle, actions, children }: PageHeaderProps) {
  return (
    <Box component="header" sx={{ mb: { xs: 3, lg: 3.5 } }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {typeof title === 'string' ? (
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 26, lg: 28 },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: 'text.primary',
              }}
            >
              {title}
            </Typography>
          ) : (
            title
          )}
          {subtitle &&
            (typeof subtitle === 'string' ? (
              <Typography sx={{ mt: 0.5, fontSize: 14.5, color: 'text.secondary', maxWidth: '68ch' }}>
                {subtitle}
              </Typography>
            ) : (
              <Box sx={{ mt: 0.5 }}>{subtitle}</Box>
            ))}
        </Box>
        {actions && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              flexShrink: 0,
              width: { xs: '100%', sm: 'auto' },
              flexWrap: 'wrap',
              rowGap: 1,
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              // Mobil: nur die Hauptaktion nimmt die volle Restbreite
              '& > .MuiButton-contained': { flex: { xs: 1, sm: 'none' } },
            }}
          >
            {actions}
          </Stack>
        )}
      </Box>
      {children && <Box sx={{ mt: 2.5 }}>{children}</Box>}
    </Box>
  );
}
