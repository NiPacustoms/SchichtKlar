'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService, cloudFunctions, shiftService } from '@/lib/services';
import { Shift, ShiftFilters } from '@/lib/services/shifts';
import { toast } from '@/lib/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { getShiftDisplayStatus } from '@/lib/utils/shiftStatus';
import { errorHandler as _errorHandler } from '@/lib/errors';
import { logger as _logger } from '@/lib/logging';

interface ShiftStats {
  total: number;
  open: number;
  filled: number;
  cancelled: number;
  assignedCount: number;
  totalCapacity: number;
}

type ShiftCreateInput = Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>;

export function useShifts(filters: ShiftFilters = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Füge companyId zu den Filtern hinzu, wenn verfügbar
  const filtersWithCompanyId = {
    ...filters,
    companyId: filters.companyId || user?.companyId || undefined,
  };

  // Fetch shifts
  const {
    data: shifts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Shift[]>({
    queryKey: ['shifts', filtersWithCompanyId],
    queryFn: () => shiftService.getAll(filtersWithCompanyId),
    enabled: !!filtersWithCompanyId.companyId, // Query nur ausführen, wenn companyId vorhanden ist
  });

  // Create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: (data: ShiftCreateInput) => shiftService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success('Schicht erfolgreich erstellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen der Schicht: ' + error.message);
    },
  });

  // Update shift mutation
  const updateShiftMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Shift> }) =>
      shiftService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success('Schicht erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren der Schicht: ' + error.message);
    },
  });

  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: (id: string) => shiftService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success('Schicht erfolgreich gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen der Schicht: ' + error.message);
    },
  });

  // Assign shift mutation via Cloud Function
  const assignShiftMutation = useMutation({
    mutationFn: ({ shiftId, userId }: { shiftId: string; userId: string }) =>
      cloudFunctions.assignShiftToUser(shiftId, userId, false, true), // Admins können Konflikte überschreiben
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success(result.message || 'Mitarbeiter erfolgreich zugewiesen');
    },
    onError: (error) => {
      toast.error('Fehler beim Zuweisen: ' + error.message);
    },
  });

  // Unassign shift mutation via Cloud Function
  const unassignShiftMutation = useMutation({
    mutationFn: async ({ shiftId, userId }: { shiftId: string; userId: string }) => {
      const assignments = await assignmentService.getByShiftId(shiftId);
      const targetAssignment = assignments.find(assignment =>
        assignment.userId === userId && ['assigned', 'accepted', 'requested'].includes(assignment.status)
      );

      if (!targetAssignment) {
        throw new Error('Keine aktive Zuweisung gefunden');
      }

      return cloudFunctions.unassignUser(targetAssignment.id, 'Zuweisung entfernt');
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success(result.message || 'Zuweisung erfolgreich entfernt');
    },
    onError: (error) => {
      toast.error('Fehler beim Entfernen der Zuweisung: ' + error.message);
    },
  });

  // Calculate statistics (Beendet = Schichtdatum+Endzeit vergangen)
  const getShiftStats = (): ShiftStats => {
    const shiftsArray: Shift[] = Array.isArray(shifts) ? shifts : [];
    const total = shiftsArray.length;
    const open = shiftsArray.filter((s: Shift) => getShiftDisplayStatus(s) === 'open').length;
    const filled = shiftsArray.filter((s: Shift) => getShiftDisplayStatus(s) === 'filled').length;
    const cancelled = shiftsArray.filter((s: Shift) => s.status === 'cancelled').length;
    const assignedCount = shiftsArray.reduce((sum, s) => sum + (s.assignedCount || 0), 0);
    const totalCapacity = shiftsArray.reduce((sum, s) => sum + (s.capacity || 1), 0);

    return {
      total,
      open,
      filled,
      cancelled,
      assignedCount,
      totalCapacity,
    };
  };

  // Helper functions
  const createShift = async (data: ShiftCreateInput) => {
    return createShiftMutation.mutateAsync(data);
  };

  const updateShift = async (id: string, data: Partial<Shift>) => {
    return updateShiftMutation.mutateAsync({ id, data });
  };

  const deleteShift = async (id: string) => {
    return deleteShiftMutation.mutateAsync(id);
  };

  const assignShift = async (shiftId: string, userId: string) => {
    return assignShiftMutation.mutateAsync({ shiftId, userId });
  };

  const unassignShift = async (shiftId: string, userId: string) => {
    return unassignShiftMutation.mutateAsync({ shiftId, userId });
  };

  return {
    shifts,
    isLoading,
    error,
    createShift,
    updateShift,
    deleteShift,
    assignShift,
    unassignShift,
    getShiftStats,
    refetch,
    isCreating: createShiftMutation.isPending,
    isUpdating: updateShiftMutation.isPending,
    isDeleting: deleteShiftMutation.isPending,
    isAssigning: assignShiftMutation.isPending,
    isUnassigning: unassignShiftMutation.isPending,
  };
}
