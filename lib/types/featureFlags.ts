/**
 * TypeScript-Typen für Feature-Flags
 * 
 * Zentrale Definition aller verfügbaren Feature-Flags
 * für Type-Safety und bessere Entwicklererfahrung.
 */

export interface FeatureFlags {
  // Admin Features
  enableChat: boolean;
  enableReports: boolean;
  enableAssignments: boolean;
  enableAuditLogs: boolean;
  enableDocumentTypes: boolean;
  enableTemplates: boolean;
  
  // Employee Features
  enableEmployeeChat: boolean;
  enableEmployeeDocuments: boolean;
  enableEmployeeReports: boolean;
  enableEmployeeAssignments: boolean;
  enableEmployeeFacilities: boolean;
  enableEmployeeNotifications: boolean;
  enableEmployeeVacation: boolean;
}

/**
 * Standard-Feature-Flags mit konservativen Defaults.
 * Wird verwendet, wenn Settings nicht geladen werden können.
 * Kritische bzw. optionale Features (Chat) bleiben dabei deaktiviert.
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableChat: false,
  enableReports: true,
  enableAssignments: true,
  enableAuditLogs: true,
  enableDocumentTypes: true,
  enableTemplates: true,
  enableEmployeeChat: false,
  enableEmployeeDocuments: true,
  enableEmployeeReports: true,
  enableEmployeeAssignments: true,
  enableEmployeeFacilities: true,
  enableEmployeeNotifications: true,
  enableEmployeeVacation: true,
} as const;

/**
 * Feature-Flag-Namen für Type-Safety
 */
export type FeatureFlagName = keyof FeatureFlags;

/**
 * Admin Feature-Namen
 */
export type AdminFeatureName = 
  | 'enableChat'
  | 'enableReports'
  | 'enableAssignments'
  | 'enableAuditLogs'
  | 'enableDocumentTypes'
  | 'enableTemplates';

/**
 * Employee Feature-Namen
 */
export type EmployeeFeatureName =
  | 'enableEmployeeChat'
  | 'enableEmployeeDocuments'
  | 'enableEmployeeReports'
  | 'enableEmployeeAssignments'
  | 'enableEmployeeFacilities'
  | 'enableEmployeeNotifications';

