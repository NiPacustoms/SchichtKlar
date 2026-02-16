'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { User } from '@/lib/types';
import { Box, Grid, Typography } from '@mui/material';

interface ProfileStatsProps {
  user: User;
  stats: {
    totalDocuments: number;
    validDocuments: number;
    expiringDocuments: number;
    expiredDocuments: number;
    qualifications: number;
  };
}

export function ProfileStats({ user, stats }: ProfileStatsProps) {
  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return '#4CAF50';
      case 'expiring':
        return '#FF9800';
      case 'expired':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const formatDate = (date: Date) => {
    try {
      return new Intl.DateTimeFormat('de-DE', {
        timeZone: 'Europe/Berlin',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return new Intl.DateTimeFormat('de-DE').format(date);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Übersicht
      </Typography>

      <Grid container spacing={3}>
        {/* User Info */}
        <Grid size={12}>
          <GlassCard>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    mr: 2,
                  }}
                >
                  {user.displayName?.charAt(0) || 'U'}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {user.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rolle:{' '}
                    {user.role === 'nurse'
                      ? 'Pflegekraft'
                      : user.role === 'admin'
                        ? 'Administrator'
                        : 'Disponent'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Mitglied seit
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(user.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Letzte Aktualisierung
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(user.updatedAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </GlassCard>
        </Grid>

        {/* Documents Stats */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <GlassCard>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 700, mb: 1 }}>
                {stats.validDocuments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gültige Nachweise
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <GlassCard>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 700, mb: 1 }}>
                {stats.expiringDocuments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Läuft ab
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <GlassCard>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#F44336', fontWeight: 700, mb: 1 }}>
                {stats.expiredDocuments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Abgelaufen
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        {/* Qualifications */}
        <Grid size={12}>
          <GlassCard>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Qualifikationen ({stats.qualifications})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {user.qualifications?.map(qualification => (
                  <Box
                    key={qualification}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      backgroundColor: 'primary.main',
                      color: 'white',
                      fontSize: '0.875rem',
                    }}
                  >
                    {qualification}
                  </Box>
                )) || (
                  <Typography variant="body2" color="text.secondary">
                    Keine Qualifikationen hinzugefügt
                  </Typography>
                )}
              </Box>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}
