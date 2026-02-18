'use client';

import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid';
import DebouncedSearch from '@/components/ui/DebouncedSearch';
import { roleOptions, roleLabelMap, type RoleOption } from '@/lib/validations/staff';
import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '@/lib/services/categories';
// entfernt: doppelter Import von roleOptions/roleLabelMap

export type StaffFiltersChange = {
  searchTerm?: string;
  role?: RoleOption | 'all';
  status?: string | 'all';
  group?: string | 'all';
};

interface StaffFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  roleFilter?: string;
  onRoleFilterChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  groupFilter?: string;
  onGroupFilterChange?: (value: string) => void;
  availableGroups?: string[];
  onFiltersChange?: (filters: StaffFiltersChange) => void;
  totalCount?: number;
  filteredCount?: number;
}

export function StaffFilters({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  groupFilter,
  onGroupFilterChange,
  availableGroups,
}: StaffFiltersProps) {
  const { data: categories } = useQuery({
    queryKey: ['config', 'categories'],
    queryFn: () => categoriesService.get(),
    staleTime: 5 * 60 * 1000,
  });

  const roleOptionsFromConfig = categories?.roles || roleOptions;
  return (
    <Grid container spacing={2}>
      <Grid key="filter-search" size={{ xs: 12, sm: 6, md: 3 }}>
        <DebouncedSearch
          initialValue={searchTerm}
          onSearch={q => onSearchChange?.(q)}
          placeholder="Mitarbeiter suchen..."
          debounceMs={300}
        />
      </Grid>

      <Grid key="filter-role" size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Rolle</InputLabel>
          <Select
            value={roleFilter}
            onChange={e => onRoleFilterChange?.(e.target.value)}
            label="Rolle"
          >
            <MenuItem value="all">Alle Rollen</MenuItem>
            {roleOptionsFromConfig.map(r => (
              <MenuItem key={r} value={r}>
                {roleLabelMap[r as (typeof roleOptions)[number]] || String(r)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid key="filter-status" size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={e => onStatusFilterChange?.(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">Alle Status</MenuItem>
            <MenuItem value="active">Aktiv</MenuItem>
            <MenuItem value="inactive">Inaktiv</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid key="filter-group" size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Gruppe</InputLabel>
          <Select
            value={groupFilter}
            onChange={e => onGroupFilterChange?.(e.target.value)}
            label="Gruppe"
          >
            <MenuItem value="all">Alle Gruppen</MenuItem>
            {availableGroups?.map(group => (
              <MenuItem key={group} value={group}>
                {group}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}
