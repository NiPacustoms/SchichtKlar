/**
 * Core Types - Foundation Types for JobFlow Application
 * 
 * These are the core domain types that form the foundation of the application.
 * They should be imported and extended by feature-specific types.
 */

/**
 * Customer Interface
 * Represents a customer/client that the company provides services to
 */
export interface Customer {
  id: string;
  name: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  type: 'individual' | 'business';
  status: 'active' | 'inactive';
  contactEmail: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt?: Date;
  // Optional fields for business customers
  taxId?: string;
  vatId?: string;
  billingAddress?: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
}

/**
 * Employee Interface (alias for User in core domain)
 * Represents an employee/staff member
 * Note: This extends the User type from index.ts for consistency
 */
/** Status für Wochenstunden-Limit (ArbZG/MiLoG) */
export type EmployeeWeeklyLimitStatus = 'normal' | 'warning' | 'blocked';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  qualifications: string[];
  availability: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
  /** Admin setzt: 40, 48, 60 (20–80h) */
  wochenstundenLimit?: number;
  /** Live Mo–So Summe aus Timesheets */
  aktuelleWochenstunden?: number;
  /** Auto-Calc aus Limit + aktuelleWochenstunden */
  limitStatus?: EmployeeWeeklyLimitStatus;
}

/**
 * Core Assignment Interface
 * Simplified assignment structure for core domain operations
 * Note: The full Assignment type in index.ts has more fields for advanced features
 */
export interface CoreAssignment {
  id: string;
  customerId: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  pauseMinutes?: number;
  status: 'geplant' | 'bestätigt' | 'abgelehnt' | 'beendet' | 'unterschrieben';
  notes?: string;
  signatures: Signature[];
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Signature Interface
 * Represents a digital signature on an assignment or document
 */
export interface Signature {
  signedBy: string; // User ID or name
  signatureData: string; // Base64 encoded signature image or signature hash
  signedAt: Date;
  // Optional metadata
  signerName?: string;
  signerRole?: string;
  signatureType?: 'employee' | 'admin' | 'customer' | 'facility';
  ipAddress?: string; // For audit purposes
  userAgent?: string; // For audit purposes
}

/**
 * OfflineData Interface
 * Represents data that needs to be synced when connection is restored
 * Used for offline-first functionality
 */
export interface OfflineData {
  id: string;
  type: 'assignment' | 'timeEntry' | 'signature' | 'timesheet' | 'sick' | 'break';
  action: 'create' | 'update' | 'delete'; // CRUD operation type
  data: Record<string, unknown>; // The actual data to sync
  timestamp: Date; // When the action was performed
  retries?: number; // Number of sync attempts
  lastError?: string; // Last error message if sync failed
  // Optional metadata
  userId?: string; // User who performed the action
  priority?: 'low' | 'medium' | 'high'; // Sync priority
}

/**
 * OfflineQueueItem (extends OfflineData for backward compatibility)
 * Used by OfflineQueueService
 */
export interface OfflineQueueItem extends OfflineData {
  retries: number; // Required for queue items
}

