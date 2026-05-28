import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockUser = { id: 'user-1' };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const getByUserIdTimesheets = vi.fn();
const getByUserIdTimes = vi.fn();

vi.mock('@/lib/services/timesheets', () => ({
  timesheetService: {
    getByUserId: (...args: unknown[]) => getByUserIdTimesheets(...args),
  },
}));

vi.mock('@/lib/services/times', () => ({
  timesService: {
    getByUserId: (...args: unknown[]) => getByUserIdTimes(...args),
  },
}));

const generateTimeAccountReport = vi.fn();
const exportTimeAccountReportPDF = vi.fn();
const exportTimeAccountReportExcel = vi.fn();
const exportSurchargeReportPDF = vi.fn();
const exportSurchargeReportExcel = vi.fn();
const generateSurchargeReport = vi.fn();

vi.mock('@/lib/services/reports', () => ({
  reportService: {
    generateTimeAccountReport: (...args: unknown[]) => generateTimeAccountReport(...args),
    generateSurchargeReport: (...args: unknown[]) => generateSurchargeReport(...args),
    exportTimeAccountReportPDF: (...args: unknown[]) => exportTimeAccountReportPDF(...args),
    exportTimeAccountReportExcel: (...args: unknown[]) => exportTimeAccountReportExcel(...args),
    exportSurchargeReportPDF: (...args: unknown[]) => exportSurchargeReportPDF(...args),
    exportSurchargeReportExcel: (...args: unknown[]) => exportSurchargeReportExcel(...args),
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastInfo = vi.fn();

vi.mock('@/lib/utils/toast', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: (...args: unknown[]) => toastInfo(...args),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { useEmployeeReports } from '../useEmployeeReports';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useEmployeeReports', () => {
  beforeEach(() => {
    getByUserIdTimesheets.mockReset();
    getByUserIdTimes.mockReset();
    generateTimeAccountReport.mockReset();
    exportTimeAccountReportPDF.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
    toastInfo.mockReset();
  });

  it('aggregiert Arbeitszeiten korrekt via getTotalHours()', async () => {
    getByUserIdTimesheets.mockResolvedValue([
      { id: 'ts-1', userId: mockUser.id, totalHours: 8, overtimeHours: 2, date: new Date('2025-01-01') },
      { id: 'ts-2', userId: mockUser.id, totalHours: 6, overtimeHours: 0, date: new Date('2025-01-02') },
    ]);
    getByUserIdTimes.mockResolvedValue([]);

    const { result } = renderHook(() => useEmployeeReports(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // getTotalHours() summiert alle totalHours aus den geladenen Timesheets
    expect(result.current.getTotalHours()).toBeCloseTo(14);
    expect(result.current.timesheets).toHaveLength(2);
  });

  it('berechnet Überstunden via getOvertimeHours()', async () => {
    getByUserIdTimesheets.mockResolvedValue([
      // 10h an einem Tag → 2h tägl. Überstunden
      { id: 'ts-1', userId: mockUser.id, totalHours: 10, date: new Date('2025-01-06') },
    ]);
    getByUserIdTimes.mockResolvedValue([]);

    const { result } = renderHook(() => useEmployeeReports(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.getOvertimeHours()).toBeGreaterThan(0);
  });

  it('exportWorkTimeReport zeigt Toast statt direktem PDF-Aufruf', async () => {
    getByUserIdTimesheets.mockResolvedValue([
      { id: 'ts-1', userId: mockUser.id, totalHours: 8, date: new Date('2025-01-01') },
    ]);
    getByUserIdTimes.mockResolvedValue([]);

    const { result } = renderHook(() => useEmployeeReports(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.exportWorkTimeReport('pdf');

    // Hook zeigt Toast-Info statt direktem PDF-Export aufzurufen
    expect(toastInfo).toHaveBeenCalledTimes(1);
  });
});
