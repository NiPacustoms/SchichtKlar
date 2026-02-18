import type { Timesheet as TimesheetType } from '@/lib/types';

export interface Timesheet extends TimesheetType {
  overtimeHours?: number;
  regularHours?: number;
  breaks?: Break[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface TimesheetAggregation {
  userId: string;
  totalHours: number;
  approvedHours: number;
  overtimeHours: number;
  nightHours: number;
  weekendHours: number;
  holidayHours: number;
}

export interface TimesheetRangeMetadata {
  userId?: string;
  startDate: Date;
  endDate: Date;
  approvedOnly: boolean;
}

export interface TimesheetRangeResult {
  timesheets: Timesheet[];
  aggregates: TimesheetAggregation[];
  metadata: TimesheetRangeMetadata;
}

export interface Break {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  reason?: string;
  createdAt: Date;
}

export interface TimesheetForm {
  date: Date;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  notes?: string;
  facilityId?: string;
  station?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export type FirestoreTimesheetData = {
  userId: string;
  companyId?: string;
  date?: { toDate: () => Date };
  startDate?: { toDate: () => Date };
  endDate?: { toDate: () => Date };
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  totalHours?: number;
  surchargeAmount?: number;
  nightHours?: number;
  weekendHours?: number;
  holidayHours?: number;
  overtimeHours?: number;
  regularHours?: number;
  notes?: string;
  status?: Timesheet['status'];
  submittedAt?: { toDate: () => Date };
  approvedAt?: { toDate: () => Date };
  approvedBy?: string;
  rejectionReason?: string;
  breaks?: Break[];
  facilityId?: string;
  station?: string;
  location?: { latitude: number; longitude: number; address?: string };
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
  employeeSignatureUrl?: string;
  employeeSignedAt?: { toDate: () => Date };
  facilitySignatureUrl?: string;
  facilitySignedAt?: { toDate: () => Date };
  facilitySignedBy?: string;
  facilityConfirmationStatus?: 'performed' | 'aborted' | 'no-show';
  facilitySignerName?: string;
};

export const COLLECTION_NAME = 'timesheets';
export const DEFAULT_DECIMALS = 2;
