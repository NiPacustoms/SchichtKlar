'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiMonitoringService } from '@/lib/services/apiMonitoring';
import { Box, Typography, Paper } from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ApiStatsDataPoint {
  date: string;
  count: number;
  cacheHits?: number;
  cacheMisses?: number;
  cacheHitRate?: number;
  averageResponseTime?: number;
}

async function fetchHistoricalStats(): Promise<ApiStatsDataPoint[]> {
  return ApiMonitoringService.getHistoricalStats(7);
}

/**
 * Formatiert Datum für Anzeige
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

/**
 * API-Statistiken Chart-Komponente
 * Zeigt historische API-Nutzung über die letzten 7 Tage
 */
export function ApiStatsChart() {
  const { data: historicalStats, isLoading } = useQuery<ApiStatsDataPoint[]>({
    queryKey: ['apiHistoricalStats'],
    queryFn: fetchHistoricalStats,
    refetchInterval: 300000, // Alle 5 Minuten aktualisieren
    staleTime: 60000, // 1 Minute als "fresh" betrachten
  });

  if (isLoading) {
    return (
      <Paper className="glass" sx={{ p: 3 }}>
        <LoadingSpinner message="Lade API-Statistiken..." />
      </Paper>
    );
  }

  if (!historicalStats || historicalStats.length === 0) {
    return (
      <Paper className="glass" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          API-Nutzung (letzte 7 Tage)
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body2">Keine historischen Daten verfügbar</Typography>
        </Box>
      </Paper>
    );
  }

  const chartData = historicalStats.map(stat => ({
    ...stat,
    dateFormatted: formatDate(stat.date),
  }));

  const totalRequests = historicalStats.reduce((sum, stat) => sum + stat.count, 0);
  const cacheHitRateStats = historicalStats.filter(stat => stat.cacheHitRate !== undefined);
  const avgCacheHitRate =
    cacheHitRateStats.length > 0
      ? cacheHitRateStats.reduce((sum, stat) => sum + (stat.cacheHitRate || 0), 0) /
        cacheHitRateStats.length
      : 0;

  return (
    <Paper className="glass" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        API-Nutzung (letzte 7 Tage)
      </Typography>

      {/* Zusammenfassung */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Gesamt Requests
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {totalRequests.toLocaleString('de-DE')}
          </Typography>
        </Box>
        {avgCacheHitRate > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Ø Cache-Hit-Rate
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50' }}>
              {avgCacheHitRate.toFixed(1)}%
            </Typography>
          </Box>
        )}
      </Box>

      {/* API-Calls Chart */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Tägliche API-Calls
        </Typography>
        <Box sx={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateFormatted" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString('de-DE'), 'API-Calls']}
                labelFormatter={label => `Datum: ${label}`}
              />
              <Bar dataKey="count" fill="#1976d2" name="API-Calls" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Cache-Hit-Rate Chart */}
      {historicalStats.some(stat => stat.cacheHitRate !== undefined) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Cache-Hit-Rate (%)
          </Typography>
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dateFormatted" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Cache-Hit-Rate']}
                  labelFormatter={label => `Datum: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cacheHitRate"
                  stroke="#4caf50"
                  strokeWidth={2}
                  name="Cache-Hit-Rate"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Response-Zeit Chart */}
      {historicalStats.some(stat => stat.averageResponseTime !== undefined) && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Durchschnittliche Response-Zeit (ms)
          </Typography>
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dateFormatted" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(0)} ms`, 'Response-Zeit']}
                  labelFormatter={label => `Datum: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="averageResponseTime"
                  stroke="#ff9800"
                  strokeWidth={2}
                  name="Response-Zeit"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
