import type { ReactNode } from 'react';

export type DashboardKpiId =
  | 'activeAssignmentsToday'
  | 'openShifts'
  | 'pendingTimeEntries'
  | 'expiringDocuments'
  | 'totalStaff';

export interface DashboardKpi {
  id: DashboardKpiId;
  label: string;
  value: number;
  unit?: string;
  trendPercent?: number | null;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
  status?: 'good' | 'warning' | 'critical';
  link: string;
}

export interface DashboardActionItem {
  id: string;
  title: string;
  description?: string;
  severity: 'high' | 'medium' | 'low';
  link: string;
}

export interface StaffingDayOverview {
  date: string;
  status: 'ok' | 'understaffed' | 'overstaffed';
  totalShifts: number;
  unfilledShifts: number;
  criticalStations: string[];
}

export interface DashboardActivity {
  id: string;
  timestamp: string;
  category: 'assignments' | 'timesheets' | 'communication' | 'system';
  message: string;
  link?: string;
}

