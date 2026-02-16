'use client';

import { logger } from '@/lib/logging';

import { AppLayout } from '@/components/layout/AppLayout';
import { useAdminReports } from '@/lib/hooks/useAdminReports';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { toast } from '@/lib/utils/toast';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Download,
  Refresh,
  Euro,
  Schedule,
  Work,
  DarkMode as Night,
  Weekend,
  Event as Holiday,
  Flight as Vacation,
  BarChart,
  PieChart,
  TrendingUp as LineChart,
  People,
  Business,
  Assignment,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useState, useMemo } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AdminBerichtePage() {
  const { user } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    facilityId: undefined as string | undefined,
    userId: undefined as string | undefined,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [reportType, setReportType] = useState<'time' | 'surcharge' | 'employee' | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const {
    timeAccountReport,
    surchargeReport,
    employeeStatistics,
    isLoading,
    error,
    formatDate,
    formatTime,
    formatDateTime,
    formatWeek,
    formatMonth,
    formatCurrency,
    formatHours,
    formatPercentage,
    getStatusColor,
    getStatusLabel,
    getTrendIcon,
    getTrendText,
    exportTimeAccountReport,
    exportSurchargeReport,
    exportEmployeeStatistics,
    exportAllReports,
    refetch,
  } = useAdminReports(filters);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      switch (reportType) {
        case 'time':
          await exportTimeAccountReport(format);
          break;
        case 'surcharge':
          await exportSurchargeReport(format);
          break;
        case 'employee':
          await exportEmployeeStatistics(format);
          break;
        case 'all':
          await exportAllReports(format);
          break;
      }
      toast.success(`${format.toUpperCase()}-Export erfolgreich`);
    } catch (error) {
      toast.error('Export fehlgeschlagen');
      logger.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getCurrentReportData = () => {
    switch (reportType) {
      case 'time':
        return timeAccountReport;
      case 'surcharge':
        return surchargeReport;
      case 'employee':
        return employeeStatistics;
      case 'all':
        return {
          timeAccount: timeAccountReport,
          surcharge: surchargeReport,
          employee: employeeStatistics,
        };
      default:
        return timeAccountReport;
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'time':
        return 'Zeitkonten-Bericht';
      case 'surcharge':
        return 'Zuschläge-Bericht';
      case 'employee':
        return 'Mitarbeiter-Statistiken';
      case 'all':
        return 'Alle Berichte';
      default:
        return 'Zeitkonten-Bericht';
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Berichte werden geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <AppLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Bitte melde dich an, um Berichte zu sehen.</Alert>
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Admin-Berichte
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('pdf')}
              size="small"
              disabled={isExporting}
            >
              {isExporting ? <CircularProgress size={16} /> : 'PDF'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('excel')}
              size="small"
              disabled={isExporting}
            >
              {isExporting ? <CircularProgress size={16} /> : 'Excel'}
            </Button>
            <IconButton onClick={() => refetch()}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {/* Filter */}
        <Paper className="glass" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filter
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                <DatePicker
                  label="Von Datum"
                  value={filters.startDate || null}
                  onChange={date => handleFilterChange({ startDate: date || undefined })}
                  slotProps={{
                    textField: { fullWidth: true, size: 'small' },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                <DatePicker
                  label="Bis Datum"
                  value={filters.endDate || null}
                  onChange={date => handleFilterChange({ endDate: date || undefined })}
                  slotProps={{
                    textField: { fullWidth: true, size: 'small' },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Berichtstyp</InputLabel>
                <Select
                  value={reportType}
                  label="Berichtstyp"
                  onChange={e => setReportType((e.target.value || 'all') as 'time' | 'surcharge' | 'employee' | 'all')}
                >
                  <MenuItem value="time">Zeitkonten</MenuItem>
                  <MenuItem value="surcharge">Zuschläge</MenuItem>
                  <MenuItem value="employee">Mitarbeiter</MenuItem>
                  <MenuItem value="all">Alle</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Einrichtung</InputLabel>
                <Select
                  value={filters.facilityId || ''}
                  label="Einrichtung"
                  onChange={e => handleFilterChange({ facilityId: e.target.value || undefined })}
                >
                  <MenuItem value="">Alle</MenuItem>
                  {/* Hier würden echte Einrichtungen geladen */}
                  <MenuItem value="facility1">Krankenhaus A</MenuItem>
                  <MenuItem value="facility2">Krankenhaus B</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper className="glass" sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Übersicht" icon={<Assessment />} iconPosition="start" />
            <Tab label="Charts" icon={<BarChart />} iconPosition="start" />
            <Tab label="Details" icon={<Work />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Übersicht Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Zeitkonten-Statistiken */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Zeitkonten-Übersicht
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Gesamtstunden</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatHours(timeAccountReport?.totalHours ?? 0)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Reguläre Stunden</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatHours(timeAccountReport?.regularHours ?? 0)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (timeAccountReport?.totalHours ?? 0) > 0
                          ? ((timeAccountReport?.regularHours ?? 0) / (timeAccountReport?.totalHours ?? 1)) * 100
                          : 0
                      }
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Überstunden</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatHours(timeAccountReport?.overtimeHours ?? 0)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (timeAccountReport?.totalHours ?? 0) > 0
                          ? ((timeAccountReport?.overtimeHours ?? 0) / (timeAccountReport?.totalHours ?? 1)) * 100
                          : 0
                      }
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Durchschnitt pro Tag</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatHours(timeAccountReport?.averageHoursPerDay ?? 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Arbeitstage</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {timeAccountReport?.workingDays ?? 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Zuschläge-Statistiken */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Zuschläge-Übersicht
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Gesamtzuschläge</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(surchargeReport?.totalSurcharge ?? 0)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Nachtzuschläge</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(surchargeReport?.nightSurcharge ?? 0)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (surchargeReport?.totalSurcharge ?? 0) > 0
                          ? ((surchargeReport?.nightSurcharge ?? 0) / (surchargeReport?.totalSurcharge ?? 1)) * 100
                          : 0
                      }
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Wochenendzuschläge</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(surchargeReport?.weekendSurcharge ?? 0)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (surchargeReport?.totalSurcharge ?? 0) > 0
                          ? ((surchargeReport?.weekendSurcharge ?? 0) / (surchargeReport?.totalSurcharge ?? 1)) * 100
                          : 0
                      }
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Durchschnitt pro Tag</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(surchargeReport?.averageSurchargePerDay ?? 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Durchschnitt pro Woche</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(surchargeReport?.averageSurchargePerWeek ?? 0)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Mitarbeiter-Statistiken */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Mitarbeiter-Übersicht
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Gesamtmitarbeiter</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {employeeStatistics?.totalEmployees ?? 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Aktive Mitarbeiter</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {employeeStatistics?.activeEmployees ?? 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (employeeStatistics?.totalEmployees ?? 0) > 0
                          ? ((employeeStatistics?.activeEmployees ?? 0) / (employeeStatistics?.totalEmployees ?? 1)) * 100
                          : 0
                      }
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Durchschnittliche Schichten</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {employeeStatistics?.averageShiftsPerEmployee ?? 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        100,
                        ((employeeStatistics?.averageShiftsPerEmployee ?? 0) / 20) * 100
                      )}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Durchschnittliche Stunden</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatHours(employeeStatistics?.averageHoursPerEmployee ?? 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Top Performer</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {employeeStatistics?.topPerformers ?? 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Trend-Analyse */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Trend-Analyse
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor:
                          timeAccountReport?.trend === 'up'
                            ? 'success.main'
                            : timeAccountReport?.trend === 'down'
                              ? 'error.main'
                              : 'info.main',
                      }}
                    >
                      {getTrendIcon(timeAccountReport?.trend ?? 'flat')}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        Arbeitszeit: {getTrendText(timeAccountReport?.trend ?? 'flat')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatHours(timeAccountReport?.averageHoursPerWeek ?? 0)} pro Woche
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor:
                          surchargeReport?.surchargeTrend === 'up'
                            ? 'success.main'
                            : surchargeReport?.surchargeTrend === 'down'
                              ? 'error.main'
                              : 'info.main',
                      }}
                    >
                      {getTrendIcon(surchargeReport?.surchargeTrend ?? 'flat')}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        Zuschläge: {getTrendText(surchargeReport?.surchargeTrend ?? 'flat')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(surchargeReport?.averageSurchargePerWeek ?? 0)} pro Woche
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor:
                          employeeStatistics?.employeeTrend === 'up'
                            ? 'success.main'
                            : employeeStatistics?.employeeTrend === 'down'
                              ? 'error.main'
                              : 'info.main',
                      }}
                    >
                      {getTrendIcon(employeeStatistics?.employeeTrend ?? 'flat')}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        Mitarbeiter: {getTrendText(employeeStatistics?.employeeTrend ?? 'flat')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employeeStatistics?.averageShiftsPerEmployee ?? 0} Schichten pro Mitarbeiter
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Charts Tab */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {/* Arbeitszeit-Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Arbeitszeit pro Tag
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={timeAccountReport?.hoursByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          tickFormatter={value =>
                            new Date(value).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                            })
                          }
                        />
                        <YAxis />
                        <RechartsTooltip
                          formatter={(value, name) => [`${value}h`, name]}
                          labelFormatter={value => new Date(value).toLocaleDateString('de-DE')}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalHours"
                          stroke="#1976d2"
                          strokeWidth={2}
                          name="Gesamtstunden"
                        />
                        <Line
                          type="monotone"
                          dataKey="regularHours"
                          stroke="#4caf50"
                          strokeWidth={2}
                          name="Regulär"
                        />
                        <Line
                          type="monotone"
                          dataKey="overtimeHours"
                          stroke="#ff9800"
                          strokeWidth={2}
                          name="Überstunden"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Zuschläge-Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Zuschläge pro Tag
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={surchargeReport?.surchargeByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          tickFormatter={value =>
                            new Date(value).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                            })
                          }
                        />
                        <YAxis />
                        <RechartsTooltip
                          formatter={(value, name) => [formatCurrency(Number(value)), name]}
                          labelFormatter={value => new Date(value).toLocaleDateString('de-DE')}
                        />
                        <Bar dataKey="nightSurcharge" stackId="a" fill="#9c27b0" name="Nacht" />
                        <Bar
                          dataKey="weekendSurcharge"
                          stackId="a"
                          fill="#f44336"
                          name="Wochenende"
                        />
                        <Bar
                          dataKey="holidaySurcharge"
                          stackId="a"
                          fill="#ff9800"
                          name="Feiertag"
                        />
                        <Bar
                          dataKey="overtimeSurcharge"
                          stackId="a"
                          fill="#4caf50"
                          name="Überstunden"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Mitarbeiter-Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Mitarbeiter pro Einrichtung
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={employeeStatistics?.employeesByFacility}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="facility"
                          tickFormatter={value =>
                            value.length > 10 ? value.substring(0, 10) + '...' : value
                          }
                        />
                        <YAxis />
                        <RechartsTooltip
                          formatter={(value, name) => [`${value}`, name]}
                          labelFormatter={value => value}
                        />
                        <Bar dataKey="count" fill="#2196f3" name="Mitarbeiter" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Verteilung-Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Stunden-Verteilung
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            {
                              name: 'Regulär',
                              value: timeAccountReport?.regularHours,
                              color: '#4caf50',
                            },
                            {
                              name: 'Überstunden',
                              value: timeAccountReport?.overtimeHours,
                              color: '#ff9800',
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            {
                              name: 'Regulär',
                              value: timeAccountReport?.regularHours,
                              color: '#4caf50',
                            },
                            {
                              name: 'Überstunden',
                              value: timeAccountReport?.overtimeHours,
                              color: '#ff9800',
                            },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={value => [`${value}h`, 'Stunden']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Details Tab */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Detaillierte Berichte
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Mitarbeiter</TableCell>
                          <TableCell>Einrichtung</TableCell>
                          <TableCell>Stunden</TableCell>
                          <TableCell>Zuschläge</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {timeAccountReport?.employees.slice(0, 20).map(employee => (
                          <TableRow key={employee.userId}>
                            <TableCell>{employee.userName}</TableCell>
                            <TableCell>Einrichtung A</TableCell>
                            <TableCell>{formatHours(employee.totalHours)}</TableCell>
                            <TableCell>{formatCurrency(0)}</TableCell>
                            <TableCell>
                              <Chip label="Aktiv" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
}
