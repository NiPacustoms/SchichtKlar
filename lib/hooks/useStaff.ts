import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/services';
import { User } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/utils/toast';

export const useStaff = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Alle Mitarbeiter laden - nur für die eigene Firma
  const {
    data: staffResponse,
    isLoading: loadingStaff,
    error: staffError,
  } = useQuery({
    queryKey: ['users', 'staff', user?.companyId],
    queryFn: () => userService.getAll(1, 50, { companyId: user?.companyId }),
    enabled: !!user?.companyId, // Nur laden, wenn companyId vorhanden ist
    staleTime: 5 * 60 * 1000, // 5 Minuten
  });

  const staff = staffResponse?.data || [];

  // Mitarbeiter nach Status laden
  const {
    data: staffByStatus,
    isLoading: loadingByStatus,
  } = useQuery({
    queryKey: ['users', 'staff', 'by-status'],
    queryFn: async () => {
      const statuses: Array<NonNullable<User['currentStatus']>> = ['active', 'inactive', 'on-leave', 'sick'];
      const results = await Promise.all(
        statuses.map(status => userService.getByStatus(status))
      );
      return statuses.reduce((acc, status, index) => {
        acc[status] = results[index];
        return acc;
      }, {} as Record<NonNullable<User['currentStatus']>, User[]>);
    },
    enabled: staff.length > 0,
    staleTime: 2 * 60 * 1000, // 2 Minuten
  });

  // Mitarbeiter nach Rolle laden
  const {
    data: staffByRole,
    isLoading: loadingByRole,
  } = useQuery({
    queryKey: ['users', 'staff', 'by-role'],
    queryFn: async () => {
      const roles: User['role'][] = ['nurse', 'dispatcher', 'admin'];
      const results = await Promise.all(
        roles.map(role => userService.getByRole(role))
      );
      return roles.reduce((acc, role, index) => {
        acc[role] = results[index];
        return acc;
      }, {} as Record<User['role'], User[]>);
    },
    enabled: staff.length > 0,
    staleTime: 5 * 60 * 1000, // 5 Minuten
  });

  // Mutationen
  const createUserMutation = useMutation({
    mutationFn: (userData: Partial<User>) => userService.create(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Mitarbeiter erfolgreich erstellt!');
    },
    onError: (error: unknown) => {
      toast.error('Fehler beim Erstellen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => 
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Mitarbeiter erfolgreich aktualisiert!');
    },
    onError: (error: unknown) => {
      toast.error('Fehler beim Aktualisieren: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Mitarbeiter erfolgreich gelöscht!');
    },
    onError: (error: unknown) => {
      toast.error('Fehler beim Löschen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => 
      userService.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status erfolgreich geändert!');
    },
    onError: (error: unknown) => {
      toast.error('Fehler beim Ändern des Status: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ id, status, facilityId: _facilityId }: { id: string; status: NonNullable<User['currentStatus']>; facilityId?: string }) =>
      userService.update(id, { currentStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status erfolgreich aktualisiert!');
    },
    onError: (error: unknown) => {
      toast.error('Fehler beim Aktualisieren des Status: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    },
  });


  // Statistiken berechnen
  const stats = {
    total: staff.length,
    active: staff.filter(user => user.active).length,
    inactive: staff.filter(user => !user.active).length,
    nurses: staff.filter(user => user.role === 'nurse').length,
    dispatchers: staff.filter(user => user.role === 'dispatcher').length,
    admins: staff.filter(user => user.role === 'admin').length,
    byStatus: staffByStatus || {},
    byRole: staffByRole || {},
    avgQualifications: staff.length > 0 ? 
      (staff.reduce((acc, user) => acc + (user.qualifications?.length || 0), 0) / staff.length).toFixed(1) : '0',
  };

  // Handler-Funktionen
  const createUser = (userData: Partial<User>) => {
    createUserMutation.mutate(userData);
  };

  const updateUser = (id: string, data: Partial<User>) => {
    updateUserMutation.mutate({ id, data });
  };

  const deleteUser = (id: string) => {
    if (window.confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const toggleUserStatus = (id: string, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ id, active: !currentStatus });
  };

  const updateUserStatus = (id: string, status: NonNullable<User['currentStatus']>, facilityId?: string) => {
    updateUserStatusMutation.mutate({ id, status, facilityId });
  };


  return {
    // Daten
    staff,
    staffByStatus,
    staffByRole,
    stats,
    
    // Loading States
    loadingStaff,
    loadingByStatus,
    loadingByRole,
    
    // Errors
    staffError,
    
    // Mutation States
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isTogglingStatus: toggleUserStatusMutation.isPending,
    isUpdatingStatus: updateUserStatusMutation.isPending,
    
    // Actions
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    updateUserStatus,
  };
};
