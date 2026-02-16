import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/services/users';
import { User, UserUpdateForm } from '@/lib/types';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const useProfile = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  // Get user profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      return await userService.getById(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserUpdateForm>) => {
      if (!userId) throw new Error('No user ID');
      await userService.update(userId, data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      if (!auth) throw new Error('Firebase Auth not initialized');
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No user logged in');
      }

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      try {
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        return true;
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === 'auth/wrong-password'
        ) {
          throw new Error('Aktuelles Passwort ist falsch');
        }
        throw new Error('Fehler beim Ändern des Passworts');
      }
    },
    onSuccess: () => {
      // Password updated successfully
    },
  });

  // Update notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (settings: User['notificationSettings']) => {
      if (!userId) throw new Error('No user ID');
      await userService.update(userId, { notificationSettings: settings });
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const getUserStats = () => {
    if (!profile) return null;

    const totalDocuments = Array.isArray(profile.documents) ? profile.documents.length : 0;
    
    return {
      totalDocuments,
      validDocuments: 0,
      expiringDocuments: 0,
      expiredDocuments: 0,
      qualifications: profile.qualifications?.length || 0,
    };
  };

  // Get qualification color
  const getQualificationColor = (qualification: string) => {
    const colors = {
      Intensivpflege: '#FF5722',
      'OP-Pflege': '#2196F3',
      Notfallmedizin: '#F44336',
      Pädiatrie: '#4CAF50',
      Geriatrie: '#9C27B0',
      Onkologie: '#FF9800',
      Psychiatrie: '#607D8B',
      Sonstiges: '#795548',
    };
    return colors[qualification as keyof typeof colors] || '#666';
  };

  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    // Simple German phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('49')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    return phone;
  };

  // Validate email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone
  const validatePhone = (phone: string) => {
    const phoneRegex = /^(\+49|0)[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutateAsync,
    updatePassword: updatePasswordMutation.mutateAsync,
    updateNotificationSettings: updateNotificationSettingsMutation.mutateAsync,
    updateProfileMutation,
    updatePasswordMutation,
    updateNotificationSettingsMutation,
    getUserStats,
    getQualificationColor,
    formatPhoneNumber,
    validateEmail,
    validatePhone,
  };
};
