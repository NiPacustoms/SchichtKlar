import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { ConfirmDestructiveDialog } from './ConfirmDestructiveDialog';

const meta: Meta<typeof ConfirmDestructiveDialog> = {
  title: 'UI/ConfirmDestructiveDialog',
  component: ConfirmDestructiveDialog,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
    confirmWord: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof ConfirmDestructiveDialog>;

const Wrapper = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button color="error" variant="contained" onClick={() => setOpen(true)}>
        Löschen
      </Button>
      <ConfirmDestructiveDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
        }}
        title="Einsatz endgültig löschen?"
        description="Dieser Einsatz und alle zugehörigen Daten werden unwiderruflich gelöscht."
        confirmWord="LÖSCHEN"
      />
    </>
  );
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Open: Story = {
  args: {
    open: true,
    title: 'Aktion bestätigen',
    description: 'Diese Aktion ist irreversibel. Bitte tippen Sie LÖSCHEN ein.',
    confirmWord: 'LÖSCHEN',
    confirmLabel: 'Bestätigen',
    cancelLabel: 'Abbrechen',
    onClose: () => {},
    onConfirm: () => {},
  },
};
