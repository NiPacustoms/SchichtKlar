'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { User } from '@/lib/types';
import { alpha, Avatar, Box, Chip, Typography } from '@mui/material';

interface TopPerformersProps {
  performers: Array<{
    user: User;
    hours: number;
  }>;
}

export function TopPerformers({ performers }: TopPerformersProps) {
  if (performers.length === 0) {
    return (
      <GlassCard>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Keine Daten verfügbar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keine Zeiterfassungen für diese Woche
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Top Performer (diese Woche)
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {performers.map((performer, index) => (
            <Box
              key={performer.user.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                backgroundColor: index === 0 ? 'rgba(0, 95, 115, 0.06)' : 'transparent',
                transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor:
                    index === 0 ? 'rgba(0, 95, 115, 0.08)' : 'rgba(0, 95, 115, 0.04)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: index === 0 ? 'primary.main' : 'text.primary',
                      minWidth: 24,
                    }}
                  >
                    #{index + 1}
                  </Typography>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: theme =>
                        alpha(
                          index === 0 ? theme.palette.primary.main : theme.palette.grey[500],
                          theme.palette.mode === 'dark' ? 0.24 : 0.12
                        ),
                      color: theme =>
                        index === 0
                          ? theme.palette.mode === 'dark'
                            ? theme.palette.primary.light
                            : theme.palette.primary.main
                          : 'text.secondary',
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {performer.user.displayName?.charAt(0) || 'U'}
                  </Avatar>
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {performer.user.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {performer.user.role === 'nurse' ? 'Pflegekraft' : performer.user.role}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {performer.hours}h
                </Typography>
                {index === 0 && (
                  <Chip
                    label="Bester"
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </GlassCard>
  );
}
