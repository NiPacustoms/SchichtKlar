import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack, Typography } from '@mui/material';
import { AssignmentStatusBadge } from '@/components/assignments/AssignmentStatusBadge';

const meta: Meta<typeof AssignmentStatusBadge> = {
  title: 'Design System/StatusBadge',
  component: AssignmentStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: [
        'requested',
        'accepted',
        'assigned',
        'declined',
        'completed',
        'pending',
        'secured',
        'cancelled',
        'pending-signature',
      ],
    },
    size: { control: 'radio', options: ['small', 'medium'] },
  },
};

export default meta;

type Story = StoryObj<typeof AssignmentStatusBadge>;

export const Default: Story = {
  args: { status: 'accepted', size: 'small' },
};

export const AllStatuses: Story = {
  render: () => (
    <Stack spacing={2}>
      <Typography variant="overline">Assignment-Status-Matrix</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {['requested', 'accepted', 'assigned', 'declined', 'completed', 'pending', 'secured', 'cancelled', 'pending-signature'].map(
          status => (
            <AssignmentStatusBadge key={status} status={status} size="small" />
          )
        )}
      </Box>
    </Stack>
  ),
};

export const Requested: Story = { args: { status: 'requested' } };
export const Besetzt: Story = { args: { status: 'secured' } };
export const Medium: Story = { args: { status: 'accepted', size: 'medium' } };
