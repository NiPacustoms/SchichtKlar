import type { Meta, StoryObj } from '@storybook/react';
import { WeeklyLimitSetter } from './WeeklyLimitSetter';
import { StorybookProviders } from '../../.storybook/mockProviders';

const meta: Meta<typeof WeeklyLimitSetter> = {
  title: 'Admin/WeeklyLimitSetter',
  component: WeeklyLimitSetter,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <StorybookProviders>
        <Story />
      </StorybookProviders>
    ),
  ],
  argTypes: {
    employee: { control: 'object' },
    compact: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof WeeklyLimitSetter>;

export const Default: Story = {
  args: {
    employee: {
      id: 'story-user-1',
      displayName: 'Max Mustermann',
      wochenstundenLimit: 48,
      aktuelleWochenstunden: 42,
      limitStatus: 'normal',
    },
  },
};

export const Warning: Story = {
  args: {
    employee: {
      id: 'story-user-2',
      displayName: 'Anna Beispiel',
      wochenstundenLimit: 40,
      aktuelleWochenstunden: 37,
      limitStatus: 'warning',
    },
  },
};

export const Blocked: Story = {
  args: {
    employee: {
      id: 'story-user-3',
      displayName: 'Lisa Überlimit',
      wochenstundenLimit: 48,
      aktuelleWochenstunden: 52,
      limitStatus: 'blocked',
    },
  },
};

export const Compact: Story = {
  args: {
    ...Default.args,
    compact: true,
  },
};
