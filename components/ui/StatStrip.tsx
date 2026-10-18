'use client';

import { Box, ButtonBase, Typography, useTheme } from '@mui/material';
import type { ReactNode } from 'react';

export type StatTone = 'default' | 'attention' | 'muted';

export interface StatItem {
  label: string;
  value: ReactNode;
  /** 'attention' färbt die Zahl als Hinweis (z. B. offene Schichten > 0). */
  tone?: StatTone;
  /** Klickbare Kennzahl – z. B. Liste auf diesen Status filtern. */
  onClick?: () => void;
  /** Markiert die gerade aktive Filter-Kennzahl. */
  selected?: boolean;
  hint?: string;
}

/**
 * Kompakte Kennzahlen-Leiste: eine Fläche, Werte nebeneinander, durch
 * Trennlinien gegliedert. Ersetzt Reihen einzelner Kacheln, die viel Platz
 * brauchen und den eigentlichen Inhalt nach unten drücken.
 */
export function StatStrip({ items, 'aria-label': ariaLabel = 'Kennzahlen' }: { items: StatItem[]; 'aria-label'?: string }) {
  const line = `1px solid ${useTheme().palette.divider}`;
  return (
    <Box
      role="list"
      aria-label={ariaLabel}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: `repeat(${items.length}, minmax(0, 1fr))` },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      {items.map((item, i) => {
        const inner = (
          <>
            <Typography
              className="tabular-nums"
              sx={{
                fontSize: 22,
                fontWeight: 650,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                color:
                  item.tone === 'attention'
                    ? 'warning.dark'
                    : item.tone === 'muted'
                      ? 'text.secondary'
                      : 'text.primary',
              }}
            >
              {item.value}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 13, color: 'text.secondary', lineHeight: 1.35 }}>
              {item.label}
            </Typography>
            {item.hint && (
              <Typography sx={{ fontSize: 12, color: 'text.disabled', lineHeight: 1.35 }}>{item.hint}</Typography>
            )}
          </>
        );
        const cellSx = {
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'flex-start',
          textAlign: 'left' as const,
          px: 2.5,
          py: 1.75,
          minWidth: 0,
          // Trennlinien: links zwischen Spalten, oben zwischen Zeilen (mobil 2 Spalten)
          borderLeft: { xs: i % 2 === 1 ? line : 'none', md: i > 0 ? line : 'none' },
          borderTop: { xs: i >= 2 ? line : 'none', md: 'none' },
          bgcolor: item.selected ? 'action.selected' : 'transparent',
        };
        return (
          <Box role="listitem" key={item.label} sx={{ display: 'contents' }}>
            {item.onClick ? (
              <ButtonBase
                onClick={item.onClick}
                aria-pressed={item.selected ?? undefined}
                sx={{ ...cellSx, '&:hover': { bgcolor: item.selected ? 'action.selected' : 'action.hover' } }}
              >
                {inner}
              </ButtonBase>
            ) : (
              <Box sx={cellSx}>{inner}</Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default StatStrip;
