import type { Meta, StoryObj } from '@storybook/react';
import { Assignment, Schedule } from '@mui/icons-material';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
};

export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'Keine Einsätze',
    description: 'Aktuell sind keine Einsätze für Sie geplant.',
  },
};

export const WithAction: Story = {
  args: {
    title: 'Keine Einsätze',
    description: 'Aktuell sind keine Einsätze für Sie geplant.',
    action: {
      label: 'Einsätze anzeigen',
      onClick: () => {},
    },
  },
};

export const WithIcon: Story = {
  args: {
    icon: <Assignment />,
    title: 'Keine Einsätze',
    description: 'Aktuell sind keine Einsätze für Sie geplant.',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    icon: <Schedule />,
    title: 'Keine Daten',
    description: 'Noch keine Einträge vorhanden.',
  },
};
