import type { Meta, StoryObj } from '@storybook/react';
import { SyncStatusIndicator } from './SyncStatusIndicator';

const meta: Meta<typeof SyncStatusIndicator> = {
  title: 'UI/SyncStatusIndicator',
  component: SyncStatusIndicator,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SyncStatusIndicator>;

export const Default: Story = {
  render: () => <SyncStatusIndicator />,
};
