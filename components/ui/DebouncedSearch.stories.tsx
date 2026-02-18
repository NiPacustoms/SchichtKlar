import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DebouncedSearch } from './DebouncedSearch';

const meta: Meta<typeof DebouncedSearch> = {
  title: 'UI/DebouncedSearch',
  component: DebouncedSearch,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    debounceMs: { control: { type: 'number', min: 0 } },
    size: { control: 'select', options: ['small', 'medium'] },
    variant: { control: 'select', options: ['outlined', 'filled', 'standard'] },
  },
};

export default meta;

type Story = StoryObj<typeof DebouncedSearch>;

export const Default: Story = {
  args: {
    placeholder: 'Suchen...',
    debounceMs: 300,
    onSearch: (q) => console.log('Search:', q),
  },
};

export const WithInitialValue: Story = {
  args: {
    placeholder: 'Mitarbeiter suchen',
    initialValue: 'Max',
    onSearch: (q) => console.log('Search:', q),
  },
};

export const Small: Story = {
  args: {
    placeholder: 'Kurz suchen',
    size: 'small',
    onSearch: (q) => console.log('Search:', q),
  },
};

function LiveSearchDemo() {
  const [lastQuery, setLastQuery] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DebouncedSearch
        placeholder="Tippen Sie hier..."
        debounceMs={400}
        onSearch={setLastQuery}
      />
      {lastQuery && <p>Letzte Suche: &quot;{lastQuery}&quot;</p>}
    </div>
  );
}

export const LiveDemo: Story = {
  render: () => <LiveSearchDemo />,
};
