import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Minimal Auth- und Service-Mocks – nur Infrastruktur, keine Fake-DB
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
const generateSurchargeReport = vi.fn();
const exportTimeAccountReportPDF = vi.fn();
const exportTimeAccountReportExcel = vi.fn();
const exportSurchargeReportPDF = vi.fn();
const exportSurchargeReportExcel = vi.fn();

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

const loggerError = vi.fn();

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: (...args: unknown[]) => loggerError(...args),
  },
}));

// vacationDaysCalculation wird intern benutzt – wir wollen echtes Verhalten,
// daher kein Mock, sondern echter Import
import { useEmployeeReports } from '../useEmployeeReports';

function createWrapper() {
  const queryClient = new QueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useEmployeeReports', () => {
  beforeEach(() => {
    getByUserIdTimesheets.mockReset();
    getByUserIdTimes.mockReset();
    generateTimeAccountReport.mockReset();
    generateSurchargeReport.mockReset();
    exportTimeAccountReportPDF.mockReset();
    exportTimeAccountReportExcel.mockReset();
    exportSurchargeReportPDF.mockReset();
    exportSurchargeReportExcel.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
    toastInfo.mockReset();
    loggerError.mockReset();
  });

  it('aggregiert Arbeitszeiten korrekt in workTimeReport', async () => {
    getByUserIdTimesheets.mockResolvedValue([
      {
        id: 'ts-1',
        userId: mockUser.id,
        totalHours: 8,
        overtimeHours: 2,
        date: new Date('2025-01-01'),
      },
      {
        id: 'ts-2',
        userId: mockUser.id,
        totalHours: 6,
        overtimeHours: 0,
        date: new Date('2025-01-02'),
      },
    ]);

    getByUserIdTimes.mockResolvedValue([]);

    const { result } = renderHook(() => useEmployeeReports(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const report = result.current.workTimeReport;

    expect(report.totalHours).toBeCloseTo(14);
    expect(report.overtimeHours).toBeCloseTo(2);
    expect(report.regularHours).toBeCloseTo(12);
    expect(report.workingDays).toBe(2);
    expect(report.arbzgCompliance.isCompliant).toBe(true);
  });

  it('berechnet Zuschlags-Report aus surchargeAmount und Stundenverteilung', async () => {
    getByUserIdTimesheets.mockResolvedValue([
      {
        id: 'ts-1',
        userId: mockUser.id,
        totalHours: 8,
        surchargeAmount: 40,
        nightHours: 2,
        weekendHours: 1,
        holidayHours: 0,
        overtimeHours: 1,
        date: new Date('2025-01-01'),
      },
    ]);

    getByUserIdTimes.mockResolvedValue([]);

    const { result } = renderHook(() => useEmployeeReports(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const surcharges = result.current.surchargesReport;

    expect(surcharges.totalSurcharge).toBeCloseTo(40);
    // Summe der aufgeteilten Zuschläge sollte ungefähr dem Gesamtbetrag entsprechen
    const sumByType =
      surcharges.nightSurcharge +
      surcharges.weekendSurcharge +
      surcharges.holidaySurcharge +
      surcharges.overtimeSurcharge;
    expect(sumByType).toBeGreaterThan(0);
    expect(sumByType).toBeCloseTo(40, 5);
  });

  it('exportiert Arbeitszeit-Report als PDF über reportService', async () => {
    getByUserIdTimesheets.mockResolvedValue([
      {
        id: 'ts-1',
        userId: mockUser.id,
        totalHours: 8,
        overtimeHours: 0,
        date: new Date('2025-01-01'),
      },
    ]);
    getByUserIdTimes.mockResolvedValue([]);

    const { result } = renderHook(
      () =>
        // Filters leer lassen – Hook soll selbst sinnvolle Defaults bestimmen
        useEmployeeReports(),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.exportWorkTimeReport('pdf');

    expect(exportTimeAccountReportPDF).toHaveBeenCalledTimes(1);
    const [dataArg, filtersArg] = exportTimeAccountReportPDF.mock.calls[0]!;
    expect((dataArg as { reportId: string }).reportId).toBe('employee-worktime');
    expect((filtersArg as { startDate: Date; endDate: Date }).startDate).toBeInstanceOf(Date);
    expect((filtersArg as { startDate: Date; endDate: Date }).endDate).toBeInstanceOf(Date);
  });
});

