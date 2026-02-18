import type { Meta, StoryObj } from '@storybook/react';
import { AppLogo } from './AppLogo';

const meta: Meta<typeof AppLogo> = {
  title: 'UI/AppLogo',
  component: AppLogo,
  tags: ['autodocs'],
  argTypes: {
    showLogo: { control: 'boolean' },
    width: { control: { type: 'number', min: 32 } },
    height: { control: { type: 'number', min: 24 } },
  },
};

export default meta;

type Story = StoryObj<typeof AppLogo>;

export const Default: Story = {
  args: {
    showLogo: true,
    width: 96,
    height: 64,
  },
};

export const WithBranding: Story = {
  args: {
    branding: {
      companyName: 'Meine Firma GmbH',
      companyLogo: undefined,
    },
    showLogo: true,
    width: 120,
    height: 80,
  },
};

export const Small: Story = {
  args: {
    width: 48,
    height: 32,
  },
};

export const Hidden: Story = {
  args: {
    showLogo: false,
    width: 96,
    height: 64,
  },
};
