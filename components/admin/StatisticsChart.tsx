'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { GlassCard } from '@/components/ui/GlassCard';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';
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
  TooltipProps,
} from 'recharts';
import { useState, useEffect, useRef } from 'react';

interface ChartDataPoint {
  name: string;
  hours?: number;
  target?: number;
  value?: number;
  color?: string;
}

interface StatisticsChartProps {
  weeklyHours?: number[];
  monthlyHours?: number[];
  shiftCompletion?: ChartDataPoint[];
  staffActivity?: ChartDataPoint[];
}

export function StatisticsChart({
  weeklyHours,
  monthlyHours,
  shiftCompletion,
  staffActivity,
}: StatisticsChartProps) {
  // Ensure minimum dimensions for charts
  const chartMinWidth = 300;
  const chartMinHeight = 200;
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [chartDimensions, setChartDimensions] = useState({ width: 300, height: 200 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setChartDimensions({
          width: Math.max(rect.width, chartMinWidth),
          height: Math.max(rect.height, chartMinHeight),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [chartMinWidth, chartMinHeight]);

  // Nur echte Daten verwenden - keine Mock-Daten mehr
  const weeklyData: ChartDataPoint[] = weeklyHours
    ? weeklyHours.map((h, i) => {
        const names = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        const name = names[i] || `T${i + 1}`;
        const target = i < 5 ? 8 : 6;
        return { name, hours: h, target };
      })
    : [];

  const monthlyData: ChartDataPoint[] = monthlyHours
    ? monthlyHours.map((h, i) => ({ name: `Woche ${i + 1}`, hours: h, target: 40 }))
    : [];

  const shiftData = shiftCompletion || [];
  const activityData = staffActivity || [];

  const currentData: ChartDataPoint[] = timeRange === 'week' ? weeklyData : monthlyData;
  const averageHours =
    currentData.length > 0
      ? currentData.reduce((sum: number, item: ChartDataPoint) => sum + (item.hours || 0), 0) /
        currentData.length
      : 0;
  const targetHours =
    currentData.length > 0
      ? currentData.reduce((sum: number, item: ChartDataPoint) => sum + (item.target || 0), 0) /
        currentData.length
      : 0;
  const efficiency = targetHours > 0 ? (averageHours / targetHours) * 100 : 0;

  interface CustomTooltipProps extends TooltipProps<number, string> {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
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
            Stunden: {payload[0].value}h
          </Typography>
          {payload[1] && (
            <Typography variant="body2" color="text.secondary">
              Ziel: {payload[1].value}h
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  return (
    <GlassCard>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Statistiken & Entwicklung
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Zeitraum</InputLabel>
            <Select
              value={timeRange}
              label="Zeitraum"
              onChange={e => setTimeRange(e.target.value as 'week' | 'month')}
            >
              <MenuItem value="week">Diese Woche</MenuItem>
              <MenuItem value="month">Dieser Monat</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={3}>
          {/* Hours Chart */}
          <Grid size={{ xs: 12, md: 8 }}>
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
            <Box
              ref={containerRef}
              sx={{ height: 300, minHeight: 300, width: '100%', minWidth: chartMinWidth }}
            >
              {currentData.length > 0 ? (
                <ResponsiveContainer width={chartDimensions.width} height={300}>
                  <BarChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="hours" fill="#2196f3" name="Gearbeitet" />
                    <Bar dataKey="target" fill="#e0e0e0" name="Ziel" />
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

          {/* Shift Completion Pie Chart */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Schichtbesetzung
              </Typography>
            </Box>
            <Box sx={{ height: 200, minHeight: 200, width: '100%', minWidth: chartMinWidth }}>
              {shiftData.length > 0 ? (
                <ResponsiveContainer width={chartDimensions.width} height={200}>
                  <PieChart>
                    <Pie
                      data={shiftData as unknown as any[]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
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
            <Box sx={{ mt: 2 }}>
              {shiftData.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: item.color || '#8884d8',
                      borderRadius: '50%',
                    }}
                  />
                  <Typography variant="body2">
                    {item.name}: {item.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Staff Activity */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Personal-Status
              </Typography>
            </Box>
            <Box sx={{ height: 200, minHeight: 200, width: '100%', minWidth: chartMinWidth }}>
              {activityData.length > 0 ? (
                <ResponsiveContainer width={chartDimensions.width} height={200}>
                  <BarChart data={activityData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2196f3" />
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
        </Grid>

        {/* Summary Stats */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                  {currentData
                    .reduce((sum: number, item: ChartDataPoint) => sum + (item.hours || 0), 0)
                    .toFixed(0)}
                  h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gesamtstunden
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                  {shiftData.find(s => s.name === 'Besetzt')?.value || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Besetzungsrate
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="info.main" sx={{ fontWeight: 600 }}>
                  {activityData.reduce((sum, item) => sum + (item.value || 0), 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aktive Mitarbeiter
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main" sx={{ fontWeight: 600 }}>
                  {efficiency.toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Effizienz
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </GlassCard>
  );
}
