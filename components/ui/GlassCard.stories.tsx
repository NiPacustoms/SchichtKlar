import type { Meta, StoryObj } from '@storybook/react';
import { Typography } from '@mui/material';
import { GlassCard } from './GlassCard';

const meta: Meta<typeof GlassCard> = {
  title: 'UI/GlassCard',
  component: GlassCard,
  tags: ['autodocs'],
  argTypes: {
    hover: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof GlassCard>;

export const Default: Story = {
  args: {
    children: (
      <Typography sx={{ p: 2 }}>
        Inhalt in einer GlassCard – Glasmorphism-Stil mit Backdrop-Blur.
      </Typography>
    ),
  },
};

export const NoHover: Story = {
  args: {
    hover: false,
    children: (
      <Typography sx={{ p: 2 }}>
        Karte ohne Hover-Effekt (z. B. für statische Blöcke).
      </Typography>
    ),
  },
};

export const Elevation0: Story = {
  args: {
    elevation: 0,
    children: (
      <Typography sx={{ p: 2 }}>
        GlassCard mit elevation=0 (kein Schatten).
      </Typography>
    ),
  },
};

export const Elevation3: Story = {
  args: {
    elevation: 3,
    children: (
      <Typography sx={{ p: 2 }}>
        GlassCard mit elevation=3 (stärkerer Schatten).
      </Typography>
    ),
  },
};

export const Elevation4: Story = {
  args: {
    elevation: 4,
    children: (
      <Typography sx={{ p: 2 }}>
        GlassCard mit elevation=4 (maximaler Schatten).
      </Typography>
    ),
  },
};
