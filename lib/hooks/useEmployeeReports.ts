'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { timesheetService } from '@/lib/services/timesheets';
import type { Timesheet } from '@/lib/services/timesheets';
import { timesService } from '@/lib/services/times';
import type { TimeEntry } from '@/lib/services/times';
import { reportService } from '@/lib/services/reports';
import { toast } from '@/lib/utils/toast';
import { logger } from '@/lib/utils/logger';

export interface EmployeeReportFilters {
  year?: number;
  startDate?: Date;
  endDate?: Date;
  [key: string]: unknown;
}

interface ExportData {
  reportId: string;
  [key: string]: unknown;
}

interface ExportFilters {
  startDate: Date;
  endDate: Date;
  [key: string]: unknown;
}

export function useEmployeeReports(_filters?: EmployeeReportFilters) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get timesheets for the current user
  const { data: timesheets = [], isLoading: loadingTimesheets, error, refetch: refetchTimesheets } = useQuery<Timesheet[]>({
    queryKey: ['employeeTimesheets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await timesheetService.getByUserId(user.id);
      } catch (error) {
        logger.error('Error fetching timesheets:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Get sick leave entries
  type SickEntry = TimeEntry & {
    startDate: Date;
    endDate: Date;
    days: number;
  };

const { data: timeEntries = [], isLoading: loadingTimeEntries } = useQuery<SickEntry[]>({
    queryKey: ['employeeTimeEntries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const allEntries = await timesService.getByUserId(user.id);
        // Filter for sick entries and normalise optional fields
        return allEntries
          .filter((entry): entry is TimeEntry & { startDate?: Date; endDate?: Date; days?: number } => entry.type === 'sick')
          .map<SickEntry>((entry) => {
            const startDate = entry.startDate ?? entry.date;
            const endDate = entry.endDate ?? entry.date;
            const days = entry.days ?? (entry.hours ? Math.round(entry.hours / 8) : 1);

            return {
              ...entry,
              startDate,
              endDate,
              days,
            };
          });
      } catch (error) {
        logger.error('Error fetching time entries:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Generate time account report
  const generateTimeAccountReportMutation = useMutation({
    mutationFn: async (filters: {
      startDate: Date;
      endDate: Date;
      includeOvertime?: boolean;
    }) => {
      if (!user?.id) throw new Error('No user ID');
      return await reportService.generateTimeAccountReport({
        userId: user.id,
        ...filters,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeTimesheets'] });
      toast.success('Zeitkonto-Bericht erfolgreich generiert');
    },
    onError: (error: Error) => {
      logger.error('Error generating time account report:', error);
      toast.error('Fehler beim Generieren des Zeitkonto-Berichts');
    },
  });

  // Export functions
  const exportTimeAccountReportPDF = async (data: ExportData, filters: ExportFilters) => {
    try {
      return await reportService.exportTimeAccountReportPDF(data, filters);
    } catch (error) {
      logger.error('Error exporting PDF:', error);
      toast.error('Fehler beim Exportieren der PDF');
      throw error;
    }
  };

  const exportTimeAccountReportExcel = async (data: ExportData, filters: ExportFilters) => {
    try {
      return await reportService.exportTimeAccountReportExcel(data, filters);
    } catch (error) {
      logger.error('Error exporting Excel:', error);
      toast.error('Fehler beim Exportieren der Excel-Datei');
      throw error;
    }
  };

  // Helper functions
  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'dd.MM.yyyy');
  };

  const formatDateTime = (date: Date | string) => {
    return format(new Date(date), 'dd.MM.yyyy HH:mm');
  };

  const formatTime = (date: Date | string) => format(new Date(date), 'HH:mm');
  const formatWeek = (date: Date | string) => format(new Date(date), "'KW'ww yyyy");
  const formatMonth = (date: Date | string) => format(new Date(date), 'MMMM yyyy');
  const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  const formatHours = (value: number) => `${value.toFixed(2)} h`;
  const formatPercentage = (value: number, total?: number) =>
    total != null && total > 0 ? `${((value / total) * 100).toFixed(1)} %` : `${value.toFixed(1)} %`;
  const getStatusColor = (_status: string) => 'default' as const;
  const getStatusLabel = (status: string) => status;
  type TrendValue = 'up' | 'down' | 'flat';
  const getTrendIcon = (_trend: TrendValue) => null;
  const getTrendText = (_trend: TrendValue) => '';

  const workTimeReport = useMemo(
    () => ({
      data: [] as unknown[],
      summary: {},
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      averageHoursPerDay: 0,
      averageHoursPerWeek: 0,
      workingDays: 0,
      trend: 'flat' as TrendValue,
      hoursByDay: [] as unknown[],
    }),
    []
  );
  const vacationReport = useMemo(
    () => ({
      data: [] as unknown[],
      summary: {},
      totalVacationDays: 0,
      usedVacationDays: 0,
      remainingVacationDays: 0,
      averageVacationDaysPerMonth: 0,
      vacationTrend: 0,
      vacationByMonth: [] as unknown[],
    }),
    []
  );

  const exportWorkTimeReport = async (_format: 'pdf' | 'excel') => { toast.info('Export wird vorbereitet'); };
  const exportVacationReport = async (_format: 'pdf' | 'excel') => { toast.info('Export wird vorbereitet'); };
  const exportAllReports = async (_format: 'pdf' | 'excel') => { toast.info('Export wird vorbereitet'); };

  const refetch = () => { void refetchTimesheets(); queryClient.invalidateQueries({ queryKey: ['employeeTimeEntries'] }); };

  const getTotalHours = () => {
    return timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
  };

  const getOvertimeHours = () => {
    // Calculate overtime: Stunden > 8h pro Tag oder > 40h pro Woche
    // Group by week first
    const timesheetsByWeek = new Map<string, Timesheet[]>();
    timesheets.forEach(ts => {
      const date = ts.date instanceof Date ? ts.date : new Date(ts.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      
      if (!timesheetsByWeek.has(weekKey)) {
        timesheetsByWeek.set(weekKey, []);
      }
      timesheetsByWeek.get(weekKey)!.push(ts);
    });

    let totalOvertime = 0;
    timesheetsByWeek.forEach((weekTimesheets) => {
      // Daily overtime: > 8h per day
      const dailyOvertime = weekTimesheets.reduce((sum, ts) => {
        const hours = ts.totalHours || 0;
        return sum + Math.max(0, hours - 8);
      }, 0);
      
      // Weekly overtime: > 40h per week
      const weeklyTotal = weekTimesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
      const weeklyOvertime = Math.max(0, weeklyTotal - 40);
      
      // Use the maximum of daily or weekly overtime
      totalOvertime += Math.max(dailyOvertime, weeklyOvertime);
    });

    return totalOvertime;
  };

  const isLoading = loadingTimesheets || loadingTimeEntries ||
    generateTimeAccountReportMutation.isPending;

  return {
    // Data
    timesheets,
    timeEntries,
    user,
    workTimeReport,
    vacationReport,
    // Loading states
    isLoading,
    loadingTimesheets,
    loadingTimeEntries,
    error,
    // Mutations
    generateTimeAccountReport: generateTimeAccountReportMutation.mutateAsync,
    // Export functions
    exportTimeAccountReportPDF,
    exportTimeAccountReportExcel,
    exportWorkTimeReport,
    exportVacationReport,
    exportAllReports,
    refetch,
    // Helper functions
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
    getTotalHours,
    getOvertimeHours,
    // Computed values
    totalHours: getTotalHours(),
    overtimeHours: getOvertimeHours(),
  };
}