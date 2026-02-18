import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@mui/material';
import { AssignmentStatusBadge } from './AssignmentStatusBadge';
import { assignmentStatusColors } from '@/lib/design-tokens';

const statuses = [
  'requested',
  'pending',
  'accepted',
  'assigned',
  'declined',
  'completed',
  'done',
  'cancelled',
  'pending-signature',
  'secured',
  'besichert',
] as const;

const meta: Meta<typeof AssignmentStatusBadge> = {
  title: 'Assignments/AssignmentStatusBadge',
  component: AssignmentStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: { control: 'select', options: [...statuses] },
    size: { control: 'select', options: ['small', 'medium'] },
  },
};

export default meta;

type Story = StoryObj<typeof AssignmentStatusBadge>;

export const Requested: Story = {
  args: { status: 'requested' },
};

export const Accepted: Story = {
  args: { status: 'accepted' },
};

export const Declined: Story = {
  args: { status: 'declined' },
};

export const StatusMatrix: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2 }}>
      {statuses.map(status => (
        <AssignmentStatusBadge key={status} status={status} />
      ))}
    </Box>
  ),
};

export const WithTokenColors: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2 }}>
      {(['requested', 'accepted', 'assigned', 'declined'] as const).map(status => (
        <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 1,
              backgroundColor: assignmentStatusColors[status] ?? '#999',
            }}
          />
          <AssignmentStatusBadge status={status} />
        </Box>
      ))}
    </Box>
  ),
};
