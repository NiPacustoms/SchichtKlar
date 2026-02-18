import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { ComponentErrorBoundary } from './ComponentErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Beispiel-Fehler für Storybook');
  return <span>Alles in Ordnung</span>;
};

const meta: Meta<typeof ComponentErrorBoundary> = {
  title: 'Errors/ComponentErrorBoundary',
  component: ComponentErrorBoundary,
  tags: ['autodocs'],
  argTypes: {
    component: { control: 'text' },
    showDetails: { control: 'boolean' },
    maxRetries: { control: { type: 'number', min: 0 } },
  },
};

export default meta;

type Story = StoryObj<typeof ComponentErrorBoundary>;

export const Default: Story = {
  args: {
    component: 'ExampleWidget',
    children: <p>Kind-Inhalt ohne Fehler.</p>,
  },
};

export const WithError: Story = {
  render: function WithErrorStory() {
    const [throwErr, setThrowErr] = useState(false);
    return (
      <ComponentErrorBoundary component="Demo">
        <div>
          <Button variant="outlined" onClick={() => setThrowErr(true)} sx={{ mb: 2 }}>
            Fehler auslösen
          </Button>
          <ThrowError shouldThrow={throwErr} />
        </div>
      </ComponentErrorBoundary>
    );
  },
};

export const CustomFallback: Story = {
  args: {
    component: 'CustomWidget',
    fallback: (
      <div style={{ padding: 16, background: '#fff3e0', borderRadius: 8 }}>
        <strong>Custom Fallback:</strong> Diese Komponente konnte nicht geladen werden.
      </div>
    ),
    children: <ThrowError shouldThrow={true} />,
  },
};
