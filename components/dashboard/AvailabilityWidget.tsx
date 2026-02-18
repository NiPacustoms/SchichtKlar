'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Box, Typography, Avatar, LinearProgress, IconButton, alpha } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

interface AvailableStaff {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: 'active' | 'available' | 'busy';
}

interface AvailabilityWidgetProps {
  staff?: AvailableStaff[];
  utilization?: number;
}

const defaultStaff: AvailableStaff[] = [
  {
    id: '1',
    name: 'Sarah Klein',
    initials: 'SK',
    role: 'Examen',
    status: 'active',
  },
  {
    id: '2',
    name: 'Max Mustermann',
    initials: 'MM',
    role: 'Pflegehelfer',
    status: 'available',
  },
  {
    id: '3',
    name: 'Anna Schmidt',
    initials: 'AS',
    role: 'Examen',
    status: 'active',
  },
];

export function AvailabilityWidget({
  staff = defaultStaff,
  utilization = 85,
}: AvailabilityWidgetProps) {
  return (
    <GlassCard
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 500,
        p: 0,
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: '18px',
            color: '#ffffff',
            mb: 0.5,
          }}
        >
          Verfügbare Top-Kräfte
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: alpha('#ffffff', 0.6),
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          Sofort einsetzbar für heute
        </Typography>
      </Box>

      {/* Staff List */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {staff.map(person => (
          <Box
            key={person.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha('#1e293b', 0.5),
              border: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: alpha('#1e293b', 0.8),
                borderColor: 'rgba(255,255,255,0.1)',
                transform: 'translateX(4px)',
              },
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
              }}
            >
              {person.initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#f1f5f9',
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {person.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: person.status === 'active' ? '#10b981' : '#f59e0b',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha('#ffffff', 0.6),
                    fontSize: '12px',
                  }}
                >
                  {person.status === 'active' ? 'Aktiv' : 'Verfügbar'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha('#ffffff', 0.4),
                    fontSize: '12px',
                    mx: 0.5,
                  }}
                >
                  •
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha('#ffffff', 0.6),
                    fontSize: '12px',
                  }}
                >
                  {person.role}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              sx={{
                color: alpha('#ffffff', 0.6),
                '&:hover': {
                  color: '#ffffff',
                  backgroundColor: alpha('#ffffff', 0.1),
                },
              }}
            >
              <ArrowForward sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* Utilization Footer */}
      <Box
        sx={{
          p: 2,
          backgroundColor: alpha('#1e293b', 0.3),
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: alpha('#ffffff', 0.6),
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Auslastung Pool
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {utilization}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={utilization}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha('#ffffff', 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              background: 'linear-gradient(90deg, #0d9488 0%, #10b981 100%)',
            },
          }}
        />
      </Box>
    </GlassCard>
  );
}
