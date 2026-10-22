'use client';

import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccessTimeRounded,
  CampaignOutlined,
  CheckRounded,
  DrawOutlined,
  ReceiptLongOutlined,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';

/**
 * Produktansicht für die Startseite: der tatsächliche Ablauf eines Einsatzes
 * in Schichtklar – ohne erfundene Personen oder Kennzahlen. Die Schritte
 * werden nacheinander abgehakt (entfällt bei reduzierter Bewegung).
 */

const BRAND = '#0f766e';

const STEPS = [
  {
    icon: <CampaignOutlined fontSize="small" />,
    title: 'Einsatz planen',
    detail: 'Zuweisen oder an ausgewählte Pflegekräfte ausschreiben – 1 Einsatz pro Tag',
  },
  {
    icon: <DrawOutlined fontSize="small" />,
    title: 'Einsatzmitteilung § 11 AÜG',
    detail: 'Pflegekraft bestätigt digital mit Unterschrift, PDF wird abgelegt',
  },
  {
    icon: <AccessTimeRounded fontSize="small" />,
    title: 'Zeit erfassen',
    detail: 'Beginn, Ende, Pause – Prüfung nach Arbeitszeitgesetz, Einrichtung bestätigt',
  },
  {
    icon: <CheckRounded fontSize="small" />,
    title: 'Freigabe',
    detail: 'Disposition gibt frei – oder die Einrichtung per Link ohne eigenes Konto',
  },
  {
    icon: <ReceiptLongOutlined fontSize="small" />,
    title: 'Stundennachweis',
    detail: 'Monatsbogen: „erfasst“ und „anerkannt“ unterschrieben, als PDF',
  },
];

export function HeroWorkflowPreview() {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDone(STEPS.length);
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setDone(i);
      if (i >= STEPS.length) clearInterval(t);
    }, 650);
    return () => clearInterval(t);
  }, []);

  return (
    <Box
      role="img"
      aria-label="Ablauf in Schichtklar: Einsatz planen, Einsatzmitteilung, Zeit erfassen, Freigabe, Stundennachweis"
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid rgba(16,37,35,0.10)',
        boxShadow: '0 1px 2px rgba(16,37,35,0.06), 0 24px 60px -24px rgba(16,37,35,0.28)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid rgba(16,37,35,0.08)',
          bgcolor: '#fafaf9',
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#102523' }}>Ein Einsatz in Schichtklar</Typography>
        <Typography sx={{ fontSize: 12, color: 'rgba(16,37,35,0.55)' }} className="tabular-nums">
          {Math.min(done, STEPS.length)}/{STEPS.length}
        </Typography>
      </Box>

      <Box component="ol" sx={{ listStyle: 'none', m: 0, p: { xs: 2, sm: 2.5 }, display: 'grid', gap: 0 }}>
        {STEPS.map((s, i) => {
          const isDone = i < done;
          const isLast = i === STEPS.length - 1;
          return (
            <Box component="li" key={s.title} sx={{ display: 'flex', gap: 1.75, position: 'relative', pb: isLast ? 0 : 2 }}>
              {!isLast && (
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    left: 17,
                    top: 38,
                    bottom: 2,
                    width: 2,
                    borderRadius: 1,
                    bgcolor: isDone ? alpha(BRAND, 0.35) : 'rgba(16,37,35,0.08)',
                    transition: 'background-color .4s ease',
                  }}
                />
              )}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDone ? '#ffffff' : BRAND,
                  bgcolor: isDone ? BRAND : alpha(BRAND, 0.1),
                  transition: 'background-color .4s ease, color .4s ease',
                }}
              >
                {isDone ? <CheckRounded fontSize="small" /> : s.icon}
              </Box>
              <Box sx={{ minWidth: 0, pt: 0.25 }}>
                <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: '#102523', lineHeight: 1.35 }}>
                  {s.title}
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'rgba(16,37,35,0.62)', lineHeight: 1.45 }}>{s.detail}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default HeroWorkflowPreview;
