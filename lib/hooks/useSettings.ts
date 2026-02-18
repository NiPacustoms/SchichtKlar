'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/lib/services/settings';
import { toast } from '@/lib/utils/toast';

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  validityPeriod: number; // in days
  required: boolean;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'notification' | 'reminder' | 'welcome' | 'password_reset';
  active: boolean;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  defaultLanguage: string;
  timezone: string;
}

export interface SecuritySettings {
  sessionTimeout: number;
  require2FA: boolean;
  passwordComplexity: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  reminderEnabled: boolean;
  alertEnabled: boolean;
}

export interface EmailSettings {
  smtpServer: string;
  port: number;
  useTLS: boolean;
  username: string;
  fromAddress: string;
  fromName: string;
}

export interface Settings {
  system: SystemSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  email: EmailSettings;
  userRoles: UserRole[];
  documentTypes: DocumentType[];
  emailTemplates: EmailTemplate[];
}

export function useSettings() {
  const queryClient = useQueryClient();

  // Get all settings
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getAll(),
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: ({ section, data }: { section: string; data: unknown }) =>
      settingsService.updateSection(section, data as Partial<SystemSettings | SecuritySettings | NotificationSettings | EmailSettings>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Einstellungen erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren: ' + error.message);
    },
  });

  // Create user role mutation
  const createUserRoleMutation = useMutation({
    mutationFn: (data: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>) =>
      settingsService.createUserRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Benutzerrolle erfolgreich erstellt');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Erstellen der Rolle: ' + error.message);
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserRole> }) =>
      settingsService.updateUserRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Benutzerrolle erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren der Rolle: ' + error.message);
    },
  });

  // Delete user role mutation
  const deleteUserRoleMutation = useMutation({
    mutationFn: (id: string) => settingsService.deleteUserRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Benutzerrolle erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Löschen der Rolle: ' + error.message);
    },
  });

  // Create document type mutation
  const createDocumentTypeMutation = useMutation({
    mutationFn: (data: Omit<DocumentType, 'id' | 'createdAt' | 'updatedAt'>) =>
      settingsService.createDocumentType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Dokumenttyp erfolgreich erstellt');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Erstellen des Dokumenttyps: ' + error.message);
    },
  });

  // Update document type mutation
  const updateDocumentTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DocumentType> }) =>
      settingsService.updateDocumentType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Dokumenttyp erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren des Dokumenttyps: ' + error.message);
    },
  });

  // Delete document type mutation
  const deleteDocumentTypeMutation = useMutation({
    mutationFn: (id: string) => settingsService.deleteDocumentType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Dokumenttyp erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Löschen des Dokumenttyps: ' + error.message);
    },
  });

  // Create email template mutation
  const createEmailTemplateMutation = useMutation({
    mutationFn: (data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) =>
      settingsService.createEmailTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('E-Mail-Template erfolgreich erstellt');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Erstellen des Templates: ' + error.message);
    },
  });

  // Update email template mutation
  const updateEmailTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailTemplate> }) =>
      settingsService.updateEmailTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('E-Mail-Template erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren des Templates: ' + error.message);
    },
  });

  // Delete email template mutation
  const deleteEmailTemplateMutation = useMutation({
    mutationFn: (id: string) => settingsService.deleteEmailTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('E-Mail-Template erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Löschen des Templates: ' + error.message);
    },
  });

  // Export settings mutation
  const exportSettingsMutation = useMutation({
    mutationFn: () => settingsService.exportSettings(),
    onSuccess: (blob) => {
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Einstellungen erfolgreich exportiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Export: ' + error.message);
    },
  });

  // Import settings mutation
  const importSettingsMutation = useMutation({
    mutationFn: (file: File) => settingsService.importSettings(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Einstellungen erfolgreich importiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Import: ' + error.message);
    },
  });

  // Helper functions
  const updateSettings = (section: string, data: unknown) => {
    return updateSettingsMutation.mutateAsync({ section, data });
  };

  const createUserRole = async (data: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createUserRoleMutation.mutateAsync(data);
  };

  const updateUserRole = async (id: string, data: Partial<UserRole>) => {
    return updateUserRoleMutation.mutateAsync({ id, data });
  };

  const deleteUserRole = async (id: string) => {
    return deleteUserRoleMutation.mutateAsync(id);
  };

  const createDocumentType = async (data: Omit<DocumentType, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createDocumentTypeMutation.mutateAsync(data);
  };

  const updateDocumentType = async (id: string, data: Partial<DocumentType>) => {
    return updateDocumentTypeMutation.mutateAsync({ id, data });
  };

  const deleteDocumentType = async (id: string) => {
    return deleteDocumentTypeMutation.mutateAsync(id);
  };

  const createEmailTemplate = async (data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createEmailTemplateMutation.mutateAsync(data);
  };

  const updateEmailTemplate = async (id: string, data: Partial<EmailTemplate>) => {
    return updateEmailTemplateMutation.mutateAsync({ id, data });
  };

  const deleteEmailTemplate = async (id: string) => {
    return deleteEmailTemplateMutation.mutateAsync(id);
  };

  const exportSettings = async () => {
    return exportSettingsMutation.mutateAsync();
  };

  const importSettings = async (file: File) => {
    return importSettingsMutation.mutateAsync(file);
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    createUserRole,
    updateUserRole,
    deleteUserRole,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    exportSettings,
    importSettings,
    refetch,
    isUpdating: updateSettingsMutation.isPending,
    isCreating: createUserRoleMutation.isPending || createDocumentTypeMutation.isPending || createEmailTemplateMutation.isPending,
    isDeleting: deleteUserRoleMutation.isPending || deleteDocumentTypeMutation.isPending || deleteEmailTemplateMutation.isPending,
  };
}