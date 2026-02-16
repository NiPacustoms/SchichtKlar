'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  value?: number;
  hours?: number;
  target?: number;
  color?: string;
}

interface StatisticsTabsProps {
  weeklyHours?: ChartDataPoint[];
  monthlyHours?: ChartDataPoint[];
  shiftCompletion?: ChartDataPoint[];
  staffActivity?: ChartDataPoint[];
  staff?: unknown[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = React.memo((props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
});

TabPanel.displayName = 'TabPanel';

export const StatisticsTabs = React.memo(
  ({
    weeklyHours = [],
    monthlyHours = [],
    shiftCompletion = [],
    staffActivity = [],
    staff = [],
  }: StatisticsTabsProps) => {
    const [activeTab, setActiveTab] = useState(0);
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
    const [_chartDimensions, setChartDimensions] = useState({ width: 300, height: 200 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
      setIsHydrated(true);
    }, []);

    useEffect(() => {
      const updateDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setChartDimensions({
            width: Math.max(rect.width, 300),
            height: Math.max(rect.height, 200),
          });
        }
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Verwende ausschließlich echte Props; keine Demo-/Fallback-Daten
    const weeklyData = Array.isArray(weeklyHours) ? weeklyHours : [];
    const monthlyData = Array.isArray(monthlyHours) ? monthlyHours : [];
    const shiftData = Array.isArray(shiftCompletion) ? shiftCompletion : [];
    const safeActivityData = Array.isArray(staffActivity) ? staffActivity : [];

    const currentData = timeRange === 'week' ? weeklyData : monthlyData;
    // #region agent log
    const shiftKeys = shiftData.map(item => item?.name);
    const activityKeys = safeActivityData.map(item => item?.name);
    fetch('http://127.0.0.1:7243/ingest/772533d7-e058-439e-a00a-1be099111014', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'StatisticsTabs.tsx',
        message: 'StatisticsTabs list keys',
        data: {
          shiftDataLen: shiftData.length,
          safeActivityDataLen: safeActivityData.length,
          shiftKeys,
          activityKeys,
          hasUndefinedShiftKey: shiftKeys.some(k => k == null),
          hasUndefinedActivityKey: activityKeys.some(k => k == null),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        hypothesisId: 'H1',
      }),
    }).catch(() => {});
    // #endregion
    const averageHours =
      currentData.length > 0
        ? currentData.reduce((sum, item) => sum + (item.hours || 0), 0) / currentData.length
        : 0;
    const targetHours =
      currentData.length > 0
        ? currentData.reduce((sum, item) => sum + (item.target || 0), 0) / currentData.length
        : 0;
    const efficiency = targetHours > 0 ? (averageHours / targetHours) * 100 : 0;

    interface TooltipPayload {
      value: number;
      dataKey?: string;
    }

    const CustomTooltip = ({
      active,
      payload,
      label,
    }: {
      active?: boolean;
      payload?: TooltipPayload[];
      label?: string;
    }) => {
      if (active && payload && payload.length) {
        const firstPayload = payload[0];
        const secondPayload = payload[1];
        return (
          <Box
            sx={{
              backgroundColor: 'background.paper',
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              boxShadow: 2,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {label}
            </Typography>
            <Typography variant="body2" color="primary">
              Stunden: {firstPayload?.value || 0}h
            </Typography>
            {secondPayload && (
              <Typography variant="body2" color="text.secondary">
                Ziel: {secondPayload.value || 0}h
              </Typography>
            )}
          </Box>
        );
      }
      return null;
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
    };

    if (!isHydrated) {
      return (
        <GlassCard>
          <Box
            sx={{
              p: 3,
              minHeight: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Statistiken werden geladen…
            </Typography>
          </Box>
        </GlassCard>
      );
    }

    return (
      <GlassCard>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="Statistik Tabs"
            variant="fullWidth"
          >
            <Tab
              key="stats-trends"
              icon={<TrendingUpIcon />}
              label="Statistiken & Trends"
              iconPosition="start"
            />
            <Tab
              key="staff-stats"
              icon={<PeopleIcon />}
              label="Mitarbeiter-Statistiken"
              iconPosition="start"
            />
            <Tab
              key="shift-coverage"
              icon={<AssignmentIcon />}
              label="Schichtbesetzung"
              iconPosition="start"
            />
            <Tab
              key="personal-status"
              icon={<ScheduleIcon />}
              label="Personal-Status"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab 1: Statistiken & Trends */}
        <TabPanel key="tabpanel-0" value={activeTab} index={0}>
          <Box
            key="tab1-header"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 3,
            }}
          >
            <Typography key="tab1-title" variant="h6" sx={{ fontWeight: 600 }}>
              Statistiken & Entwicklung
            </Typography>
            <FormControl
              key="tab1-timeRange"
              size="small"
              sx={{ minWidth: { sm: 120 }, width: { xs: '100%', sm: 'auto' } }}
            >
              <InputLabel>Zeitraum</InputLabel>
              <Select
                value={timeRange}
                label="Zeitraum"
                onChange={e => setTimeRange(e.target.value as 'week' | 'month')}
              >
                <MenuItem key="week" value="week">
                  Diese Woche
                </MenuItem>
                <MenuItem key="month" value="month">
                  Dieser Monat
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Grid container spacing={3}>
            {/* Hours Chart */}
            <Grid key="tab1-chart" size={{ xs: 12, md: 8 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Arbeitsstunden
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main">
                      Ø {averageHours.toFixed(1)}h/Tag
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Effizienz: {efficiency.toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box ref={containerRef} sx={{ height: 300, minHeight: 300, width: '100%' }}>
                {currentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar key="bar-hours" dataKey="hours" fill="#2196f3" name="Gearbeitet" />
                      <Bar key="bar-target" dataKey="target" fill="#e0e0e0" name="Ziel" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="body2">Keine Daten vorhanden</Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Summary Stats */}
            <Grid key="tab1-summary" size={{ xs: 12, md: 4 }}>
              <Paper
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(0, 95, 115, 0.04)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%',
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, fontSize: '16px' }}>
                  Zusammenfassung
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box
                    key="summary-gesamtstunden"
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 800, mb: 0.5 }}>
                      {currentData.reduce((sum, item) => sum + (item.hours || 0), 0).toFixed(0)}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                      Gesamtstunden
                    </Typography>
                  </Box>
                  <Box
                    key="summary-besetzung"
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="h3" color="success.main" sx={{ fontWeight: 800, mb: 0.5 }}>
                      {shiftData.find(s => s.name === 'Besetzt')?.value || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                      Besetzungsrate
                    </Typography>
                  </Box>
                  <Box
                    key="summary-aktiv"
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="h3" color="info.main" sx={{ fontWeight: 800, mb: 0.5 }}>
                      {safeActivityData.reduce(
                        (sum: number, item: ChartDataPoint) => sum + (item.value || 0),
                        0
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                      Aktive Mitarbeiter
                    </Typography>
                  </Box>
                  <Box
                    key="summary-effizienz"
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="h3" color="warning.main" sx={{ fontWeight: 800, mb: 0.5 }}>
                      {efficiency.toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                      Effizienz
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Mitarbeiter-Statistiken */}
        <TabPanel key="tabpanel-1" value={activeTab} index={1}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Mitarbeiter-Statistiken
          </Typography>
          <Grid container spacing={3}>
            <Grid key="tab2-staff-total" size={{ xs: 12, md: 6 }}>
              <GlassCard sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h2" color="primary.main" sx={{ fontWeight: 800, mb: 1 }}>
                  {Array.isArray(staff) ? staff.length : 0}
                </Typography>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Aktive Mitarbeiter
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                  Gesamt im System
                </Typography>
              </GlassCard>
            </Grid>
            <Grid key="tab2-staff-onduty" size={{ xs: 12, md: 6 }}>
              <GlassCard sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h2" color="success.main" sx={{ fontWeight: 800, mb: 1 }}>
                  {safeActivityData.find((a: ChartDataPoint) => a.name === 'Im Dienst')?.value || 0}
                </Typography>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Im Dienst
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                  Aktuell beschäftigt
                </Typography>
              </GlassCard>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Schichtbesetzung */}
        <TabPanel key="tabpanel-2" value={activeTab} index={2}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Schichtbesetzung
          </Typography>
          <Grid container spacing={3}>
            <Grid key="tab3-pie" size={{ xs: 12, md: 6 }}>
              <Box sx={{ height: 300, minHeight: 300, width: '100%' }}>
                {shiftData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={shiftData as unknown as any[]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                      >
                        {shiftData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="body2">Keine Daten vorhanden</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid key="tab3-legend" size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {shiftData.map(item => (
                  <Box
                    key={item.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: item.color || '#8884d8',
                        borderRadius: '50%',
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                        {item.value}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Personal-Status */}
        <TabPanel key="tabpanel-3" value={activeTab} index={3}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Personal-Status
          </Typography>
          <Grid container spacing={3}>
            <Grid key="tab4-chart" size={{ xs: 12, md: 8 }}>
              <Box sx={{ height: 300, minHeight: 300, width: '100%' }}>
                {safeActivityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={safeActivityData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar key="bar-value" dataKey="value" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="body2">Keine Daten vorhanden</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid key="tab4-legend" size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {safeActivityData.map(item => (
                  <Box
                    key={item.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: item.color || '#8884d8',
                        borderRadius: '50%',
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </GlassCard>
    );
  }
);

StatisticsTabs.displayName = 'StatisticsTabs';
