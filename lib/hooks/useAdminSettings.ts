'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminSettingsService } from '@/lib/services/adminSettings';
import { toast } from '@/lib/utils/toast';
import { useAuth } from '@/contexts/AuthContext';

export interface SystemSettings {
  systemName: string;
  timezone: string;
  language: string;
  currency: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactorRequired: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  shiftReminders: boolean;
  documentExpiryWarnings: boolean;
  shiftConflictWarnings: boolean;
  systemUpdateNotifications: boolean;
  maintenanceNotifications: boolean;
  lastBackup?: Date;
  backupSize?: string;
  availableBackups?: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentType {
  id: string;
  name: string;
  category: 'personal' | 'professional' | 'legal';
  validityPeriod: number;
  required: boolean;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: 'notification' | 'reminder' | 'confirmation' | 'alert';
  subject: string;
  content: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemInfo {
  status: string;
  version: string;
  uptime: string;
  storage: string;
  memory: string;
  cpu: string;
  network: string;
}

export function useAdminSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'dispatcher';

  // Get system settings
  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminSettingsService.getSettings(),
    enabled: isAdmin, // Only fetch if user is admin/dispatcher
    retry: false, // Don't retry on permission errors
  });

  // Get roles
  const {
    data: roles = [],
    isLoading: rolesLoading,
    error: rolesError,
  } = useQuery({
    queryKey: ['adminRoles'],
    queryFn: () => adminSettingsService.getRoles(),
    enabled: isAdmin, // Only fetch if user is admin/dispatcher
    retry: false, // Don't retry on permission errors
  });

  // Get document types
  const {
    data: documentTypes = [],
    isLoading: documentTypesLoading,
    error: documentTypesError,
  } = useQuery({
    queryKey: ['adminDocumentTypes'],
    queryFn: () => adminSettingsService.getDocumentTypes(),
    enabled: isAdmin, // Only fetch if user is admin/dispatcher
    retry: false, // Don't retry on permission errors
  });

  // Get email templates
  const {
    data: emailTemplates = [],
    isLoading: emailTemplatesLoading,
    error: emailTemplatesError,
  } = useQuery({
    queryKey: ['adminEmailTemplates'],
    queryFn: () => adminSettingsService.getEmailTemplates(),
    enabled: isAdmin, // Only fetch if user is admin/dispatcher
    retry: false, // Don't retry on permission errors
  });

  // Get system info
  const {
    data: systemInfo,
    isLoading: systemInfoLoading,
    error: systemInfoError,
  } = useQuery({
    queryKey: ['adminSystemInfo'],
    queryFn: () => adminSettingsService.getSystemInfo(),
    enabled: isAdmin, // Only fetch if user is admin/dispatcher
    retry: false, // Don't retry on permission errors
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<SystemSettings>) => adminSettingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      toast.success('Einstellungen erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren der Einstellungen: ' + error.message);
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => adminSettingsService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      toast.success('Rolle erfolgreich erstellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen der Rolle: ' + error.message);
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) => adminSettingsService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      toast.success('Rolle erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren der Rolle: ' + error.message);
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => adminSettingsService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      toast.success('Rolle erfolgreich gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen der Rolle: ' + error.message);
    },
  });

  // Create document type mutation
  const createDocumentTypeMutation = useMutation({
    mutationFn: (data: Omit<DocumentType, 'id' | 'createdAt' | 'updatedAt'>) => adminSettingsService.createDocumentType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDocumentTypes'] });
      toast.success('Dokumenttyp erfolgreich erstellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen des Dokumenttyps: ' + error.message);
    },
  });

  // Update document type mutation
  const updateDocumentTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DocumentType> }) => adminSettingsService.updateDocumentType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDocumentTypes'] });
      toast.success('Dokumenttyp erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren des Dokumenttyps: ' + error.message);
    },
  });

  // Delete document type mutation
  const deleteDocumentTypeMutation = useMutation({
    mutationFn: (id: string) => adminSettingsService.deleteDocumentType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDocumentTypes'] });
      toast.success('Dokumenttyp erfolgreich gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen des Dokumenttyps: ' + error.message);
    },
  });

  // Create email template mutation
  const createEmailTemplateMutation = useMutation({
    mutationFn: (data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => adminSettingsService.createEmailTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEmailTemplates'] });
      toast.success('E-Mail-Template erfolgreich erstellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen des E-Mail-Templates: ' + error.message);
    },
  });

  // Update email template mutation
  const updateEmailTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailTemplate> }) => adminSettingsService.updateEmailTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEmailTemplates'] });
      toast.success('E-Mail-Template erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren des E-Mail-Templates: ' + error.message);
    },
  });

  // Delete email template mutation
  const deleteEmailTemplateMutation = useMutation({
    mutationFn: (id: string) => adminSettingsService.deleteEmailTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEmailTemplates'] });
      toast.success('E-Mail-Template erfolgreich gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen des E-Mail-Templates: ' + error.message);
    },
  });

  // Backup data mutation
  const backupDataMutation = useMutation({
    mutationFn: () => adminSettingsService.backupData(),
    onSuccess: (backupUrl) => {
      if (backupUrl) {
        const a = document.createElement('a');
        a.href = backupUrl;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      toast.success('Backup erfolgreich erstellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen des Backups: ' + error.message);
    },
  });

  // Restore data mutation
  const restoreDataMutation = useMutation({
    mutationFn: (file: File) => adminSettingsService.restoreData(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      queryClient.invalidateQueries({ queryKey: ['adminDocumentTypes'] });
      queryClient.invalidateQueries({ queryKey: ['adminEmailTemplates'] });
      toast.success('Daten erfolgreich wiederhergestellt');
    },
    onError: (error) => {
      toast.error('Fehler beim Wiederherstellen der Daten: ' + error.message);
    },
  });

  // Helper functions
  const updateSettings = async (data: Partial<SystemSettings>) => {
    return updateSettingsMutation.mutateAsync(data);
  };

  const createRole = async (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createRoleMutation.mutateAsync(data);
  };

  const updateRole = async (id: string, data: Partial<Role>) => {
    return updateRoleMutation.mutateAsync({ id, data });
  };

  const deleteRole = async (id: string) => {
    return deleteRoleMutation.mutateAsync(id);
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

  const backupData = async () => {
    return backupDataMutation.mutateAsync();
  };

  const restoreData = async (file: File) => {
    return restoreDataMutation.mutateAsync(file);
  };

  return {
    settings: settings || {
      systemName: 'JobFlow',
      timezone: 'Europe/Berlin',
      language: 'de',
      currency: 'EUR',
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      twoFactorRequired: false,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      shiftReminders: true,
      documentExpiryWarnings: true,
      shiftConflictWarnings: true,
      systemUpdateNotifications: true,
      maintenanceNotifications: true,
    },
    roles,
    documentTypes,
    emailTemplates,
    systemInfo: systemInfo || {
      status: 'Online',
      version: '1.0.0',
      uptime: '99.9%',
      storage: '2.5 GB',
      memory: '512 MB',
      cpu: '15%',
      network: 'Gut',
    },
    isLoading: settingsLoading || rolesLoading || documentTypesLoading || emailTemplatesLoading || systemInfoLoading,
    error: settingsError || rolesError || documentTypesError || emailTemplatesError || systemInfoError,
    updateSettings,
    createRole,
    updateRole,
    deleteRole,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    backupData,
    restoreData,
    isUpdating: updateSettingsMutation.isPending,
    isCreating: createRoleMutation.isPending || createDocumentTypeMutation.isPending || createEmailTemplateMutation.isPending,
    isDeleting: deleteRoleMutation.isPending || deleteDocumentTypeMutation.isPending || deleteEmailTemplateMutation.isPending,
    isBackingUp: backupDataMutation.isPending,
    isRestoring: restoreDataMutation.isPending,
  };
}
