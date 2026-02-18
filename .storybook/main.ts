import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: '@storybook/nextjs',
  staticDirs: ['../public'],
};

export default config;
