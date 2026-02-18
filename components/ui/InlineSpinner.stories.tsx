import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@mui/material';
import { InlineSpinner } from './LoadingSpinner';

const meta: Meta<typeof InlineSpinner> = {
  title: 'UI/InlineSpinner',
  component: InlineSpinner,
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'number', min: 16, max: 32 } },
    color: { control: 'select', options: ['primary', 'inherit', 'secondary', 'error', 'info', 'success', 'warning'] },
  },
};

export default meta;

type Story = StoryObj<typeof InlineSpinner>;

export const Default: Story = {
  args: { size: 20, color: 'inherit' },
};

export const InButton: Story = {
  render: () => (
    <Button variant="contained" startIcon={<InlineSpinner size={20} color="inherit" />}>
      Wird geladen...
    </Button>
  ),
};
