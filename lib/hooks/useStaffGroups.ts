import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/utils/logger';
import { staffGroupService } from '@/lib/services/staffGroups';
import type { StaffGroup, StaffGroupData } from '@/lib/types/staffGroup';

// Echter useAuth - kein Mock mehr
import { useAuth as useAuthReal } from '@/contexts/AuthContext';
const useAuth = useAuthReal;

type StaffGroupCreateForm = StaffGroupData;
type StaffGroupUpdateForm = Partial<StaffGroupData>;

// Stub-Toast (verwendet Logger für bessere Performance)
const toast = {
  success: (message: string) => logger.info('Success:', message),
  error: (message: string) => logger.error('Error:', message),
  info: (message: string) => logger.info('Info:', message),
  warning: (message: string) => logger.warn('Warning:', message)
};

export const useStaffGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Alle Gruppen laden
  const {
    data: groupsResponse,
    isLoading: loadingGroups,
    error: groupsError,
  } = useQuery<StaffGroup[]>({
    queryKey: ['staffGroups'],
    queryFn: () => staffGroupService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 Minuten
  });

  const groups: StaffGroup[] = Array.isArray(groupsResponse) ? groupsResponse : [];

  // Gruppen laden, in denen der aktuelle User Mitglied ist
  const {
    data: myGroups,
    isLoading: loadingMyGroups,
  } = useQuery<StaffGroup[]>({
    queryKey: ['staffGroups', 'my', user?.id],
    queryFn: () => staffGroupService.getGroupsForUser(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 Minuten
  });

  // Mutationen
  const createGroupMutation = useMutation({
    mutationFn: (groupData: StaffGroupCreateForm) => 
      staffGroupService.create(groupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffGroups'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Gruppe erfolgreich erstellt!');
    },
    onError: (error: unknown) => {
      toast.error('Fehler beim Erstellen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffGroupUpdateForm }) => 
      staffGroupService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffGroups'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Gruppe erfolgreich aktualisiert!');
    },
    onError: (error: unknown) => {
      toast.error('Fehler beim Aktualisieren: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => staffGroupService.delete(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffGroups'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Gruppe erfolgreich gelöscht!');
    },
    onError: (error: unknown) => {
      toast.error('Fehler beim Löschen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) => 
      staffGroupService.addMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffGroups'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Mitglied erfolgreich hinzugefügt!');
    },
    onError: (error: unknown) => {
      toast.error('Fehler beim Hinzufügen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) => 
      staffGroupService.removeMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffGroups'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Mitglied erfolgreich entfernt!');
    },
    onError: (error: unknown) => {
      toast.error('Fehler beim Entfernen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    },
  });

  // Statistiken berechnen
  const myGroupsList: StaffGroup[] = myGroups ?? [];

  const totalMembers = groups.reduce((acc, group) => acc + (group.members?.length ?? 0), 0);
  const colorDistribution = groups.reduce<Record<string, number>>((acc, group) => {
    const key = group.color ?? 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const stats = {
    total: groups.length,
    myGroups: myGroupsList.length,
    totalMembers,
    avgMembersPerGroup: groups.length > 0 ? (totalMembers / groups.length).toFixed(1) : '0',
    colorDistribution,
  };

  // Handler-Funktionen
  const createGroup = (groupData: StaffGroupCreateForm) => {
    createGroupMutation.mutate(groupData);
  };

  const updateGroup = (id: string, data: StaffGroupUpdateForm) => {
    updateGroupMutation.mutate({ id, data });
  };

  const deleteGroup = (groupId: string) => {
    if (window.confirm('Möchten Sie diese Gruppe wirklich löschen?')) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const addMember = (groupId: string, userId: string) => {
    addMemberMutation.mutate({ groupId, userId });
  };

  const removeMember = (groupId: string, userId: string) => {
    removeMemberMutation.mutate({ groupId, userId });
  };

  return {
    // Daten
    groups,
    myGroups: myGroupsList,
    stats,
    
    // Loading States
    loadingGroups,
    loadingMyGroups,
    
    // Errors
    groupsError,
    
    // Mutation States
    isCreating: createGroupMutation.isPending,
    isUpdating: updateGroupMutation.isPending,
    isDeleting: deleteGroupMutation.isPending,
    isAddingMember: addMemberMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
    
    // Actions
    createGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
  };
};
