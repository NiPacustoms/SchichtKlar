'use client';

import {
  Table,
  TableContainer,
  Paper,
  type TableProps,
  type TableContainerProps,
} from '@mui/material';
import { radius } from '@/lib/design-tokens';

interface DataTableProps {
  /** Table-Content (TableHead + TableBody). Header-Zeile wird sticky + overflow-x auf Container. */
  children: React.ReactNode;
  /** Props für TableContainer (z. B. sx, component). */
  containerProps?: TableContainerProps;
  /** Props für Table. */
  tableProps?: TableProps;
}

const scrollbarSx = {
  '&::-webkit-scrollbar': { height: 8 },
  '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.05)' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4 },
} as const;

/**
 * DataTable – Elite Design System.
 * Sticky Header, horizontaler Scroll (overflow-x), einheitliche Scrollbar.
 * Für Virtualisierung bei >100 Zeilen separate Liste/Komponente nutzen.
 */
export function DataTable({
  children,
  containerProps = {},
  tableProps = {},
}: DataTableProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        overflowX: 'auto',
        borderRadius: radius.md,
        ...scrollbarSx,
        ...containerProps.sx,
      }}
      {...containerProps}
    >
      <Table stickyHeader size="medium" {...tableProps}>
        {children}
      </Table>
    </TableContainer>
  );
}

