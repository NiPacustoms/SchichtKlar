import { useAuth } from '@/contexts/AuthContext';
import { timesheetService } from '@/lib/services';
import { TimesheetForm } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getRequiredBreakMinutes } from '@/lib/utils/time';
import { calculateTimesheet } from '@/lib/domain/timesheetCalc';

export const useTimesheet = (date?: Date) => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const targetDate = date || new Date();

  // Get today's timesheet
  const {
    data: timesheet,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['timesheet', userId, format(targetDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!userId) return null;
      const found = await timesheetService.getByDate(userId, targetDate);
      if (found || date) return found;
      // Nach Mitternacht: noch laufenden Nachtdienst von gestern weiterführen
      const yesterday = new Date(targetDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const prev = await timesheetService.getByDate(userId, yesterday);
      const running = prev && prev.status === 'draft' && (!prev.endTime || prev.endTime === prev.startTime);
      return running ? prev : null;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get recent timesheets for history
  const { data: recentTimesheets } = useQuery({
    queryKey: ['timesheets', 'recent', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await timesheetService.getByUserId(userId, 3);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create timesheet mutation
  const createTimesheet = useMutation({
    mutationFn: async (data: TimesheetForm) => {
      if (!userId) throw new Error('No user ID');
      return await timesheetService.create(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });

  // Update timesheet mutation
  const updateTimesheet = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimesheetForm> }) => {
      return await timesheetService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });

  // Submit timesheet mutation
  const submitTimesheet = useMutation({
    mutationFn: async (id: string) => {
      return await timesheetService.submit(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });

  // Calculate total hours
  const calculateTotalHours = (startTime: string, endTime: string, breakMinutes: number) => {
    if (!startTime || !endTime) return 0;
    try {
      return calculateTimesheet(startTime, endTime, breakMinutes).totalHours;
    } catch {
      return 0;
    }
  };

  // Check if break warning is needed (>6h work, <30min break)
  const needsBreakWarning = (workMinutes: number, breakMinutes: number) => {
    const requiredBreakMinutes = getRequiredBreakMinutes(workMinutes);
    return breakMinutes < requiredBreakMinutes;
  };

  return {
    timesheet,
    recentTimesheets: recentTimesheets || [],
    isLoading,
    error,
    createTimesheet,
    updateTimesheet,
    submitTimesheet,
    calculateTotalHours,
    needsBreakWarning,
  };
};
