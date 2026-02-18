import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Assignment } from '@/lib/types/assignment';
import { assignmentService } from '@/lib/services/assignments';
import { listAllAssignments } from '@/src/composition';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/utils/toast';
import { cloudFunctions } from '@/lib/services/cloudFunctions';

interface AssignmentFilters {
  status?: string;
  userId?: string;
  shiftId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const useAssignments = (filters?: AssignmentFilters) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Alle Assignments abrufen
  const {
    data: assignments = [],
    isLoading,
    error,
    refetch
  } = useQuery<Assignment[]>({
    queryKey: ['assignments', filters],
    queryFn: async () => {
      const result = await listAllAssignments.execute({ page: 1, limit: 500 });
      return result.data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });

  // Assignments nach Status filtern
  const getAssignmentsByStatus = (status: string) => 
    assignments.filter(assignment => assignment.status === status);

  const getPendingAssignments = () => 
    assignments.filter(assignment => assignment.status === 'pending');

  const getAcceptedAssignments = () => 
    assignments.filter(assignment => assignment.status === 'accepted');

  const getDeclinedAssignments = () => 
    assignments.filter(assignment => assignment.status === 'declined');

  const getCompletedAssignments = () => 
    assignments.filter(assignment => assignment.status === 'completed');

  // Assignment akzeptieren
  const acceptAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => 
      assignmentService.accept(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Einsatz erfolgreich angenommen');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message) : 'Unbekannter Fehler';
      toast.error('Fehler beim Annehmen des Einsatzes: ' + message);
    },
  });

  // Assignment ablehnen (Admin-initiated oder generisch)
  const declineAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await cloudFunctions.declineAssignment({
        assignmentId,
        declineType: 'admin-initiated',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Einsatz abgelehnt');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message) : 'Unbekannter Fehler';
      toast.error('Fehler beim Ablehnen des Einsatzes: ' + message);
    },
  });

  // Assignment bearbeiten
  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assignment> }) => 
      assignmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Einsatz erfolgreich aktualisiert');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message) : 'Unbekannter Fehler';
      toast.error('Fehler beim Aktualisieren: ' + message);
    },
  });

  // Assignment löschen
  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => 
      assignmentService.delete(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Einsatz erfolgreich gelöscht');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message) : 'Unbekannter Fehler';
      toast.error('Fehler beim Löschen: ' + message);
    },
  });

  // Actions
  const acceptAssignment = (assignmentId: string) => {
    acceptAssignmentMutation.mutate(assignmentId);
  };

  const declineAssignment = (assignmentId: string) => {
    declineAssignmentMutation.mutate(assignmentId);
  };

  const updateAssignment = (id: string, data: Partial<Assignment>) => {
    updateAssignmentMutation.mutate({ id, data });
  };

  const deleteAssignment = (assignmentId: string) => {
    if (window.confirm('Möchten Sie diesen Einsatz wirklich löschen?')) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

  // Status-Farben
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
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  // Status-Labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ausstehend';
      case 'accepted':
        return 'Angenommen';
      case 'declined':
        return 'Abgelehnt';
      case 'completed':
        return 'Abgeschlossen';
      case 'cancelled':
        return 'Storniert';
      default:
        return 'Unbekannt';
    }
  };

  // Priority-Farben
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Priority-Labels
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Dringend';
      case 'high':
        return 'Hoch';
      case 'medium':
        return 'Mittel';
      case 'low':
        return 'Niedrig';
      default:
        return 'Unbekannt';
    }
  };

  // Format Datum
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format Zeit
  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format DateTime
  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Statistiken
  const getStats = () => {
    return {
      total: assignments.length,
      pending: getPendingAssignments().length,
      accepted: getAcceptedAssignments().length,
      declined: getDeclinedAssignments().length,
      completed: getCompletedAssignments().length,
    };
  };

  return {
    // Data
    assignments,
    pendingAssignments: getPendingAssignments(),
    acceptedAssignments: getAcceptedAssignments(),
    declinedAssignments: getDeclinedAssignments(),
    completedAssignments: getCompletedAssignments(),
    
    // Loading states
    isLoading,
    
    // Error
    error,
    
    // Mutations
    acceptAssignment,
    declineAssignment,
    updateAssignment,
    deleteAssignment,
    
    // Mutation states
    isAccepting: acceptAssignmentMutation.isPending,
    isDeclining: declineAssignmentMutation.isPending,
    isUpdating: updateAssignmentMutation.isPending,
    isDeleting: deleteAssignmentMutation.isPending,
    
    // Helper functions
    getAssignmentsByStatus,
    getStatusColor,
    getStatusLabel,
    getPriorityColor,
    getPriorityLabel,
    formatDate,
    formatTime,
    formatDateTime,
    getStats,
    
    // Actions
    refetch,
  };
};
