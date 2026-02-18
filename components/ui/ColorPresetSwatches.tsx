'use client';

import { Box, Typography } from '@mui/material';
import type { ColorPreset } from '@/lib/constants/colorPresets';

interface ColorPresetSwatchesProps {
  presets: ColorPreset[];
  value: string;
  onChange: (color: string) => void;
  label?: string;
  helperText?: string;
  /** Größe der Swatch-Kreise in px */
  size?: number;
}

export function ColorPresetSwatches({
  presets,
  value,
  onChange,
  label,
  helperText,
  size = 36,
}: ColorPresetSwatchesProps) {
  const normalizedValue = value?.toLowerCase?.() ?? '';

  return (
    <Box>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        {presets.map((preset) => {
          const isSelected =
            preset.value.toLowerCase() === normalizedValue ||
            preset.value === value;
          return (
            <Box
              key={preset.value}
              role="button"
              tabIndex={0}
              aria-label={`Farbe ${preset.label}, ${isSelected ? 'ausgewählt' : 'auswählen'}`}
              onClick={() => onChange(preset.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(preset.value);
                }
              }}
              sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                bgcolor: preset.value,
                border: '2px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                boxShadow: isSelected ? 2 : 0,
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 1,
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineOffset: 2,
                  outlineColor: 'primary.main',
                },
              }}
            />
          );
        })}
      </Box>
      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
