'use client';

import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface LiveShiftTimerProps {
  /** Startzeit der Schicht als "HH:MM" (heute) */
  startTime: string;
  /** Optionale Endzeit "HH:MM" für den Ring-Fortschritt (Anteil der Schicht) */
  endTime?: string;
}

function hhmmToTodayMs(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d.getTime();
}

function fmt(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(hh)}:${p(mm)}:${p(ss)}`;
}

/**
 * Großer Live-Timer für die laufende Schicht (iOS-Stil):
 * Teal-Ring mit Fortschritt (Anteil der Schicht), große tabulare Ziffern,
 * pulsierender „Läuft"-Punkt. Respektiert prefers-reduced-motion.
 */
export function LiveShiftTimer({ startTime, endTime }: LiveShiftTimerProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startMs = hhmmToTodayMs(startTime);
  const elapsed = now ? (now - startMs) / 1000 : 0;

  let progress = 0;
  if (endTime) {
    const total = (hhmmToTodayMs(endTime) - startMs) / 1000;
    if (total > 0) progress = Math.min(1, Math.max(0, elapsed / total));
  }

  const size = 216;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <Box component="svg" width={size} height={size} sx={{ display: 'block', transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9e9ed" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#0f766e"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={endTime ? c * (1 - progress) : c * 0.001}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'success.main',
                '@media (prefers-reduced-motion: no-preference)': {
                  animation: 'pulseDot 1.6s ease-in-out infinite',
                },
                '@keyframes pulseDot': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.4, transform: 'scale(0.8)' },
                },
              }}
            />
            <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
              Läuft
            </Typography>
          </Box>
          <Typography
            className="tabular-nums"
            sx={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'text.primary' }}
          >
            {now ? fmt(elapsed) : '00:00:00'}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>seit {startTime} Uhr</Typography>
        </Box>
      </Box>
    </Box>
  );
}
