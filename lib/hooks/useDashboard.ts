import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import {
  getTodayAssignment,
  getUpcomingAssignments,
} from '@/src/composition';
import { timesheetService } from '@/lib/services/timesheets';
import { shiftService } from '@/lib/services/shifts';
import { facilityService } from '@/lib/services/facilities';
import type { Shift } from '@/lib/services/shifts';
import type { Facility } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

export const useDashboard = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  // Today's Assignment
  const { data: todayAssignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ['dashboard', 'todayAssignment', userId],
    queryFn: async () => {
      if (!userId) return null;

      try {
        return await getTodayAssignment.execute(userId);
      } catch (error) {
        logger.error('Error fetching today assignment:', error);
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: todayTimesheet, isLoading: loadingTimesheet } = useQuery({
    queryKey: ['dashboard', 'todayTimesheet', userId],
    queryFn: async () => {
      if (!userId) return null;

      try {
        return await timesheetService.getTodayTimesheet(userId);
      } catch (error) {
        logger.error('Error fetching today timesheet:', error);
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: recentTimesheets, isLoading: loadingTimesheets } = useQuery({
    queryKey: ['dashboard', 'recentTimesheets', userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        return await timesheetService.getRecentTimesheets(userId, 7);
      } catch (error) {
        logger.error('Error fetching recent timesheets:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: upcomingAssignments, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['dashboard', 'upcomingAssignments', userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        return await getUpcomingAssignments.execute(userId);
      } catch (error) {
        logger.error('Error fetching upcoming assignments:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: todayShiftDetails, isLoading: loadingTodayShift } = useQuery({
    queryKey: ['dashboard', 'todayShift', todayAssignment?.shiftId],
    queryFn: async () => {
      if (!todayAssignment?.shiftId) return null;

      try {
        const shift = await shiftService.getById(todayAssignment.shiftId);
        if (!shift) return null;

        let facility: Facility | null = null;
        if (shift.facilityId) {
          facility = await facilityService.getById(shift.facilityId);
        }

        return { shift, facility };
      } catch (error) {
        logger.error('Error fetching today shift details:', error);
        return null;
      }
    },
    enabled: !!todayAssignment?.shiftId,
    staleTime: 5 * 60 * 1000,
  });

  const upcomingAssignmentsKey = upcomingAssignments?.map(assignment => assignment.id) ?? [];

  const { data: upcomingAssignmentDetails = [], isLoading: loadingUpcomingDetails } = useQuery({
    queryKey: ['dashboard', 'upcomingAssignmentDetails', upcomingAssignmentsKey],
    queryFn: async () => {
      if (!upcomingAssignments || upcomingAssignments.length === 0) {
        return [];
      }

      try {
        const details = await Promise.all(
          upcomingAssignments.map(async assignment => {
            if (!assignment.shiftId) {
              return { assignment, shift: null as Shift | null, facility: null as Facility | null };
            }

            const shift = await shiftService.getById(assignment.shiftId);
            if (!shift) {
              return { assignment, shift: null as Shift | null, facility: null as Facility | null };
            }

            const facility = shift.facilityId ? await facilityService.getById(shift.facilityId) : null;

            return { assignment, shift, facility };
          })
        );

        return details;
      } catch (error) {
        logger.error('Error fetching upcoming assignment details:', error);
        return [];
      }
    },
    enabled: !!userId && !!upcomingAssignments && upcomingAssignments.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Add break mutation
  const addBreakMutation = useMutation({
    mutationFn: async ({ timesheetId, duration, reason }: { timesheetId: string; duration: number; reason?: string }) => {
      return await timesheetService.addBreak(timesheetId, { duration, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Calculate KPIs
  const kpis = {
    todayHours: todayTimesheet?.totalHours || 0,
    weekHours:
      (recentTimesheets || [])
        .filter(ts => {
          if (!ts || !ts.date) return false;
          const weekAgo = subDays(new Date(), 7);
          const tsDate = ts.date instanceof Date ? ts.date : new Date(ts.date);
          return tsDate >= weekAgo;
        })
        .reduce((sum, ts) => sum + (ts?.totalHours || 0), 0),
    monthHours: (recentTimesheets || []).reduce((sum, ts) => sum + (ts?.totalHours || 0), 0),
  };

  const isLoading =
    loadingAssignment ||
    loadingTimesheet ||
    loadingTimesheets ||
    loadingUpcoming ||
    loadingTodayShift ||
    loadingUpcomingDetails;

  return {
    user,
    todayAssignment,
    todayTimesheet,
    upcomingAssignments,
    todayShift: todayShiftDetails?.shift ?? null,
    todayFacility: todayShiftDetails?.facility ?? null,
    upcomingAssignmentDetails,
    kpis,
    isLoading,
    addBreak: addBreakMutation.mutateAsync,
    isAddingBreak: addBreakMutation.isPending,
  };
};
