'use client';

import { logger } from '@/lib/logging';

import { PageContainer } from '@/components/layout/PageContainer';
import { useEmployeeReports, EmployeeReportFilters } from '@/lib/hooks/useEmployeeReports';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { toast } from '@/lib/utils/toast';
import {
  Assessment,
  Download,
  Refresh,
  Work,
  BarChart,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useState } from 'react';
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

export default function BerichtePage() {
  const { user } = useAuth();
  useTheme();

  const [filters, setFilters] = useState<EmployeeReportFilters>({});
  const [activeTab, setActiveTab] = useState(0);
  const [reportType, setReportType] = useState<'worktime' | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const {
    timesheets,
    isLoading,
    error,
    workTimeReport,
    formatDate,
    formatTime,
    formatHours,
    getStatusColor,
    getStatusLabel,
    getTrendIcon,
    getTrendText,
    exportWorkTimeReport,
    exportAllReports,
    refetch,
  } = useEmployeeReports(filters);

  const handleFilterChange = (newFilters: Partial<EmployeeReportFilters>) => {
    setFilters((prev: EmployeeReportFilters) => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      switch (reportType) {
        case 'worktime':
          await exportWorkTimeReport(format);
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

  const _getReportTitle = () => {
    switch (reportType) {
      case 'worktime':
        return 'Arbeitszeit-Bericht';
      case 'all':
        return 'Alle Berichte';
      default:
        return 'Arbeitszeit-Bericht';
    }
  };

  if (isLoading) {
    return <LoadingSpinner variant="skeleton" message="Berichte werden geladen..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return (
      <PageContainer maxWidth="wide">
        <Alert severity="error">Bitte melde dich an, um deine Berichte zu sehen.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="wide">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Meine Berichte
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
                  onChange={e => setReportType(e.target.value as 'worktime' | 'all')}
                >
                  <MenuItem value="worktime">Arbeitszeit</MenuItem>
                  <MenuItem value="all">Alle</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Jahr</InputLabel>
                <Select
                  value={filters.year != null ? String(filters.year) : ''}
                  label="Jahr"
                  onChange={e =>
                    handleFilterChange({
                      year: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                >
                  <MenuItem value="">Alle</MenuItem>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <MenuItem key={year} value={String(year)}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper className="glass" sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Übersicht" icon={<Assessment />} iconPosition="start" />
            <Tab label="Diagramme" icon={<BarChart />} iconPosition="start" />
            <Tab label="Details" icon={<Work />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Übersicht Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Arbeitszeit-Statistiken */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="glass">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Arbeitszeit-Übersicht
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Gesamtstunden</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatHours(workTimeReport.totalHours)}
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
                        {formatHours(workTimeReport.regularHours)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        workTimeReport.totalHours > 0
                          ? (workTimeReport.regularHours / workTimeReport.totalHours) * 100
                          : 0
                      }
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Überstunden</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatHours(workTimeReport.overtimeHours)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        workTimeReport.totalHours > 0
                          ? (workTimeReport.overtimeHours / workTimeReport.totalHours) * 100
                          : 0
                      }
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Durchschnitt pro Tag</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatHours(workTimeReport.averageHoursPerDay)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Durchschnitt pro Woche</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatHours(workTimeReport.averageHoursPerWeek)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Arbeitstage</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {workTimeReport.workingDays}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Trend */}
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
                          workTimeReport.trend === 'up' || workTimeReport.trend === 'flat'
                            ? 'success.main'
                            : workTimeReport.trend === 'down'
                              ? 'error.main'
                              : 'info.main',
                      }}
                    >
                      {getTrendIcon(workTimeReport.trend)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        Arbeitszeit: {getTrendText(workTimeReport.trend)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatHours(workTimeReport.averageHoursPerWeek)} pro Woche
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
                      <RechartsLineChart data={workTimeReport.hoursByDay}>
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
                          stroke="#005f73"
                          strokeWidth={2}
                          name="Gesamtstunden"
                        />
                        <Line
                          type="monotone"
                          dataKey="regularHours"
                          stroke="#047857"
                          strokeWidth={2}
                          name="Regulär"
                        />
                        <Line
                          type="monotone"
                          dataKey="overtimeHours"
                          stroke="#b45309"
                          strokeWidth={2}
                          name="Überstunden"
                        />
                      </RechartsLineChart>
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
                              value: workTimeReport.regularHours,
                              color: '#047857',
                            },
                            {
                              name: 'Überstunden',
                              value: workTimeReport.overtimeHours,
                              color: '#b45309',
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#0a9396"
                          dataKey="value"
                        >
                          {[
                            {
                              name: 'Regulär',
                              value: workTimeReport.regularHours,
                              color: '#047857',
                            },
                            {
                              name: 'Überstunden',
                              value: workTimeReport.overtimeHours,
                              color: '#b45309',
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
                    Alle Zeiteinträge
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Datum</TableCell>
                          <TableCell>Start</TableCell>
                          <TableCell>Ende</TableCell>
                          <TableCell>Stunden</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {timesheets.slice(0, 20).map(timesheet => (
                          <TableRow key={timesheet.id}>
                            <TableCell>{formatDate(timesheet.startDate)}</TableCell>
                            <TableCell>{formatTime(timesheet.startDate)}</TableCell>
                            <TableCell>{formatTime(timesheet.endDate)}</TableCell>
                            <TableCell>{formatHours(timesheet.totalHours)}</TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(timesheet.status)}
                                color={
                                  getStatusColor(timesheet.status) as
                                    | 'success'
                                    | 'error'
                                    | 'warning'
                                    | 'info'
                                }
                                size="small"
                              />
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
    </PageContainer>
  );
}
