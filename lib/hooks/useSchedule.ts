import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, facilityService, shiftService } from '@/lib/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfWeek, format, startOfWeek } from 'date-fns';

export const useSchedule = (view: 'week' | 'month' = 'week', date?: Date) => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const targetDate = date || new Date();

  // Get user's assignments
  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['schedule', 'assignments', userId, user?.companyId],
    queryFn: async () => {
      if (!userId) return [];
      return await assignmentService.getByUserId(userId, user?.companyId || undefined);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get open shifts - nur für die eigene Firma
  const { data: openShifts, isLoading: loadingShifts } = useQuery({
    queryKey: ['schedule', 'openShifts', user?.companyId],
    queryFn: async () => {
      // getOpenShifts hat keinen companyId Filter, daher verwenden wir getAll mit Filter
      const allShifts = await shiftService.getAll({ 
        companyId: user?.companyId,
        status: 'open'
      });
      // Filtere nur zukünftige Shifts
      const now = new Date();
      return allShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= now;
      });
    },
    enabled: !!user?.companyId, // Nur laden, wenn companyId vorhanden ist
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get facilities for filtering - nur für die eigene Firma
  const { data: facilities } = useQuery({
    queryKey: ['schedule', 'facilities', user?.companyId],
    queryFn: async () => {
      return await facilityService.getAll(user?.companyId);
    },
    enabled: !!user?.companyId, // Nur laden, wenn companyId vorhanden ist
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get shifts by date range
  const { data: shiftsInRange } = useQuery({
    queryKey: ['schedule', 'shifts', format(targetDate, 'yyyy-MM-dd'), view, user?.companyId],
    queryFn: async () => {
      const startDate =
        view === 'week'
          ? startOfWeek(targetDate, { weekStartsOn: 1 }) // Monday
          : new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);

      const endDate =
        view === 'week'
          ? endOfWeek(targetDate, { weekStartsOn: 1 }) // Sunday
          : new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      return await shiftService.getByDateRange(startDate, endDate, user?.companyId || undefined);
    },
    enabled: !!user?.companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Accept assignment mutation
  const acceptAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await assignmentService.accept(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Decline assignment mutation
  const declineAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await assignmentService.decline(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Get assignments by status
  const getAssignmentsByStatus = (status: string) => {
    return assignments?.filter(assignment => assignment.status === status) || [];
  };

  // Get assignments for date range
  const getAssignmentsForDateRange = (startDate: Date, endDate: Date) => {
    return (
      assignments?.filter(assignment => {
        // This would need to be enhanced with actual shift data
        return assignment.assignedAt >= startDate && assignment.assignedAt <= endDate;
      }) || []
    );
  };

  // Check for conflicts (overlapping assignments)
  const checkConflicts = (newAssignment: { id: string; status: string }) => {
    if (!assignments) return false;

    // This would need to be enhanced with actual shift time comparison
    return assignments.some(
      assignment => assignment.status === 'accepted' && assignment.id !== newAssignment.id
    );
  };

  // Get shift type color
  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'Frühdienst':
        return '#0288D1';
      case 'Spätdienst':
        return '#2E7D32';
      case 'Nachtdienst':
        return '#7B1FA2';
      case 'On-call':
        return '#ED6C02';
      default:
        return '#666';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'declined':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const isLoading = loadingAssignments || loadingShifts;

  return {
    assignments: assignments || [],
    openShifts: openShifts || [],
    facilities: facilities || [],
    shiftsInRange: shiftsInRange || [],
    isLoading,
    acceptAssignment,
    declineAssignment,
    getAssignmentsByStatus,
    getAssignmentsForDateRange,
    checkConflicts,
    getShiftTypeColor,
    getStatusColor,
  };
};
