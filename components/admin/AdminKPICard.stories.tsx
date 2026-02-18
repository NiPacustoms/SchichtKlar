import type { Meta, StoryObj } from '@storybook/react';
import { Assessment, Warning, Error as ErrorIcon } from '@mui/icons-material';
import { AdminKPICard } from './AdminKPICard';

const meta: Meta<typeof AdminKPICard> = {
  title: 'Admin/AdminKPICard',
  component: AdminKPICard,
  tags: ['autodocs'],
  argTypes: {
    priority: { control: 'select', options: [1, 2, 3] },
  },
};

export default meta;

type Story = StoryObj<typeof AdminKPICard>;

const defaultArgs = {
  title: 'Offene Schichten',
  value: '12',
  icon: <Assessment />,
  color: '#005f73',
};

export const Priority1Critical: Story = {
  args: {
    ...defaultArgs,
    priority: 1,
    title: 'Kritische Unterbesetzung',
    value: '5',
    color: '#d32f2f',
    icon: <ErrorIcon />,
  },
};

export const Priority2Standard: Story = {
  args: {
    ...defaultArgs,
    priority: 2,
    title: 'Ausstehende Zeiteinträge',
    value: '8',
    trend: { value: 12, isPositive: false },
    color: '#ed6c02',
    icon: <Warning />,
  },
};

export const Priority3Decent: Story = {
  args: {
    ...defaultArgs,
    priority: 3,
    title: 'Mitarbeiter gesamt',
    value: '124',
    subtitle: 'aktiv',
    trend: { value: 5, isPositive: true },
    color: '#005f73',
    icon: <Assessment />,
  },
};

export const WithProgress: Story = {
  args: {
    ...defaultArgs,
    priority: 2,
    title: 'Zielerreichung',
    value: '78%',
    progress: 78,
    color: '#2e7d32',
    icon: <Assessment />,
  },
};
