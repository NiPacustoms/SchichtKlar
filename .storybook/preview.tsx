import React from 'react';
import { CssBaseline, ThemeProvider as MUIThemeProvider } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { createAppTheme } from '@/lib/theme';
import { StorybookProviders } from './StorybookProviders';
import '../app/globals.css';

const theme = createAppTheme('light');

export const decorators = [
  (Story: React.ComponentType) => (
    <StorybookProviders>
      <StyledEngineProvider injectFirst>
        <MUIThemeProvider theme={theme}>
          <CssBaseline />
          <Story />
        </MUIThemeProvider>
      </StyledEngineProvider>
    </StorybookProviders>
  ),
];

export const parameters = {
  layout: 'centered',
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
};
