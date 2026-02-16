'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeFacilitiesService } from '@/lib/services/employeeFacilities';
import { toast } from '@/lib/utils/toast';
import { useAuth } from '@/contexts/AuthContext';

export interface EmployeeFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'nursing_home';
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  shiftSupervisor: string;
  distance: number;
  travelTime: string;
  rating: number;
  shiftCount: number;
  isFavorite: boolean;
  specialInstructions?: string;
  lastVisit?: Date;
  nextShift?: Date;
}

export interface FacilityStats {
  totalFacilities: number;
  activeFacilities: number;
  favoriteFacilities: number;
  totalShifts: number;
  averageRating: number;
  totalDistance: number;
}

export function useEmployeeFacilities() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const scope = user?.id && user?.companyId ? { userId: user.id, companyId: user.companyId } : null;
  const scopeMissingError = 'Kein Benutzerkontext verfügbar. Bitte melde dich erneut an.';

  // Get all facilities
  const {
    data: facilities = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employeeFacilities', scope?.userId, scope?.companyId],
    queryFn: () => {
      if (!scope) {
        throw new Error(scopeMissingError);
      }
      return employeeFacilitiesService.getAll(scope);
    },
    enabled: !!scope,
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: (facilityId: string) => {
      if (!scope) {
        throw new Error(scopeMissingError);
      }
      return employeeFacilitiesService.addToFavorites(scope, facilityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeFacilities', scope?.userId, scope?.companyId] });
      toast.success('Einrichtung zu Favoriten hinzugefügt');
    },
    onError: (error) => {
      toast.error('Fehler beim Hinzufügen zu Favoriten: ' + error.message);
    },
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: (facilityId: string) => {
      if (!scope) {
        throw new Error(scopeMissingError);
      }
      return employeeFacilitiesService.removeFromFavorites(scope, facilityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeFacilities', scope?.userId, scope?.companyId] });
      toast.success('Einrichtung aus Favoriten entfernt');
    },
    onError: (error) => {
      toast.error('Fehler beim Entfernen aus Favoriten: ' + error.message);
    },
  });

  // Get directions mutation
  const getDirectionsMutation = useMutation({
    mutationFn: (facilityId: string) => {
      if (!scope) {
        throw new Error(scopeMissingError);
      }
      return employeeFacilitiesService.getDirections(scope, facilityId);
    },
    onSuccess: (directions) => {
      // Open directions in new tab or show in modal
      if (directions.url) {
        window.open(directions.url, '_blank');
      }
      toast.success('Anfahrt wird geöffnet');
    },
    onError: (error) => {
      toast.error('Fehler beim Abrufen der Anfahrt: ' + error.message);
    },
  });

  // Helper functions
  const addToFavorites = async (facilityId: string) => {
    return addToFavoritesMutation.mutateAsync(facilityId);
  };

  const removeFromFavorites = async (facilityId: string) => {
    return removeFromFavoritesMutation.mutateAsync(facilityId);
  };

  const getDirections = async (facilityId: string) => {
    return getDirectionsMutation.mutateAsync(facilityId);
  };

  // Get facility statistics
  const getFacilityStats = (): FacilityStats => {
    const totalFacilities = facilities.length;
    const activeFacilities = facilities.filter(f => f.shiftCount > 0).length;
    const favoriteFacilities = facilities.filter(f => f.isFavorite).length;
    const totalShifts = facilities.reduce((sum, f) => sum + f.shiftCount, 0);
    const averageRating = facilities.length > 0 
      ? facilities.reduce((sum, f) => sum + f.rating, 0) / facilities.length 
      : 0;
    const totalDistance = facilities.reduce((sum, f) => sum + f.distance, 0);

    return {
      totalFacilities,
      activeFacilities,
      favoriteFacilities,
      totalShifts,
      averageRating: Math.round(averageRating * 10) / 10,
      totalDistance: Math.round(totalDistance * 10) / 10,
    };
  };

  return {
    facilities,
    isLoading,
    error,
    addToFavorites,
    removeFromFavorites,
    getDirections,
    getFacilityStats,
    refetch,
    isAddingToFavorites: addToFavoritesMutation.isPending,
    isRemovingFromFavorites: removeFromFavoritesMutation.isPending,
  };
}
