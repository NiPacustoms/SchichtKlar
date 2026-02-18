import { useQuery } from '@tanstack/react-query';
import { Timesheet } from '@/lib/types';
import type { Assignment } from '@/lib/services/assignments';
import { userService } from '@/lib/services/users';
import { timesheetService } from '@/lib/services/timesheets';
import { assignmentService } from '@/lib/services/assignments';
import { documentService } from '@/lib/services/documents';
import { logger } from '@/lib/utils/logger';

export const useEmployeeDetails = (employeeId: string) => {
  // Mitarbeiter-Daten abrufen
  const {
    data: employee,
    isLoading: isLoadingEmployee,
    error: employeeError,
  } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => userService.getById(employeeId),
    enabled: !!employeeId,
  });

  // Timesheets abrufen
  const {
    data: timesheets = [],
    isLoading: isLoadingTimesheets,
    error: timesheetsError,
  } = useQuery<Timesheet[]>({
    queryKey: ['employeeTimesheets', employeeId],
    queryFn: async () => {
      try {
        return await timesheetService.getByUserId(employeeId);
      } catch (error) {
        logger.error('Error fetching timesheets:', error);
        return [];
      }
    },
    enabled: !!employeeId,
  });

  // Assignments abrufen
  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    error: assignmentsError,
  } = useQuery<Assignment[]>({
    queryKey: ['employeeAssignments', employeeId, employee?.companyId],
    queryFn: async () => {
      try {
        return await assignmentService.getByUserId(employeeId, employee?.companyId || undefined);
      } catch (error) {
        logger.error('Error fetching assignments:', error);
        return [];
      }
    },
    enabled: !!employeeId,
  });

  // Dokumente abrufen
  const {
    data: documents = [],
    isLoading: isLoadingDocuments,
    error: documentsError,
  } = useQuery({
    queryKey: ['employeeDocuments', employeeId],
    queryFn: async () => {
      try {
        return await documentService.getByUserId(employeeId);
      } catch (error) {
        logger.error('Error fetching documents:', error);
        return [];
      }
    },
    enabled: !!employeeId,
  });

  // Statistiken berechnen
  const getStatistics = () => {
    const assignmentsArray: Assignment[] = assignments ?? [];
    if (!timesheets.length && !assignmentsArray.length) {
      return {
        totalHours: 0,
        totalShifts: 0,
        averageHoursPerShift: 0,
        totalSurcharge: 0,
        nightHours: 0,
        weekendHours: 0,
        holidayHours: 0,
        overtimeHours: 0,
        lastActive: null,
        availabilityRate: 0,
      };
    }

    const totalHours = timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
    const totalShifts = assignmentsArray.filter((a: Assignment) => a.status === 'accepted' || a.status === 'completed').length;
    const averageHoursPerShift = totalShifts > 0 ? totalHours / totalShifts : 0;
    const totalSurcharge = timesheets.reduce((sum, ts) => sum + (ts.surchargeAmount || 0), 0);
    const nightHours = timesheets.reduce((sum, ts) => sum + (ts.nightHours || 0), 0);
    const weekendHours = timesheets.reduce((sum, ts) => sum + (ts.weekendHours || 0), 0);
    const holidayHours = timesheets.reduce((sum, ts) => sum + (ts.holidayHours || 0), 0);
    const overtimeHours = timesheets.reduce((sum, ts) => {
      if ('overtimeHours' in ts && typeof (ts as { overtimeHours?: unknown }).overtimeHours === 'number') {
        return sum + ((ts as { overtimeHours?: number }).overtimeHours ?? 0);
      }
      return sum;
    }, 0);
    
    const lastActive = timesheets.length > 0 
      ? new Date(Math.max(...timesheets.map(ts => new Date(ts.startDate).getTime())))
      : null;

    const acceptedAssignments = assignmentsArray.filter((a: Assignment) => a.status === 'accepted').length;
    const totalAssignments = assignmentsArray.length;
    const availabilityRate = totalAssignments > 0 ? (acceptedAssignments / totalAssignments) * 100 : 0;

    return {
      totalHours,
      totalShifts,
      averageHoursPerShift,
      totalSurcharge,
      nightHours,
      weekendHours,
      holidayHours,
      overtimeHours,
      lastActive,
      availabilityRate,
    };
  };

  // Dokumente nach Status gruppieren
  const getDocumentsByStatus = () => {
    const valid = documents.filter(doc => doc.status === 'valid');
    const expiring = documents.filter(doc => doc.status === 'expiring');
    const expired = documents.filter(doc => doc.status === 'expired');
    const missing = documents.filter(doc => doc.status === 'missing');

    return { valid, expiring, expired, missing };
  };

  // Timesheets nach Monat gruppieren
  const getTimesheetsByMonth = () => {
    const grouped: { [key: string]: Timesheet[] } = {};
    
    timesheets.forEach(timesheet => {
      const date = new Date(timesheet.startDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(timesheet);
    });

    return grouped;
  };

  // Assignments nach Status gruppieren
  const getAssignmentsByStatus = () => {
    const assignmentsArray: Assignment[] = assignments ?? [];
    const pending = assignmentsArray.filter((a: Assignment) => a.status === 'pending');
    const accepted = assignmentsArray.filter((a: Assignment) => a.status === 'accepted');
    const declined = assignmentsArray.filter((a: Assignment) => a.status === 'declined');
    const completed = assignmentsArray.filter((a: Assignment) => a.status === 'completed');

    return { pending, accepted, declined, completed };
  };

  // Format Datum
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format Zeit
  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format DateTime
  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status-Farben
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'success';
      case 'expiring':
        return 'warning';
      case 'expired':
        return 'error';
      case 'missing':
        return 'default';
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'declined':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  // Status-Labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Gültig';
      case 'expiring':
        return 'Läuft ab';
      case 'expired':
        return 'Abgelaufen';
      case 'missing':
        return 'Fehlt';
      case 'pending':
        return 'Ausstehend';
      case 'accepted':
        return 'Angenommen';
      case 'declined':
        return 'Abgelehnt';
      case 'completed':
        return 'Abgeschlossen';
      default:
        return 'Unbekannt';
    }
  };

  return {
    // Data
    employee,
    timesheets,
    assignments,
    documents,
    
    // Loading states
    isLoading: isLoadingEmployee || isLoadingTimesheets || isLoadingAssignments || isLoadingDocuments,
    isLoadingEmployee,
    isLoadingTimesheets,
    isLoadingAssignments,
    isLoadingDocuments,
    
    // Errors
    error: employeeError || timesheetsError || assignmentsError || documentsError,
    employeeError,
    timesheetsError,
    assignmentsError,
    documentsError,
    
    // Computed data
    statistics: getStatistics(),
    documentsByStatus: getDocumentsByStatus(),
    timesheetsByMonth: getTimesheetsByMonth(),
    assignmentsByStatus: getAssignmentsByStatus(),
    
    // Helper functions
    formatDate,
    formatTime,
    formatDateTime,
    getStatusColor,
    getStatusLabel,
  };
};
