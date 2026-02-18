import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    variant: { control: 'select', options: ['spinner', 'skeleton', 'fullscreen', 'inline'] },
    color: { control: 'select', options: ['primary', 'inherit', 'secondary', 'error', 'info', 'success', 'warning'] },
  },
};

export default meta;

type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {
  args: {
    message: 'Wird geladen...',
    size: 'medium',
    variant: 'spinner',
    color: 'primary',
  },
};

export const Small: Story = {
  args: {
    message: 'Lade...',
    size: 'small',
    variant: 'spinner',
  },
};

export const Large: Story = {
  args: {
    message: 'Daten werden geladen...',
    size: 'large',
    variant: 'spinner',
  },
};

export const Skeleton: Story = {
  args: {
    variant: 'skeleton',
    message: 'Wird geladen...',
  },
};

export const Inline: Story = {
  args: {
    variant: 'inline',
    size: 'small',
  },
};

export const Fullscreen: Story = {
  args: {
    variant: 'fullscreen',
    message: 'JobFlow wird geladen...',
    showLogo: true,
  },
};
