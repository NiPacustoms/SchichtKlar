import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useRealtimeUpdates } from '../useRealtimeUpdates';

const invalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: (...args: unknown[]) => invalidateQueries(...args),
  }),
}));

const loggerDebug = vi.fn();
const loggerWarn = vi.fn();
const loggerError = vi.fn();

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: (...args: unknown[]) => loggerDebug(...args),
    warn: (...args: unknown[]) => loggerWarn(...args),
    error: (...args: unknown[]) => loggerError(...args),
  },
}));

let currentUser: { id: string; companyId?: string } | null = null;

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}));

const onSnapshotMock = vi.fn();

vi.mock('firebase/firestore', () => {
  const collection = vi.fn();
  const query = vi.fn();
  const where = vi.fn();

  return {
    collection,
    query,
    where,
    onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  };
});

vi.mock('@/lib/firebase', () => ({
  db: {}, // als „initialisiert“ behandeln
}));

describe('useRealtimeUpdates', () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    loggerDebug.mockReset();
    loggerWarn.mockReset();
    loggerError.mockReset();
    onSnapshotMock.mockReset();
    currentUser = null;
  });

  it('registriert keine Listener, wenn kein User vorhanden ist', async () => {
    currentUser = null;

    const { result } = renderHook(() => useRealtimeUpdates());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    expect(onSnapshotMock).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it('setzt Listener für Assignments und Notifications und invalidiert Queries bei Updates', async () => {
    currentUser = { id: 'user-1', companyId: 'company-1' };

    const unsubShifts = vi.fn();
    const unsubTimesheets = vi.fn();
    const unsubAssignments = vi.fn();
    const unsubNotifications = vi.fn();

    // onSnapshot wird im Hook viermal aufgerufen: Shifts, Timesheets, Assignments, Notifications
    onSnapshotMock
      .mockImplementationOnce((_q, onNext) => { onNext({ size: 1 }); return unsubShifts; })
      .mockImplementationOnce((_q, onNext) => { onNext({ size: 0 }); return unsubTimesheets; })
      .mockImplementationOnce((_q, onNext) => { onNext({ size: 2 }); return unsubAssignments; })
      .mockImplementationOnce((_q, onNext) => { onNext({ size: 3 }); return unsubNotifications; });

    const { result, unmount } = renderHook(() => useRealtimeUpdates());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Shifts invalidiert 'shifts' und 'admin'
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['shifts'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin'] });

    // Assignments invalidieren 'assignments' und 'dashboard'
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['assignments'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] });

    // Notifications invalidieren 'notifications'
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notifications'] });

    // Beim Unmount werden alle Listener korrekt bereinigt
    unmount();

    expect(unsubShifts).toHaveBeenCalledTimes(1);
    expect(unsubTimesheets).toHaveBeenCalledTimes(1);
    expect(unsubAssignments).toHaveBeenCalledTimes(1);
    expect(unsubNotifications).toHaveBeenCalledTimes(1);
  });
});

