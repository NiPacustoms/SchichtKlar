'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Chip,
  Tabs,
  Tab,
  IconButton,
  alpha,
} from '@mui/material';
import {
  Phone,
  ArrowForward,
  Warning,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useState } from 'react';

interface Issue {
  id: number;
  type: string;
  time: string;
  station: string;
  role: string;
  status: 'critical' | 'warning' | 'info';
}

interface ActionCenterProps {
  issues?: Issue[];
}

const defaultIssues: Issue[] = [
  {
    id: 1,
    type: 'Lücke',
    time: '07:00 – 15:00',
    station: 'Station 2B (Kardio)',
    role: 'Examen',
    status: 'critical',
  },
  {
    id: 2,
    type: 'Krank',
    time: '14:00 – 22:00',
    station: 'Wohnbereich 4',
    role: 'Pflegehelfer',
    status: 'warning',
  },
  {
    id: 3,
    type: 'Doku',
    time: 'Morgen',
    station: 'M. Müller',
    role: 'Fehlendes Führungszeugnis',
    status: 'info',
  },
];

export function ActionCenter({ issues = defaultIssues }: ActionCenterProps) {
  const [activeTab, setActiveTab] = useState(0);
  const criticalCount = issues.filter(i => i.status === 'critical').length;

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'critical':
        return { color: '#e11d48', bg: alpha('#e11d48', 0.1) };
      case 'warning':
        return { color: '#f59e0b', bg: alpha('#f59e0b', 0.1) };
      case 'info':
        return { color: '#3b82f6', bg: alpha('#3b82f6', 0.1) };
      default:
        return { color: '#475569', bg: alpha('#475569', 0.1) };
    }
  };

  const getStatusIcon = (status: Issue['status']) => {
    switch (status) {
      case 'critical':
        return <ErrorIcon sx={{ fontSize: 16 }} />;
      case 'warning':
        return <Warning sx={{ fontSize: 16 }} />;
      case 'info':
        return <InfoIcon sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  return (
    <GlassCard
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 500,
        p: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header mit Tabs */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: alpha('#f8fafc', 0.5),
          backdropFilter: 'blur(10px)',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px' }}>
            ⚡ Action Center
          </Typography>
          {criticalCount > 0 && (
            <Chip
              label={`${criticalCount} Kritisch`}
              size="small"
              sx={{
                backgroundColor: alpha('#e11d48', 0.15),
                color: '#e11d48',
                fontWeight: 700,
                fontSize: '11px',
                height: 24,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                },
              }}
            />
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            backgroundColor: alpha('#e2e8f0', 0.5),
            p: 0.5,
            borderRadius: 2,
          }}
        >
          {['Alle', 'Schichten', 'Personal'].map((tab, i) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(i)}
              size="small"
              sx={{
                px: 2,
                py: 0.75,
                minWidth: 'auto',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: 1.5,
                backgroundColor: activeTab === i ? '#ffffff' : 'transparent',
                color: activeTab === i ? 'text.primary' : 'text.secondary',
                boxShadow: activeTab === i ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                '&:hover': {
                  backgroundColor: activeTab === i ? '#ffffff' : alpha('#ffffff', 0.5),
                },
              }}
            >
              {tab}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Action List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: alpha('#f8fafc', 0.5),
                '& th': {
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
              }}
            >
              <TableCell sx={{ borderRadius: '8px 0 0 0' }}>Dringlichkeit / Zeit</TableCell>
              <TableCell>Ort / Kontext</TableCell>
              <TableCell>Problem</TableCell>
              <TableCell align="right" sx={{ borderRadius: '0 8px 0 0' }}>
                Sofort-Maßnahme
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {issues.map(issue => {
              const statusStyle = getStatusColor(issue.status);
              return (
                <TableRow
                  key={issue.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha('#f8fafc', 0.5),
                    },
                    transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 40,
                          borderRadius: '3px',
                          backgroundColor: statusStyle.color,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: statusStyle.color,
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          {issue.type}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '14px' }}>
                          {issue.time}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '14px' }}>
                      {issue.station}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(issue.status)}
                      label={issue.role}
                      size="small"
                      sx={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${alpha(statusStyle.color, 0.2)}`,
                        fontSize: '12px',
                        fontWeight: 500,
                        height: 24,
                        '& .MuiChip-icon': {
                          color: statusStyle.color,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                        opacity: { xs: 1, lg: 0 },
                        transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          opacity: 1,
                        },
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{
                          border: '1.5px solid',
                          borderColor: 'divider',
                          color: 'text.secondary',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: alpha('#005f73', 0.06),
                            color: 'primary.main',
                          },
                        }}
                        title="Anrufen"
                      >
                        <Phone sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Button
                        variant="contained"
                        size="small"
                        endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          py: 0.75,
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        Besetzen
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Button
          variant="text"
          endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            '&:hover': {
              textDecoration: 'underline',
              backgroundColor: 'transparent',
            },
          }}
        >
          Alle 12 Probleme anzeigen
        </Button>
      </Box>
    </GlassCard>
  );
}
