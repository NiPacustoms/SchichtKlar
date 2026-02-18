'use client';
import { Stack, TextField, MenuItem } from '@mui/material';
export type ReportType = 'time' | 'surcharge' | 'employee' | 'all';
export default function DateRangeFilter({
  startDate,
  endDate,
  reportType,
  facilityId,
  onChange,
}: {
  startDate?: string;
  endDate?: string;
  reportType: ReportType;
  facilityId?: string;
  onChange: (
    patch: Partial<{
      startDate: string;
      endDate: string;
      reportType: ReportType;
      facilityId?: string;
    }>
  ) => void;
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2 }}>
      <TextField
        label="Von"
        type="date"
        value={startDate ?? ''}
        onChange={e => onChange({ startDate: e.target.value })}
        InputLabelProps={{ shrink: true }}
        size="small"
      />
      <TextField
        label="Bis"
        type="date"
        value={endDate ?? ''}
        onChange={e => onChange({ endDate: e.target.value })}
        InputLabelProps={{ shrink: true }}
        size="small"
      />
      <TextField
        label="Berichtstyp"
        select
        value={reportType}
        onChange={e => onChange({ reportType: e.target.value as ReportType })}
        size="small"
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="time">Arbeitszeiten</MenuItem>
        <MenuItem value="surcharge">Zuschläge</MenuItem>
        <MenuItem value="employee">Mitarbeiter</MenuItem>
        <MenuItem value="all">Alle</MenuItem>
      </TextField>
      <TextField
        label="Einrichtung"
        placeholder="(optional)"
        value={facilityId ?? ''}
        onChange={e => onChange({ facilityId: e.target.value })}
        size="small"
      />
    </Stack>
  );
}
