'use client';

import { Box } from '@mui/material';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Volle Breite (mobil) */
  fullWidth?: boolean;
  'aria-label'?: string;
}

/**
 * iOS-Segmented-Control: grauer Track, aktives Segment weiß mit Mini-Schatten.
 * Ersetzt Tab-Leisten für lokale Filter (Offen/Angenommen/Erledigt etc.).
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  fullWidth = true,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <Box
      role="tablist"
      aria-label={ariaLabel}
      sx={{
        display: 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        p: '2px',
        gap: '2px',
        borderRadius: '10px',
        backgroundColor: '#e9e9ed',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Box
            key={opt.value}
            role="tab"
            tabIndex={0}
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(opt.value);
              }
            }}
            sx={{
              flex: fullWidth ? 1 : 'none',
              textAlign: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              px: 2,
              py: '7px',
              borderRadius: '8px',
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              color: active ? 'text.primary' : 'text.secondary',
              backgroundColor: active ? '#ffffff' : 'transparent',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'background-color 200ms cubic-bezier(0.4,0,0.2,1), color 200ms',
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
          >
            {opt.label}
          </Box>
        );
      })}
    </Box>
  );
}
