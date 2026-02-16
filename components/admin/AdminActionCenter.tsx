'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import type { DashboardActionItem } from '@/lib/admin/dashboardTypes';
import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

export interface AdminActionCenterProps {
  items: DashboardActionItem[];
  loading?: boolean;
  onItemClick?: (item: DashboardActionItem) => void;
}

export function AdminActionCenter({ items, loading, onItemClick }: AdminActionCenterProps) {
  const hasItems = items.length > 0;

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Aktionen
          </Typography>
          {hasItems && (
            <Chip
              label={`${items.length} offen`}
              color="warning"
              size="small"
              sx={{ fontWeight: 500 }}
            />
          )}
        </Stack>

        {loading && !hasItems ? (
          <Stack spacing={1.5}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} variant="rectangular" height={56} />
            ))}
          </Stack>
        ) : !hasItems ? (
          <Typography variant="body2" color="text.secondary">
            Aktuell sind keine dringenden Aktionen offen.
          </Typography>
        ) : (
          <List disablePadding>
            {items.map(item => (
              <ListItem
                key={item.id}
                disableGutters
                sx={{
                  py: 1,
                  px: 0,
                  '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {item.title}
                    </Typography>
                  }
                  secondary={
                    item.description && (
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    )
                  }
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={
                      item.severity === 'high'
                        ? 'Hoch'
                        : item.severity === 'medium'
                          ? 'Mittel'
                          : 'Niedrig'
                    }
                    color={
                      item.severity === 'high'
                        ? 'error'
                        : item.severity === 'medium'
                          ? 'warning'
                          : 'default'
                    }
                    variant={item.severity === 'low' ? 'outlined' : 'filled'}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onItemClick?.(item)}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Öffnen
                  </Button>
                </Stack>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </GlassCard>
  );
}
