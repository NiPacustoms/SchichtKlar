'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, LinearProgress } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { duration, easing } from '@/lib/design-tokens';

const AUTO_ADVANCE_MS = 5000;

export interface KPISlideshowProps {
  /** Ein oder mehrere Slides (z. B. KPI-Cards); ein Slide pro Index */
  children: React.ReactNode[];
  /** Auto-Wechsel in ms; 0 = aus */
  autoAdvanceMs?: number;
}

export function KPISlideshow({ children, autoAdvanceMs = AUTO_ADVANCE_MS }: KPISlideshowProps) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const count = children.length;
  const safeIndex = count <= 0 ? 0 : ((index % count) + count) % count;
  const autoPlay = autoAdvanceMs > 0 && count > 1;

  const goNext = useCallback(() => {
    setIndex((i) => (count <= 0 ? 0 : (i + 1) % count));
    setProgress(0);
  }, [count]);

  const goPrev = useCallback(() => {
    setIndex((i) => (count <= 0 ? 0 : (i - 1 + count) % count));
    setProgress(0);
  }, [count]);

  useEffect(() => {
    if (count <= 0 || !autoPlay) return;
    const t = setInterval(goNext, autoAdvanceMs);
    return () => clearInterval(t);
  }, [count, autoAdvanceMs, goNext, autoPlay]);

  useEffect(() => {
    if (!autoPlay) return;
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const value = Math.min(100, (elapsed / autoAdvanceMs) * 100);
      setProgress(value);
      if (value < 100) requestAnimationFrame(frame);
    };
    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [safeIndex, autoAdvanceMs, autoPlay]);

  if (count === 0) return null;
  if (count === 1) return <Box>{children[0]}</Box>;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Slide-Stage mit seitlichen Pfeilen */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'stretch',
          minHeight: 152,
        }}
      >
        {/* Pfeil links */}
        <IconButton
          onClick={goPrev}
          aria-label="Vorherige Karte"
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            width: 40,
            height: 40,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 1,
            transition: `box-shadow ${duration.base}ms ${easing}, transform ${duration.base}ms ${easing}, background-color ${duration.base}ms ${easing}`,
            '&:hover': {
              bgcolor: 'action.hover',
              boxShadow: 2,
              transform: 'translateY(-50%) scale(1.05)',
            },
            '&:active': {
              transform: 'translateY(-50%) scale(0.98)',
            },
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>

        {/* Inhalt mit Fade-Übergang */}
        <Box
          key={safeIndex}
          sx={{
            flex: 1,
            px: 6,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'kpiSlideFade 0.35s ease-out',
            '@keyframes kpiSlideFade': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 },
            },
          }}
        >
          {children[safeIndex]}
        </Box>

        {/* Pfeil rechts */}
        <IconButton
          onClick={goNext}
          aria-label="Nächste Karte"
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            width: 40,
            height: 40,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 1,
            transition: `box-shadow ${duration.base}ms ${easing}, transform ${duration.base}ms ${easing}, background-color ${duration.base}ms ${easing}`,
            '&:hover': {
              bgcolor: 'action.hover',
              boxShadow: 2,
              transform: 'translateY(-50%) scale(1.05)',
            },
            '&:active': {
              transform: 'translateY(-50%) scale(0.98)',
            },
          }}
        >
          <ChevronRight sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>

      {/* Untere Leiste: Dots + optional Progress */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          pt: 1.5,
          pb: 0.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {children.map((_, i) => (
            <Box
              key={i}
              component="button"
              type="button"
              onClick={() => {
                setIndex(i);
                setProgress(0);
              }}
              aria-label={'Karte ' + (i + 1) + ' von ' + count}
              aria-current={i === safeIndex ? 'true' : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIndex(i);
                  setProgress(0);
                }
              }}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                bgcolor: i === safeIndex ? 'primary.main' : 'action.hover',
                opacity: i === safeIndex ? 1 : 0.6,
                transition: `opacity ${duration.base}ms ${easing}, background-color ${duration.base}ms ${easing}, transform ${duration.base}ms ${easing}`,
                '&:hover': {
                  opacity: 1,
                  bgcolor: i === safeIndex ? 'primary.dark' : 'action.selected',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineOffset: 2,
                  outlineColor: 'primary.main',
                },
              }}
            />
          ))}
        </Box>

        {autoPlay && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              width: '100%',
              maxWidth: 200,
              height: 2,
              borderRadius: 1,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
                transition: 'none',
              },
            }}
            aria-hidden
          />
        )}
      </Box>
    </Box>
  );
}
