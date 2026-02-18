'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/lib/services/settingsService';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { FeatureFlags, DEFAULT_FEATURE_FLAGS, FeatureFlagName } from '@/lib/types/featureFlags';

/**
 * Hook zum Abrufen und Verwenden von Feature-Flags
 * 
 * Features werden aus den System-Settings geladen und können
 * von Admins in den Einstellungen aktiviert/deaktiviert werden.
 * 
 * @example
 * ```tsx
 * const { canAccessAssignments, isLoading } = useFeatureFlags();
 * 
 * if (canAccessAssignments) {
 *   return <Assignments />;
 * }
 * ```
 */
export function useFeatureFlags() {
  const { user } = useAuth();
  const { canAccessAdminArea } = usePermissions();
  const isAdmin = canAccessAdminArea;
  const isEmployee = user?.role === 'nurse';

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: () => settingsService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 Minuten Cache
    retry: false, // Keine Retries bei Permission-Fehlern
    // Fallback auf Defaults bei Fehlern
    placeholderData: () => {
      const defaultSettings = {
        id: 'main',
        features: DEFAULT_FEATURE_FLAGS,
      };
      return defaultSettings as any;
    },
  });

  // Verwende Settings-Features oder Fallback auf Defaults
  const features: FeatureFlags = settings?.features || DEFAULT_FEATURE_FLAGS;

  /**
   * Prüft, ob ein Feature aktiviert ist
   * 
   * @param featureName - Name des Features
   * @returns true wenn Feature aktiviert ist, sonst false
   */
  const isFeatureEnabled = (featureName: FeatureFlagName): boolean => {
    return features[featureName] ?? false;
  };

  // Admin Features
  const adminFeatures = {
    reports: isFeatureEnabled('enableReports'),
    assignments: isFeatureEnabled('enableAssignments'),
    auditLogs: isFeatureEnabled('enableAuditLogs'),
    templates: isFeatureEnabled('enableTemplates'),
  };

  // Employee Features
  const employeeFeatures = {
    documents: isFeatureEnabled('enableEmployeeDocuments'),
    reports: isFeatureEnabled('enableEmployeeReports'),
    assignments: isFeatureEnabled('enableEmployeeAssignments'),
    facilities: isFeatureEnabled('enableEmployeeFacilities'),
    notifications: isFeatureEnabled('enableEmployeeNotifications'),
    vacation: isFeatureEnabled('enableEmployeeVacation'),
  };

  // Rollenbasierte Feature-Checks
  const canAccessAdminReports = isAdmin && adminFeatures.reports;
  const canAccessAssignments = isAdmin && adminFeatures.assignments;
  const canAccessAuditLogs = isAdmin && adminFeatures.auditLogs;
  const canAccessTemplates = isAdmin && adminFeatures.templates;

  const canAccessEmployeeDocuments = isEmployee && employeeFeatures.documents;
  const canAccessEmployeeReports = isEmployee && employeeFeatures.reports;
  const canAccessEmployeeAssignments = isEmployee && employeeFeatures.assignments;
  const canAccessEmployeeFacilities = isEmployee && employeeFeatures.facilities;
  const canAccessEmployeeNotifications = isEmployee && employeeFeatures.notifications;
  const canAccessEmployeeVacation = isEmployee && employeeFeatures.vacation;

  return {
    // Feature-Objekte
    adminFeatures,
    employeeFeatures,
    features,
    
    // Helper-Funktion
    isFeatureEnabled,
    
    // Admin Feature-Checks
    canAccessAdminReports,
    canAccessAssignments,
    canAccessAuditLogs,
    canAccessTemplates,
    
    // Employee Feature-Checks
    canAccessEmployeeDocuments,
    canAccessEmployeeReports,
    canAccessEmployeeAssignments,
    canAccessEmployeeFacilities,
    canAccessEmployeeNotifications,
    canAccessEmployeeVacation,

    // Loading & Error States
    isLoading,
    error,
  };
}

