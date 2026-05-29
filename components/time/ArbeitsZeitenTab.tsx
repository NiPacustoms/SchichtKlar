'use client';

import {
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import { Work } from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface WorkEntry {
  date: Date;
  shiftType: string;
  facility: string;
  startTime: string;
  endTime: string;
  breaks: number;
  hours: number;
  status: string;
}

interface ArbeitsZeitenTabProps {
  entries: WorkEntry[];
  getStatusColor: (status: string) => ChipProps['color'];
}

export function ArbeitsZeitenTab({ entries, getStatusColor }: ArbeitsZeitenTabProps) {
  return (
    <Card className="glass">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Work sx={{ mr: 1 }} />
          Arbeitszeiten-Detail
        </Typography>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Datum</TableCell>
                <TableCell>Schicht</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>Ende</TableCell>
                <TableCell>Pausen</TableCell>
                <TableCell>Stunden</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {format(entry.date, 'dd.MM.yyyy', { locale: de })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entry.shiftType} - {entry.facility}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.startTime}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.endTime}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.breaks}min</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {entry.hours}h
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={entry.status} color={getStatusColor(entry.status)} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
