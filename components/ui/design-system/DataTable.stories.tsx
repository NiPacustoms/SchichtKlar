import type { Meta, StoryObj } from '@storybook/react';
import {
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Table,
} from '@mui/material';
import { DataTable } from './DataTable';

const meta: Meta<typeof DataTable> = {
  title: 'UI/Design System/DataTable',
  component: DataTable,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof DataTable>;

const sampleRows = [
  { id: '1', name: 'Anna Schmidt', rolle: 'Pflegefachkraft', einrichtung: 'Haus A' },
  { id: '2', name: 'Max Müller', rolle: 'Pflegefachkraft', einrichtung: 'Haus B' },
  { id: '3', name: 'Lisa Weber', rolle: 'Pflegehilfe', einrichtung: 'Haus A' },
];

export const Default: Story = {
  render: () => (
    <DataTable>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Rolle</TableCell>
          <TableCell>Einrichtung</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sampleRows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.rolle}</TableCell>
            <TableCell>{row.einrichtung}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  ),
};

export const Empty: Story = {
  render: () => (
    <DataTable>
      <TableHead>
        <TableRow>
          <TableCell>Spalte 1</TableCell>
          <TableCell>Spalte 2</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell colSpan={2} align="center">
            Keine Einträge
          </TableCell>
        </TableRow>
      </TableBody>
    </DataTable>
  ),
};
