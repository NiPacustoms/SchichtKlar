import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { SignatureDialog } from './SignatureDialog';

const meta: Meta<typeof SignatureDialog> = {
  title: 'UI/SignatureDialog',
  component: SignatureDialog,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    requireName: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof SignatureDialog>;

const Wrapper = (props: { requireName?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Unterschrift
      </Button>
      <SignatureDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={(dataUrl, name) => {
          console.log('Saved', dataUrl?.slice(0, 50), name);
          setOpen(false);
        }}
        requireName={props.requireName}
      />
    </>
  );
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const WithNameRequired: Story = {
  render: () => <Wrapper requireName />,
};

export const Open: Story = {
  args: {
    open: true,
    title: 'Unterschrift',
    requireName: false,
    onClose: () => {},
    onSave: () => {},
  },
};
