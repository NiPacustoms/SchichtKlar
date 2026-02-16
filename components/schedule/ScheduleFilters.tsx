'use client';

import { Facility } from '@/lib/types';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { de } from 'date-fns/locale';

interface ScheduleFiltersProps {
  facilities: Facility[];
  selectedFacility?: string;
  selectedDate?: Date;
  onFacilityChange: (facilityId: string) => void;
  onDateChange: (date: Date) => void;
}

export function ScheduleFilters({
  facilities,
  selectedFacility,
  selectedDate,
  onFacilityChange,
  onDateChange,
}: ScheduleFiltersProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Einrichtung</InputLabel>
          <Select
            value={selectedFacility || ''}
            label="Einrichtung"
            onChange={e => onFacilityChange(e.target.value)}
          >
            <MenuItem value="">Alle Einrichtungen</MenuItem>
            {facilities.map(facility => (
              <MenuItem key={facility.id} value={facility.id}>
                {facility.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label="Datum"
          value={selectedDate || new Date()}
          onChange={date => date && onDateChange(date)}
          slotProps={{
            textField: {
              sx: { minWidth: 200 },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
