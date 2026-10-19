'use client';

import { Box, Chip, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { MonthlyStatement } from '@/lib/domain/stundennachweis';

const WEEKDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const day = (k: string) => {
  const [, m, d] = k.split('-');
  return `${WEEKDAY[new Date(`${k}T12:00:00Z`).getUTCDay()]} ${d}.${m}.`;
};
export const fmtStd = (n: number | null | undefined) =>
  n == null ? '' : n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ZUSATZ_COLOR = { U: 'success', K: 'info' } as const;

/**
 * Tagestabelle des Stundennachweises – Spalten wie auf dem Papierbogen
 * (Datum, Beginn, Ende, Pause, Dauer, Zusatz, Bemerkungen); mobil als Liste.
 */
export function StatementTable({ statement }: { statement: MonthlyStatement }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const rows = statement.rows;
  const frame = { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' } as const;

  if (!rows.length) {
    return (
      <Box sx={{ ...frame, py: 6, textAlign: 'center', color: 'text.secondary' }}>
        <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>Keine Zeiten in diesem Monat</Typography>
        <Typography sx={{ fontSize: 14 }}>Erfasste Dienste erscheinen hier automatisch.</Typography>
      </Box>
    );
  }

  const pending = (s?: string) =>
    s && s !== 'approved' ? (
      <Chip size="small" variant="outlined" color={s === 'draft' ? 'default' : 'warning'} label={s === 'draft' ? 'Entwurf' : 'in Prüfung'} sx={{ height: 20, fontSize: 11 }} />
    ) : null;

  if (!desktop) {
    return (
      <Box sx={frame} role="list" aria-label="Tage im Monat">
        {rows.map((r, i) => (
          <Box key={`${r.dayKey}-${i}`} role="listitem" data-testid="statement-row" sx={{ px: 2, py: 1.5, borderTop: i ? '1px solid' : 'none', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 15, minWidth: 74 }}>{day(r.dayKey)}</Typography>
              {r.zusatz ? (
                <Chip size="small" color={ZUSATZ_COLOR[r.zusatz as 'U' | 'K'] ?? 'default'} label={`${r.zusatz} · ${r.remark}`} sx={{ height: 22 }} />
              ) : (
                <Typography sx={{ fontSize: 15, flex: 1 }}>
                  {r.begin}–{r.end} <Box component="span" sx={{ color: 'text.secondary' }}>· Pause {fmtStd(r.pauseHours)} h</Box>
                </Typography>
              )}
              {!r.zusatz && <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtStd(r.hours)}</Typography>}
            </Box>
            {!r.zusatz && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.25, pl: '82px' }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', flex: 1, minWidth: 0 }}>{r.remark}</Typography>
                {pending(r.status)}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  }

  const cols = '96px 70px 70px 84px 84px 64px minmax(0,1fr)';
  return (
    <Box sx={frame} role="table" aria-label="Tage im Monat">
      <Box
        role="row"
        sx={{ display: 'grid', gridTemplateColumns: cols, px: 2, py: 1.25, bgcolor: 'action.hover', fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.3 }}
      >
        {['Datum', 'Beginn', 'Ende', 'Pause (Std.)', 'Dauer (Std.)', 'Zusatz', 'Bemerkungen'].map((h, i) => (
          <Box key={h} role="columnheader" sx={{ textAlign: i === 3 || i === 4 ? 'right' : 'left', pr: i === 3 || i === 4 ? 2 : 0 }}>
            {h}
          </Box>
        ))}
      </Box>
      {rows.map((r, i) => (
        <Box
          key={`${r.dayKey}-${i}`}
          role="row"
          data-testid="statement-row"
          sx={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', px: 2, py: 1.1, borderTop: '1px solid', borderColor: 'divider', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}
        >
          <Box role="cell" sx={{ fontWeight: 600 }}>{day(r.dayKey)}</Box>
          <Box role="cell">{r.begin}</Box>
          <Box role="cell">{r.end}</Box>
          <Box role="cell" sx={{ textAlign: 'right', pr: 2 }}>{fmtStd(r.pauseHours)}</Box>
          <Box role="cell" sx={{ textAlign: 'right', pr: 2, fontWeight: 700 }}>{fmtStd(r.hours)}</Box>
          <Box role="cell">{r.zusatz && <Chip size="small" color={ZUSATZ_COLOR[r.zusatz as 'U' | 'K'] ?? 'default'} label={r.zusatz} sx={{ height: 22, minWidth: 28 }} />}</Box>
          <Box role="cell" sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 0 }}>
            <Typography noWrap title={r.remark} sx={{ fontSize: 13.5, color: 'text.secondary', minWidth: 0 }}>
              {r.remark}
            </Typography>
            {pending(r.status)}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
