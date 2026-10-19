'use client';

import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckRounded, DrawOutlined } from '@mui/icons-material';
import { useEffect, useState } from 'react';

/**
 * Produktansicht für die Startseite: ein Wochen-Dienstplan mit echten
 * Bausteinen der App. Eine offene Schicht wird nach kurzer Zeit besetzt –
 * das einzige Bewegungs-Moment der Seite (entfällt bei reduzierter Bewegung).
 */

const FACILITIES = [
  { name: 'Haus am Park', color: '#0f766e' },
  { name: 'St. Elisabeth', color: '#2563eb' },
  { name: 'Pflegedienst Vest', color: '#b45309' },
];

const DAYS = ['Mo 19.', 'Di 20.', 'Mi 21.', 'Do 22.', 'Fr 23.'];

type Cell = { who: string; time: string } | { open: true; time: string } | null;

// Zeilen = Einrichtungen, Spalten = Tage
const GRID: Cell[][] = [
  [{ who: 'Lea B.', time: '06–14' }, { who: 'Murat Y.', time: '21–06' }, { who: 'Lea B.', time: '06–14' }, null, { who: 'Sophie H.', time: '13–21' }],
  [{ who: 'Jonas S.', time: '21–06' }, { who: 'Anna K.', time: '06–14' }, { open: true, time: '13–21' }, { who: 'Jonas S.', time: '21–06' }, null],
  [null, { who: 'Sophie H.', time: '06–14' }, { who: 'Mia W.', time: '13–21' }, { who: 'Anna K.', time: '06–14' }, { who: 'Murat Y.', time: '21–06' }],
];

export function HeroRosterPreview() {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setFilled(true);
      return;
    }
    const t = setTimeout(() => setFilled(true), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box sx={{ position: 'relative', pb: { xs: 6, sm: 5 } }}>
    <Box
      aria-label="Beispielansicht: Dienstplan einer Woche"
      role="img"
      sx={{
        position: 'relative',
        bgcolor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid rgba(16,37,35,0.10)',
        boxShadow: '0 1px 2px rgba(16,37,35,0.06), 0 24px 60px -24px rgba(16,37,35,0.28)',
        overflow: 'hidden',
        fontSize: 13,
        userSelect: 'none',
      }}
    >
      {/* Fensterkopf */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, height: 48, borderBottom: '1px solid rgba(16,37,35,0.08)' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 650 }}>Dienstplan</Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>19.–23. Oktober</Typography>
        <Box
          sx={{
            ml: 'auto',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            px: 1,
            py: 0.25,
            borderRadius: '6px',
            transition: 'all 400ms ease',
            color: filled ? '#166534' : '#92400e',
            bgcolor: filled ? 'rgba(22,101,52,0.08)' : 'rgba(180,83,9,0.10)',
          }}
        >
          {filled ? 'Alle Schichten besetzt' : '1 Schicht offen'}
        </Box>
      </Box>

      {/* Raster */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '96px repeat(3, minmax(0, 1fr))', sm: '150px repeat(5, minmax(0, 1fr))' } }}>
        <Box />
        {DAYS.map((d, i) => (
          <Box
            key={d}
            sx={{
              display: { xs: i > 2 ? 'none' : 'block', sm: 'block' },
              px: 1,
              py: 1,
              fontSize: 12,
              fontWeight: 600,
              color: i === 0 ? 'primary.main' : 'text.secondary',
              borderLeft: '1px solid rgba(16,37,35,0.06)',
            }}
          >
            {d}
          </Box>
        ))}
        {FACILITIES.map((f, r) => (
          <Box key={f.name} sx={{ display: 'contents' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                minHeight: 64,
                borderTop: '1px solid rgba(16,37,35,0.06)',
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: f.color, flexShrink: 0 }} />
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', sm: 'nowrap' }, lineHeight: 1.25, fontSize: { xs: 11.5, sm: 12.5 } }}>
                {f.name}
              </Box>
            </Box>
            {GRID[r].map((cell, c) => {
              const isOpen = cell && 'open' in cell;
              const showFilled = isOpen && filled;
              return (
                <Box key={c} sx={{ display: { xs: c > 2 ? 'none' : 'block', sm: 'block' }, p: 0.75, borderTop: '1px solid rgba(16,37,35,0.06)', borderLeft: '1px solid rgba(16,37,35,0.06)' }}>
                  {cell && (
                    <Box
                      sx={{
                        height: '100%',
                        minHeight: 48,
                        borderRadius: '8px',
                        px: 1,
                        py: 0.75,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        transition: 'background-color 500ms ease, border-color 500ms ease',
                        ...(isOpen && !showFilled
                          ? { border: '1.5px dashed rgba(180,83,9,0.55)', bgcolor: 'rgba(180,83,9,0.05)' }
                          : { border: '1px solid transparent', bgcolor: alpha(f.color, 0.09), boxShadow: `inset 3px 0 0 ${f.color}` }),
                      }}
                    >
                      <Box sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25, color: isOpen && !showFilled ? '#92400e' : 'text.primary' }}>
                        {isOpen ? (showFilled ? 'Lea B.' : 'Offen') : (cell as { who: string }).who}
                      </Box>
                      <Box sx={{ fontSize: 11.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{cell.time}</Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

    </Box>

      {/* Bestätigung – erscheint mit der Besetzung, ragt unten aus dem Fenster */}
      <Box
        sx={{
          position: 'absolute',
          right: { xs: 12, sm: 28 },
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          pl: 1,
          pr: 1.75,
          py: 1,
          bgcolor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid rgba(16,37,35,0.10)',
          boxShadow: '0 12px 32px -12px rgba(16,37,35,0.35)',
          opacity: filled ? 1 : 0,
          transform: filled ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 400ms ease 250ms, transform 400ms ease 250ms',
        }}
      >
        <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: 'rgba(15,118,110,0.10)', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
          <DrawOutlined sx={{ fontSize: 17 }} />
        </Box>
        <Box>
          <Box sx={{ fontSize: 12.5, fontWeight: 650, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Einsatzmitteilung unterschrieben <CheckRounded sx={{ fontSize: 15, color: '#166534' }} />
          </Box>
          <Box sx={{ fontSize: 11.5, color: 'text.secondary' }}>Lea B. · St. Elisabeth · Mi 13–21 Uhr</Box>
        </Box>
      </Box>
    </Box>
  );
}

export default HeroRosterPreview;
