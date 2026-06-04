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
import { Sick } from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SickEntry {
  startDate: Date;
  endDate: Date;
  days: number;
  status: string;
  doctor: string;
  remark: string;
}

interface KrankheitTabProps {
  entries: SickEntry[];
}

export function KrankheitTab({ entries }: KrankheitTabProps) {
  return (
    <Card className="glass">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Sick sx={{ mr: 1 }} />
          Krankheitstage-Übersicht
        </Typography>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Zeitraum</TableCell>
                <TableCell>Tage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Arzt</TableCell>
                <TableCell>Bemerkung</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {format(entry.startDate, 'dd.MM.yyyy', { locale: de })} -{' '}
                      {format(entry.endDate, 'dd.MM.yyyy', { locale: de })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {entry.days}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.status}
                      color={
                        entry.status === 'approved'
                          ? 'success'
                          : entry.status === 'pending'
                            ? 'warning'
                            : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.doctor}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {entry.remark}
                    </Typography>
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
