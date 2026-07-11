// @vitest-environment jsdom
import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useDashboard } from '../useDashboard';

const mockUser = { id: 'user-1', companyId: 'company-1' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const getTodayAssignment = vi.fn();
const getUpcomingAssignments = vi.fn();

vi.mock('@/lib/services/assignments', () => ({
  assignmentService: {
    getTodayAssignment: (...args: unknown[]) => getTodayAssignment(...args),
    getUpcomingAssignments: (...args: unknown[]) => getUpcomingAssignments(...args),
  },
}));

const getTodayTimesheet = vi.fn();
const getRecentTimesheets = vi.fn();
const addBreak = vi.fn();

vi.mock('@/lib/services/timesheets', () => ({
  timesheetService: {
    getTodayTimesheet: (...args: unknown[]) => getTodayTimesheet(...args),
    getRecentTimesheets: (...args: unknown[]) => getRecentTimesheets(...args),
    addBreak: (...args: unknown[]) => addBreak(...args),
  },
}));

const getByIdShift = vi.fn();

vi.mock('@/lib/services/shifts', () => ({
  shiftService: {
    getById: (...args: unknown[]) => getByIdShift(...args),
  },
}));

const getByIdFacility = vi.fn();

vi.mock('@/lib/services/facilities', () => ({
  facilityService: {
    getById: (...args: unknown[]) => getByIdFacility(...args),
  },
}));

const loggerError = vi.fn();

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: (...args: unknown[]) => loggerError(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useDashboard', () => {
  beforeEach(() => {
    getTodayAssignment.mockReset();
    getUpcomingAssignments.mockReset();
    getTodayTimesheet.mockReset();
    getRecentTimesheets.mockReset();
    addBreak.mockReset();
    getByIdShift.mockReset();
    getByIdFacility.mockReset();
    loggerError.mockReset();
  });

  it('liefert heute- und Wochen-KPIs basierend auf Timesheets', async () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    getTodayAssignment.mockResolvedValue(null);
    getUpcomingAssignments.mockResolvedValue([]);

    getTodayTimesheet.mockResolvedValue({
      id: 'ts-today',
      userId: mockUser.id,
      totalHours: 8,
      date: today,
    });

    getRecentTimesheets.mockResolvedValue([
      {
        id: 'ts-today',
        userId: mockUser.id,
        totalHours: 8,
        date: today,
      },
      {
        id: 'ts-yesterday',
        userId: mockUser.id,
        totalHours: 6,
        date: yesterday,
      },
    ]);

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const { kpis } = result.current;

    expect(kpis.todayHours).toBeCloseTo(8);
    // weekHours summiert die letzten 7 Tage
    expect(kpis.weekHours).toBeCloseTo(14);
    expect(kpis.monthHours).toBeCloseTo(14);
  });

  it('setzt heute-Schicht-Details inklusive Einrichtung korrekt zusammen', async () => {
    const today = new Date();

    getTodayAssignment.mockResolvedValue({
      id: 'assign-1',
      userId: mockUser.id,
      shiftId: 'shift-1',
    });

    getUpcomingAssignments.mockResolvedValue([]);

    getTodayTimesheet.mockResolvedValue(null);
    getRecentTimesheets.mockResolvedValue([]);

    getByIdShift.mockResolvedValue({
      id: 'shift-1',
      facilityId: 'facility-1',
      date: today,
    });

    getByIdFacility.mockResolvedValue({
      id: 'facility-1',
      name: 'Test-Einrichtung',
    });

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.todayShift).toEqual(
      expect.objectContaining({ id: 'shift-1', facilityId: 'facility-1' }),
    );
    expect(result.current.todayFacility).toEqual(
      expect.objectContaining({ id: 'facility-1', name: 'Test-Einrichtung' }),
    );
  });

  it('führt addBreak Mutation aus und ruft timesheetService.addBreak auf', async () => {
    getTodayAssignment.mockResolvedValue(null);
    getUpcomingAssignments.mockResolvedValue([]);
    getTodayTimesheet.mockResolvedValue(null);
    getRecentTimesheets.mockResolvedValue([]);

    addBreak.mockResolvedValue({ id: 'break-1' });

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.addBreak({ timesheetId: 'ts-1', duration: 30, reason: 'Pause' });

    expect(addBreak).toHaveBeenCalledWith('ts-1', {
      duration: 30,
      reason: 'Pause',
    });
  });
});