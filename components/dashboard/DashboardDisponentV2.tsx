'use client';

import { StatCard } from './StatCard';
import { ActionCenter } from './ActionCenter';
import { AvailabilityWidget } from './AvailabilityWidget';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid2 as Grid,
} from '@mui/material';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  People,
  Calendar,
  Search,
} from '@mui/icons-material';

export function DashboardDisponentV2() {
  return (
    <Box
      sx={{
        // min-height via .min-height-viewport (100dvh/100vh) wenn nötig
        p: { xs: 2, sm: 3, lg: 4 },
        fontFamily: 'inherit',
      }}
    >
      {/* Header Area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 3,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '24px', sm: '28px' },
              mb: 0.5,
            }}
          >
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
            Letztes Update: Heute, 08:42 Uhr
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <TextField
            placeholder="Schnellsuche..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', md: 280 },
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
              },
            }}
          />
          <Button
            variant="contained"
            sx={{
              whiteSpace: 'nowrap',
              minWidth: { xs: 'auto', sm: 140 },
            }}
          >
            + Neue Anfrage
          </Button>
        </Box>
      </Box>

      {/* Grid Layout (Bento Style) */}
      <Grid container spacing={3}>
        {/* Row 1: High Level KPIs (Clickable Filters) */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Offene Schichten"
            value="12"
            icon={<AlertTriangle sx={{ fontSize: 20 }} />}
            colorTheme="rose"
            trend="+2 seit gestern"
            active={true}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Aktive Einsätze"
            value="48"
            icon={<Clock sx={{ fontSize: 20 }} />}
            colorTheme="teal"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Check-in ausstehend"
            value="5"
            icon={<People sx={{ fontSize: 20 }} />}
            colorTheme="amber"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Umsatz Forecast"
            value="€12k"
            icon={<Calendar sx={{ fontSize: 20 }} />}
            colorTheme="slate"
            trend="KW 02"
          />
        </Grid>

        {/* Row 2: Main Workbench (Action Center + Availability) */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <ActionCenter />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <AvailabilityWidget />
        </Grid>
      </Grid>
    </Box>
  );
}

