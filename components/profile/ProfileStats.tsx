'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { User } from '@/lib/types';
import { usePermissions } from '@/contexts/PermissionsContext';
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
  const { canAccessAdminArea } = usePermissions();
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
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
        Übersicht
      </Typography>

      <Grid container spacing={3}>
        {/* Benutzerkarte: Avatar links, Name/E-Mail/Rolle rechts, darunter Mitglied seit / Letzte Aktualisierung */}
        <Grid size={12}>
          <GlassCard hover={false}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    minWidth: 80,
                    borderRadius: '50%',
                    backgroundColor: '#1B5E20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: 600,
                  }}
                  aria-hidden
                >
                  {user.displayName?.charAt(0) || 'U'}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                    {user.displayName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.25 }}>
                    {user.email}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Rolle:{' '}
                    {canAccessAdminArea ? 'Administrator' : 'Pflegekraft'}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                  mt: 2,
                  pt: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Mitglied seit {formatDate(user.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Letzte Aktualisierung {formatDate(user.updatedAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </GlassCard>
        </Grid>

        {/* Metrik-Karten: Gültige Nachweise, Läuft ab, Abgelaufen */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <GlassCard hover={false}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#E65100', fontWeight: 700, mb: 1 }}>
                {stats.validDocuments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gültige Nachweise
              </Typography>
            </Box>
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <GlassCard hover={false}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#E65100', fontWeight: 700, mb: 1 }}>
                {stats.expiringDocuments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Läuft ab
              </Typography>
            </Box>
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <GlassCard hover={false}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#C62828', fontWeight: 700, mb: 1 }}>
                {stats.expiredDocuments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Abgelaufen
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        {/* Qualifikationen */}
        <Grid size={12}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
            Qualifikationen ({stats.qualifications})
          </Typography>
          <Box
            sx={{
              minHeight: 80,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              p: 2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'flex-start',
              alignContent: 'flex-start',
            }}
          >
            {user.qualifications?.length
              ? user.qualifications.map(qualification => (
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
                ))
              : null}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
