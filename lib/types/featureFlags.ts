/**
 * TypeScript-Typen für Feature-Flags
 * 
 * Zentrale Definition aller verfügbaren Feature-Flags
 * für Type-Safety und bessere Entwicklererfahrung.
 */

export interface FeatureFlags {
  // Admin Features
  enableReports: boolean;
  enableAssignments: boolean;
  enableAuditLogs: boolean;
  enableDocumentTypes: boolean;
  enableTemplates: boolean;
  
  // Employee Features
  enableEmployeeDocuments: boolean;
  enableEmployeeReports: boolean;
  enableEmployeeAssignments: boolean;
  enableEmployeeFacilities: boolean;
  enableEmployeeNotifications: boolean;
}

/**
 * Standard-Feature-Flags mit konservativen Defaults.
 * Wird verwendet, wenn Settings nicht geladen werden können.
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableReports: true,
  enableAssignments: true,
  enableAuditLogs: true,
  enableDocumentTypes: true,
  enableTemplates: true,
  enableEmployeeDocuments: true,
  enableEmployeeReports: true,
  enableEmployeeAssignments: true,
  enableEmployeeFacilities: true,
  enableEmployeeNotifications: true,
} as const;

/**
 * Feature-Flag-Namen für Type-Safety
 */
export type FeatureFlagName = keyof FeatureFlags;

/**
 * Admin Feature-Namen
 */
export type AdminFeatureName = 
  | 'enableReports'
  | 'enableAssignments'
  | 'enableAuditLogs'
  | 'enableDocumentTypes'
  | 'enableTemplates';

/**
 * Employee Feature-Namen
 */
export type EmployeeFeatureName =
  | 'enableEmployeeDocuments'
  | 'enableEmployeeReports'
  | 'enableEmployeeAssignments'
  | 'enableEmployeeFacilities'
  | 'enableEmployeeNotifications';

