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

export function useEmployeeReports(filters?: EmployeeReportFilters) {
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
  const getTrendText = (trend: TrendValue) =>
    trend === 'up' ? 'steigend' : trend === 'down' ? 'fallend' : 'stabil';

  // Auf Filterzeitraum eingeschränkte Timesheets (ohne Filter: alle)
  const filteredTimesheets = useMemo(() => {
    const start = filters?.startDate;
    const end = filters?.endDate;
    if (!start && !end) return timesheets;
    return timesheets.filter((ts) => {
      const date = ts.date instanceof Date ? ts.date : new Date(ts.date);
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  }, [timesheets, filters?.startDate, filters?.endDate]);

  const workTimeReport = useMemo(() => {
    const dayMap = new Map<string, { totalHours: number; overtimeHours: number }>();
    for (const ts of filteredTimesheets) {
      const date = ts.date instanceof Date ? ts.date : new Date(ts.date);
      const dayKey = format(date, 'yyyy-MM-dd');
      const entry = dayMap.get(dayKey) ?? { totalHours: 0, overtimeHours: 0 };
      entry.totalHours += ts.totalHours || 0;
      entry.overtimeHours += ts.overtimeHours || 0;
      dayMap.set(dayKey, entry);
    }

    const hoursByDay = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, hours]) => ({
        day,
        totalHours: hours.totalHours,
        overtimeHours: hours.overtimeHours,
        regularHours: Math.max(0, hours.totalHours - hours.overtimeHours),
      }));

    const totalHours = hoursByDay.reduce((sum, d) => sum + d.totalHours, 0);
    const overtimeHours = hoursByDay.reduce((sum, d) => sum + d.overtimeHours, 0);
    const regularHours = Math.max(0, totalHours - overtimeHours);
    const workingDays = hoursByDay.length;

    const weekKeys = new Set(
      hoursByDay.map((d) => format(new Date(d.day), "RRRR-'W'II"))
    );
    const weeks = weekKeys.size;

    // Trend: zweite Hälfte des Zeitraums vs. erste Hälfte (±5 % Toleranz)
    let trend: TrendValue = 'flat';
    if (workingDays >= 4) {
      const mid = Math.floor(workingDays / 2);
      const firstAvg =
        hoursByDay.slice(0, mid).reduce((sum, d) => sum + d.totalHours, 0) / mid;
      const secondAvg =
        hoursByDay.slice(mid).reduce((sum, d) => sum + d.totalHours, 0) /
        (workingDays - mid);
      if (secondAvg > firstAvg * 1.05) trend = 'up';
      else if (secondAvg < firstAvg * 0.95) trend = 'down';
    }

    // ArbZG: max. 10h/Tag (§3), im Schnitt max. 48h/Woche
    const violations: string[] = [];
    for (const d of hoursByDay) {
      if (d.totalHours > 10) {
        violations.push(`Mehr als 10 Stunden am ${format(new Date(d.day), 'dd.MM.yyyy')}`);
      }
    }
    if (weeks > 0 && totalHours / weeks > 48) {
      violations.push('Durchschnittliche Wochenarbeitszeit über 48 Stunden');
    }

    return {
      data: hoursByDay as unknown[],
      summary: { totalHours, regularHours, overtimeHours, workingDays },
      totalHours,
      regularHours,
      overtimeHours,
      averageHoursPerDay: workingDays > 0 ? totalHours / workingDays : 0,
      averageHoursPerWeek: weeks > 0 ? totalHours / weeks : 0,
      workingDays,
      trend,
      hoursByDay,
      arbzgCompliance: { isCompliant: violations.length === 0, violations },
    };
  }, [filteredTimesheets]);

  // Zuschläge: surchargeAmount pro Timesheet, anteilig nach Stundenart aufgeteilt
  const surchargesReport = useMemo(() => {
    let totalSurcharge = 0;
    let nightSurcharge = 0;
    let weekendSurcharge = 0;
    let holidaySurcharge = 0;
    let overtimeSurcharge = 0;

    for (const ts of filteredTimesheets) {
      const amount = ts.surchargeAmount || 0;
      if (amount <= 0) continue;
      totalSurcharge += amount;

      const night = ts.nightHours || 0;
      const weekend = ts.weekendHours || 0;
      const holiday = ts.holidayHours || 0;
      const overtime = ts.overtimeHours || 0;
      const surchargeHours = night + weekend + holiday + overtime;
      if (surchargeHours <= 0) continue;

      nightSurcharge += (amount * night) / surchargeHours;
      weekendSurcharge += (amount * weekend) / surchargeHours;
      holidaySurcharge += (amount * holiday) / surchargeHours;
      overtimeSurcharge += (amount * overtime) / surchargeHours;
    }

    return {
      totalSurcharge,
      nightSurcharge,
      weekendSurcharge,
      holidaySurcharge,
      overtimeSurcharge,
    };
  }, [filteredTimesheets]);

  const getExportRange = (): ExportFilters => {
    if (filters?.startDate && filters?.endDate) {
      return { startDate: filters.startDate, endDate: filters.endDate };
    }
    const dates = filteredTimesheets.map((ts) =>
      ts.date instanceof Date ? ts.date : new Date(ts.date)
    );
    if (dates.length === 0) {
      const now = new Date();
      return { startDate: new Date(now.getFullYear(), 0, 1), endDate: now };
    }
    return {
      startDate: new Date(Math.min(...dates.map((d) => d.getTime()))),
      endDate: new Date(Math.max(...dates.map((d) => d.getTime()))),
    };
  };

  const exportWorkTimeReport = async (exportFormat: 'pdf' | 'excel') => {
    const range = getExportRange();
    const data: ExportData = { reportId: 'employee-worktime', ...workTimeReport.summary };
    try {
      if (exportFormat === 'pdf') {
        await reportService.exportTimeAccountReportPDF(data, range);
      } else {
        await reportService.exportTimeAccountReportExcel(data, range);
      }
      toast.success('Arbeitszeit-Bericht exportiert');
    } catch (error) {
      logger.error('Error exporting work time report:', error);
      toast.error('Fehler beim Exportieren des Arbeitszeit-Berichts');
      throw error;
    }
  };

  const exportAllReports = async (exportFormat: 'pdf' | 'excel') => {
    const range = getExportRange();
    try {
      if (exportFormat === 'pdf') {
        await reportService.exportTimeAccountReportPDF(
          { reportId: 'employee-worktime', ...workTimeReport.summary },
          range
        );
        await reportService.exportSurchargeReportPDF(
          { reportId: 'employee-surcharges', ...surchargesReport },
          range
        );
      } else {
        await reportService.exportTimeAccountReportExcel(
          { reportId: 'employee-worktime', ...workTimeReport.summary },
          range
        );
        await reportService.exportSurchargeReportExcel(
          { reportId: 'employee-surcharges', ...surchargesReport },
          range
        );
      }
      toast.success('Berichte exportiert');
    } catch (error) {
      logger.error('Error exporting reports:', error);
      toast.error('Fehler beim Exportieren der Berichte');
      throw error;
    }
  };

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
    surchargesReport,
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