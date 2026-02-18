import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Facility } from '@/lib/types';
import type { Assignment } from '@/lib/services/assignments';
import { Shift } from '@/lib/services/shifts';
import { facilityService } from '@/lib/services/facilities';
import { shiftService } from '@/lib/services/shifts';
import { assignmentService } from '@/lib/services/assignments';
import { userService } from '@/lib/services/users';
import { logger } from '@/lib/utils/logger';

export const useFacilityDetails = (facilityId: string) => {
  const queryClient = useQueryClient();

  // Get facility data
  const {
    data: facility,
    isLoading: isLoadingFacility,
    error: facilityError,
  } = useQuery<Facility | null>({
    queryKey: ['facility', facilityId],
    queryFn: async () => {
      try {
        return await facilityService.getById(facilityId);
      } catch (error) {
        logger.error('Error fetching facility:', error);
        return null;
      }
    },
    enabled: !!facilityId,
  });

  // Get facility shifts
  const {
    data: shifts = [],
    isLoading: isLoadingShifts,
    error: shiftsError,
  } = useQuery({
    queryKey: ['facilityShifts', facilityId],
    queryFn: async (): Promise<Shift[]> => {
      try {
        return await shiftService.getAll({ facilityId: facilityId });
      } catch (error) {
        logger.error('Error fetching shifts:', error);
        return [];
      }
    },
    enabled: !!facilityId,
  });

  // Get facility assignments
  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    error: assignmentsError,
  } = useQuery<Assignment[]>({
    queryKey: ['facilityAssignments', facilityId],
    queryFn: async () => {
      try {
        const allShifts = await shiftService.getByFacility(facilityId);
        const assignmentPromises = allShifts.map(shift => 
          assignmentService.getByShiftId(shift.id)
        );
        const assignmentArrays = await Promise.all(assignmentPromises);
        return assignmentArrays.flat();
      } catch (error) {
        logger.error('Error fetching assignments:', error);
        return [];
      }
    },
    enabled: !!facilityId,
  });

  // Get assigned users
  const {
    data: assignedUsers = [],
    isLoading: isLoadingUsers,
  } = useQuery<User[]>({
    queryKey: ['facilityUsers', facilityId],
    queryFn: async () => {
      try {
        const assignmentsArray: Assignment[] = assignments ?? [];
        const userIds = Array.from(new Set(assignmentsArray.map((a: Assignment) => a.userId)));
        const userPromises = userIds.map(id => userService.getById(id));
        const users = await Promise.all(userPromises);
        return users.filter(u => u !== null) as User[];
      } catch (error) {
        logger.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: !!facilityId && (assignments?.length ?? 0) > 0,
  });

  // Mutations
  const updateFacilityMutation = useMutation({
    mutationFn: async (data: Partial<Facility>) => {
      if (!facilityId) throw new Error('No facility ID');
      return await facilityService.update(facilityId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility', facilityId] });
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
  });

  const deleteFacilityMutation = useMutation({
    mutationFn: async () => {
      if (!facilityId) throw new Error('No facility ID');
      return await facilityService.delete(facilityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
  });

  const createShiftMutation = useMutation({
    mutationFn: async (
      data: Omit<Shift, 'id' | 'createdAt' | 'updatedAt' | 'facilityId'>
    ) => {
      return await shiftService.create({ ...data, facilityId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilityShifts', facilityId] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Shift> }) => {
      return await shiftService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilityShifts', facilityId] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      return await shiftService.delete(shiftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilityShifts', facilityId] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async ({ userId, shiftId, notes }: { userId: string; shiftId: string; notes?: string }) => {
      return await assignmentService.create(userId, shiftId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilityAssignments', facilityId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Assignment> }) => {
      return await assignmentService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilityAssignments', facilityId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await assignmentService.delete(assignmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilityAssignments', facilityId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  // Statistics
  const getStatistics = () => {
    const shiftsArray = shifts as Shift[];
    const assignmentsArray: Assignment[] = assignments ?? [];
    if (!shiftsArray || shiftsArray.length === 0) {
      return {
        totalShifts: 0,
        openShifts: 0,
        filledShifts: 0,
        cancelledShifts: 0,
        totalAssignments: 0,
        acceptedAssignments: 0,
        pendingAssignments: 0,
        declinedAssignments: 0,
        utilizationRate: 0,
        averageStaffPerShift: 0,
      };
    }

    const totalShifts = shiftsArray.length;
    const openShifts = shiftsArray.filter(s => s.status === 'open').length;
    const filledShifts = shiftsArray.filter(s => s.status === 'filled').length;
    const cancelledShifts = shiftsArray.filter(s => s.status === 'cancelled').length;
    
    const totalAssignments = assignmentsArray.length;
    const acceptedAssignments = assignmentsArray.filter((a: Assignment) => a.status === 'accepted').length;
    const pendingAssignments = assignmentsArray.filter((a: Assignment) => a.status === 'pending').length;
    const declinedAssignments = assignmentsArray.filter((a: Assignment) => a.status === 'declined').length;

    const utilizationRate = totalShifts > 0 ? (filledShifts / totalShifts) * 100 : 0;
    const averageStaffPerShift = totalShifts > 0 ? totalAssignments / totalShifts : 0;

    return {
      totalShifts,
      openShifts,
      filledShifts,
      cancelledShifts,
      totalAssignments,
      acceptedAssignments,
      pendingAssignments,
      declinedAssignments,
      utilizationRate: Math.round(utilizationRate),
      averageStaffPerShift: Math.round(averageStaffPerShift * 10) / 10,
    };
  };

  // Group shifts by status
  const getShiftsByStatus = () => {
    const shiftsArray = shifts as Shift[];
    const open = shiftsArray.filter(s => s.status === 'open');
    const filled = shiftsArray.filter(s => s.status === 'filled');
    const cancelled = shiftsArray.filter(s => s.status === 'cancelled');

    return { open, filled, cancelled };
  };

  // Group assignments by status
  const getAssignmentsByStatus = () => {
    const assignmentsArray: Assignment[] = assignments ?? [];
    const pending = assignmentsArray.filter((a: Assignment) => a.status === 'pending');
    const accepted = assignmentsArray.filter((a: Assignment) => a.status === 'accepted');
    const declined = assignmentsArray.filter((a: Assignment) => a.status === 'declined');
    const completed = assignmentsArray.filter((a: Assignment) => a.status === 'completed');

    return { pending, accepted, declined, completed };
  };

  // Get upcoming shifts
  const getUpcomingShifts = () => {
    const shiftsArray = shifts as Shift[];
    const now = new Date();
    return shiftsArray
      .filter(s => new Date(s.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Get past shifts
  const getPastShifts = () => {
    const shiftsArray = shifts as Shift[];
    const now = new Date();
    return shiftsArray
      .filter(s => new Date(s.date) < now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const isLoading = 
    isLoadingFacility || 
    isLoadingShifts || 
    isLoadingAssignments || 
    isLoadingUsers;

  const error = facilityError || shiftsError || assignmentsError;

  return {
    // Data
    facility,
    shifts,
    assignments,
    assignedUsers,

    // Loading states
    isLoading,
    isLoadingFacility,
    isLoadingShifts,
    isLoadingAssignments,
    isLoadingUsers,

    // Errors
    error,
    facilityError,
    shiftsError,
    assignmentsError,

    // Mutations
    updateFacility: updateFacilityMutation.mutateAsync,
    deleteFacility: deleteFacilityMutation.mutateAsync,
    createShift: createShiftMutation.mutateAsync,
    updateShift: updateShiftMutation.mutateAsync,
    deleteShift: deleteShiftMutation.mutateAsync,
    createAssignment: createAssignmentMutation.mutateAsync,
    updateAssignment: updateAssignmentMutation.mutateAsync,
    deleteAssignment: deleteAssignmentMutation.mutateAsync,

    // Computed data
    statistics: getStatistics(),
    shiftsByStatus: getShiftsByStatus(),
    assignmentsByStatus: getAssignmentsByStatus(),
    upcomingShifts: getUpcomingShifts(),
    pastShifts: getPastShifts(),
  };
};
