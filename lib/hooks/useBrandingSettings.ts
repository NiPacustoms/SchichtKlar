import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/lib/services/settingsService';
import { toast } from '@/lib/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';

export interface BrandingSettings {
  id: string;
  companyName: string;
  companyLogo?: string;
  primaryColor: string;
  secondaryColor: string;
  showLogo: boolean;
  customColors: boolean;
}

export function useBrandingSettings(currentUserId?: string) {
  const queryClient = useQueryClient();
  const { user: _user } = useAuth();
  const { canAccessAdminArea } = usePermissions();
  const isAdmin = canAccessAdminArea;

  const { data, isLoading, error } = useQuery({
    queryKey: ['brandingSettings'],
    queryFn: async () => {
      // Only try to load settings if user is admin
      // For non-admin users, return defaults immediately
      // showLogo defaults to true so logo is shown by default
      if (!isAdmin) {
        const defaults: BrandingSettings = {
          id: 'default',
          companyName: 'Schichtklar',
          companyLogo: undefined,
          primaryColor: '#4CAF50',
          secondaryColor: '#0f766e',
          showLogo: true,
          customColors: false,
        };
        return defaults;
      }

      try {
        // Prüfe, ob wir im Browser sind, bevor wir Firebase aufrufen
        if (typeof window === 'undefined') {
          // Serverseitig: Return defaults
          // showLogo defaults to true so logo is shown by default
          const defaults: BrandingSettings = {
            id: 'default',
            companyName: 'Schichtklar',
            companyLogo: undefined,
            primaryColor: '#4CAF50',
            secondaryColor: '#0f766e',
            showLogo: true,
            customColors: false,
          };
          return defaults;
        }

        const s = await settingsService.getSettings();
        const branding: BrandingSettings = {
          id: s.id,
          companyName: s.companyName,
          companyLogo: s.companyLogo,
          primaryColor: s.primaryColor,
          secondaryColor: s.secondaryColor,
          showLogo: s.showLogo,
          customColors: s.customColors,
        };
        return branding;
      } catch (_error) {
        // If settings can't be loaded (e.g., permission denied), return defaults
        // showLogo defaults to true so logo is shown by default
        const defaults: BrandingSettings = {
          id: 'default',
          companyName: 'Schichtklar',
          companyLogo: undefined,
          primaryColor: '#4CAF50',
          secondaryColor: '#0f766e',
          showLogo: true,
          customColors: false,
        };
        return defaults;
      }
    },
    retry: false, // Don't retry on permission errors
    enabled: typeof window !== 'undefined', // Only enable on client side
  });

  const updateBrandingMutation = useMutation({
    mutationFn: async (partial: Partial<BrandingSettings>) => {
      await settingsService.updateBrandingSettings(
        {
          companyName: partial.companyName,
          primaryColor: partial.primaryColor,
          secondaryColor: partial.secondaryColor,
          showLogo: partial.showLogo,
          customColors: partial.customColors,
        },
        currentUserId || 'system'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandingSettings'] });
      toast.success('Branding gespeichert');
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : 'Unbekannter Fehler';
      toast.error('Fehler beim Speichern des Brandings: ' + message);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!currentUserId) throw new Error('Kein Benutzerkontext für Upload');
      return settingsService.uploadLogo(file, currentUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandingSettings'] });
      toast.success('Logo hochgeladen');
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : 'Unbekannter Fehler';
      toast.error('Fehler beim Logo-Upload: ' + message);
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: async () => {
      await settingsService.deleteLogo(currentUserId || 'system');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandingSettings'] });
      toast.success('Logo entfernt');
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : 'Unbekannter Fehler';
      toast.error('Fehler beim Entfernen des Logos: ' + message);
    },
  });

  return {
    branding: data,
    isLoading,
    error,
    updateBranding: (partial: Partial<BrandingSettings>) => updateBrandingMutation.mutateAsync(partial),
    uploadLogo: (file: File) => uploadLogoMutation.mutateAsync(file),
    deleteLogo: () => deleteLogoMutation.mutateAsync(),
    isUpdating: updateBrandingMutation.isPending,
    isUploading: uploadLogoMutation.isPending,
    isDeleting: deleteLogoMutation.isPending,
  };
}
