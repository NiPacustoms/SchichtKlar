import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { Dialog } from './Dialog';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Dialog>;

const DialogWithButton = (props: { open?: boolean; title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(!!props.open);
  return (
    <>
      <Button onClick={() => setOpen(true)} variant="contained">
        Dialog öffnen
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={props.title}
      >
        {props.children}
      </Dialog>
    </>
  );
};

export const Default: Story = {
  render: () => (
    <DialogWithButton title="Dialog Titel">
      <p>Inhalt des Dialogs. Hier können beliebige Inhalte stehen.</p>
    </DialogWithButton>
  ),
};

export const Open: Story = {
  args: {
    open: true,
    title: 'Bestätigung',
    onClose: () => {},
    children: (
      <p>
        Möchten Sie fortfahren? Diese Aktion kann rückgängig gemacht werden.
      </p>
    ),
  },
};

export const WithIsOpen: Story = {
  args: {
    isOpen: true,
    open: true,
    title: 'Legacy isOpen',
    onClose: () => {},
    children: <p>Dialog unterstützt auch das Alias <code>isOpen</code>.</p>,
  },
};
