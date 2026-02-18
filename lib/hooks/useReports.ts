'use client';

import { logger } from '@/lib/logging';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/lib/services/reports';
import { timesheetService } from '@/lib/services/timesheets';
import type { Timesheet } from '@/lib/services/timesheets';
import { assignmentService } from '@/lib/services/assignments';
import type { Assignment } from '@/lib/services/assignments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/utils/toast';

interface ReportGenerationData {
  type: 'timesheet' | 'allowances' | 'shifts' | 'summary';
  period: 'current-month' | 'last-month' | 'current-quarter' | 'current-year' | 'custom';
  format: 'pdf' | 'excel' | 'csv';
}

type TimesheetExtraFields = {
  overtimeHours?: number;
  nightAllowance?: number;
  weekendAllowance?: number;
  holidayAllowance?: number;
  surchargeType?: string;
  surchargeRate?: number;
  type?: string;
  approvedBy?: string;
  days?: number;
};

type AssignmentExtraFields = {
  shiftType?: string;
  facilityName?: string;
  hours?: number;
  breaks?: number;
  rating?: number;
  startTime?: string;
  endTime?: string;
};

const getTimesheetNumericField = (
  timesheet: Timesheet,
  key: keyof Pick<
    TimesheetExtraFields,
    'overtimeHours' | 'nightAllowance' | 'weekendAllowance' | 'holidayAllowance' | 'surchargeRate'
  >
): number => {
  const value = (timesheet as TimesheetExtraFields)[key];
  return typeof value === 'number' ? value : 0;
};

const getTimesheetStringField = (
  timesheet: Timesheet,
  key: keyof Pick<TimesheetExtraFields, 'surchargeType' | 'approvedBy' | 'type'>
): string | undefined => {
  const value = (timesheet as TimesheetExtraFields)[key];
  return typeof value === 'string' ? value : undefined;
};

const getAssignmentNumericField = (
  assignment: Assignment,
  key: keyof Pick<AssignmentExtraFields, 'hours' | 'breaks' | 'rating'>
): number => {
  const value = (assignment as AssignmentExtraFields)[key];
  return typeof value === 'number' ? value : 0;
};

const getAssignmentStringField = (
  assignment: Assignment,
  key: keyof Pick<AssignmentExtraFields, 'shiftType' | 'facilityName' | 'startTime' | 'endTime'>
): string | undefined => {
  const value = (assignment as AssignmentExtraFields)[key];
  return typeof value === 'string' ? value : undefined;
};

export interface Report {
  id: string;
  type: 'timesheet' | 'allowances' | 'shifts' | 'summary';
  title: string;
  description: string;
  period: string;
  format: 'pdf' | 'excel' | 'csv';
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  metadata?: Record<string, unknown>;
}

export interface ReportStats {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  totalAllowances: number;
  nightAllowance: number;
  weekendAllowance: number;
  holidayAllowance: number;
  completedShifts: number;
  pendingShifts: number;
  averageRating: number;
  recentShifts: Array<{
    date: Date;
    type: string;
    facility: string;
    hours: number;
    breaks: number;
    status: string;
  }>;
  allowances: Array<{
    date: Date;
    type: string;
    hours: number;
    rate: number;
    amount: number;
  }>;
  completedShiftsList: Array<{
    date: Date;
    type: string;
    startTime: string;
    endTime: string;
    facility: string;
    status: string;
    rating: number;
  }>;
}

export function useReports() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get all reports
  const {
    data: reports = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reports', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Benutzer nicht authentifiziert');
      }
      return reportService.getAll(user.id || undefined);
    },
    enabled: !!user?.id,
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: (data: ReportGenerationData) => {
      if (!user?.id) {
        throw new Error('Benutzer nicht authentifiziert');
      }
      return reportService.generateReport({
        ...data,
        userId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Bericht erfolgreich generiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Generieren: ' + error.message);
    },
  });

  // Export report mutation
  const exportReportMutation = useMutation({
    mutationFn: ({ reportId, format }: { reportId: string; format: 'pdf' | 'excel' | 'csv' }) =>
      reportService.exportReport(reportId, format),
    onSuccess: (fileUrl) => {
      // Download the file
      if (fileUrl) {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      toast.success('Bericht erfolgreich exportiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Export: ' + error.message);
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: (reportId: string) => reportService.delete(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Bericht erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Löschen: ' + error.message);
    },
  });

  // Helper functions
  const generateReport = async (data: ReportGenerationData) => {
    return generateReportMutation.mutateAsync(data);
  };

  const exportReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    return exportReportMutation.mutateAsync({ reportId, format });
  };

  const deleteReport = async (reportId: string) => {
    return deleteReportMutation.mutateAsync(reportId);
  };

  // Get report statistics from backend
  const { data: reportStats, isLoading: loadingStats } = useQuery({
    queryKey: ['reportStats', user?.id],
    queryFn: async (): Promise<ReportStats> => {
      if (!user?.id) {
        return getEmptyReportStats();
      }
      
      try {
        // Get real data from services
        const [timesheets, assignments] = await Promise.all([
          timesheetService.getByUserId(user.id),
          assignmentService.getByUserId(user.id, user.companyId || undefined),
        ]);

        // Calculate statistics from real data
        const totalHours = timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
        const regularHours = timesheets.reduce((sum, ts) => sum + (ts.regularHours || 0), 0);
        const overtimeHours = timesheets.reduce((sum, ts) => sum + getTimesheetNumericField(ts, 'overtimeHours'), 0);
        const nightHours = timesheets.reduce((sum, ts) => sum + (ts.nightHours || 0), 0);
        
        const totalAllowances = timesheets.reduce((sum, ts) => sum + (ts.surchargeAmount || 0), 0);
        const nightAllowance = timesheets.reduce((sum, ts) => sum + getTimesheetNumericField(ts, 'nightAllowance'), 0);
        const weekendAllowance = timesheets.reduce((sum, ts) => sum + getTimesheetNumericField(ts, 'weekendAllowance'), 0);
        const holidayAllowance = timesheets.reduce((sum, ts) => sum + getTimesheetNumericField(ts, 'holidayAllowance'), 0);

        const completedShifts = assignments.filter(a => a.status === 'completed').length;
        const pendingShifts = assignments.filter(a => a.status === 'pending').length;
        
        // Calculate average rating from completed assignments
        const completedAssignments = assignments.filter(a => a.status === 'completed' && getAssignmentNumericField(a, 'rating') > 0);
        const averageRating = completedAssignments.length > 0 
          ? completedAssignments.reduce((sum, a) => sum + getAssignmentNumericField(a, 'rating'), 0) / completedAssignments.length
          : 0;

        // Get recent shifts from assignments
        const recentShifts = assignments
          .filter(a => a.status === 'completed')
          .slice(0, 3)
          .map(a => ({
            date: new Date(a.createdAt),
            type: getAssignmentStringField(a, 'shiftType') || 'Schicht',
            facility: getAssignmentStringField(a, 'facilityName') || 'Unbekannt',
            hours: getAssignmentNumericField(a, 'hours') || 8,
            breaks: getAssignmentNumericField(a, 'breaks') || 30,
            status: 'Abgeschlossen',
          }));

        // Get allowances from timesheets
        const allowances = timesheets
          .filter(ts => ts.surchargeAmount && ts.surchargeAmount > 0)
          .slice(0, 3)
          .map(ts => ({
            date: new Date(ts.startDate),
            type: getTimesheetStringField(ts, 'surchargeType') || 'Zuschlag',
            hours: ts.totalHours || 0,
            rate: getTimesheetNumericField(ts, 'surchargeRate'),
            amount: ts.surchargeAmount || 0,
          }));

        // Get completed shifts list
        const completedShiftsList = assignments
          .filter(a => a.status === 'completed')
          .slice(0, 5)
          .map(a => ({
            date: new Date(a.createdAt),
            type: getAssignmentStringField(a, 'shiftType') || 'Schicht',
            startTime: getAssignmentStringField(a, 'startTime') || '06:00',
            endTime: getAssignmentStringField(a, 'endTime') || '14:00',
            facility: getAssignmentStringField(a, 'facilityName') || 'Unbekannt',
            status: 'Abgeschlossen',
            rating: getAssignmentNumericField(a, 'rating'),
          }));

        return {
          totalHours,
          regularHours,
          overtimeHours,
          nightHours,
          totalAllowances,
          nightAllowance,
          weekendAllowance,
          holidayAllowance,
          completedShifts,
          pendingShifts,
          averageRating: Math.round(averageRating * 10) / 10,
          recentShifts,
          allowances,
          completedShiftsList,
        };
      } catch (error) {
        logger.error('Error fetching report stats:', error);
        return getEmptyReportStats();
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper function for empty stats
  const getEmptyReportStats = (): ReportStats => ({
    totalHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    nightHours: 0,
    totalAllowances: 0,
    nightAllowance: 0,
    weekendAllowance: 0,
    holidayAllowance: 0,
    completedShifts: 0,
    pendingShifts: 0,
    averageRating: 0,
    recentShifts: [],
    allowances: [],
    completedShiftsList: [],
  });

  return {
    reports,
    isLoading: isLoading || loadingStats,
    error,
    generateReport,
    exportReport,
    deleteReport,
    getReportStats: () => reportStats || getEmptyReportStats(),
    reportStats: reportStats || getEmptyReportStats(),
    refetch,
    isGenerating: generateReportMutation.isPending,
    isExporting: exportReportMutation.isPending,
    isDeleting: deleteReportMutation.isPending,
  };
}
