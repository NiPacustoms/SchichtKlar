import type { Meta, StoryObj } from '@storybook/react';
import { LimitWarningBanner } from './LimitWarningBanner';

const meta: Meta<typeof LimitWarningBanner> = {
  title: 'Timesheets/LimitWarningBanner',
  component: LimitWarningBanner,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['warning', 'blocked'] },
    onRequestIncrease: { action: 'requestIncrease' },
  },
};

export default meta;

type Story = StoryObj<typeof LimitWarningBanner>;

const baseLimit = {
  mitarbeiterId: 'u1',
  wochenstundenLimit: 48,
  aktuelleWochenstunden: 42,
  status: 'normal' as const,
  ueberschreitung: 0,
};

export const Warning: Story = {
  args: {
    limit: {
      ...baseLimit,
      aktuelleWochenstunden: 44,
      status: 'warning',
    },
    onRequestIncrease: () => {},
    variant: 'warning',
  },
};

export const Blocked: Story = {
  args: {
    limit: {
      ...baseLimit,
      aktuelleWochenstunden: 51,
      status: 'blocked',
      ueberschreitung: 3,
    },
    onRequestIncrease: () => {},
    variant: 'blocked',
  },
};
export const BlockedLongText: Story = {
  args: {
    limit: {
      ...baseLimit,
      wochenstundenLimit: 40,
      aktuelleWochenstunden: 45.5,
      status: 'blocked',
      ueberschreitung: 5.5,
    },
    onRequestIncrease: () => {},
    variant: 'blocked',
  },
};
