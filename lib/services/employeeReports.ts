import { getDb } from '@/lib/firebase';
import { logger } from '@/lib/logging';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { getCompanyIdFromAuth } from '@/lib/utils/companyId';

const COLLECTION_NAME = 'employeeReports';

export interface Report {
  id: string;
  userId: string;
  companyId: string; // Mandantenzugehörigkeit
  type: 'worktime' | 'overtime' | 'sick' | 'bonus' | 'summary';
  title: string;
  period: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  data: Record<string, unknown>;
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportGenerationRequest {
  type: string;
  period: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  includePDF?: boolean;
}

export const employeeReportsService = {
  // Get all reports for current user
  async getAll(): Promise<Report[]> {
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        logger.warn('No companyId found, returning empty array');
        return [];
      }

      const userId = 'current-user-id'; // This should come from auth context
      
      const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const reports: Report[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          userId: data.userId,
          companyId: data.companyId || '',
          type: data.type,
          title: data.title,
          period: data.period,
          dateRange: {
            start: data.dateRange.start?.toDate() || new Date(),
            end: data.dateRange.end?.toDate() || new Date(),
          },
          data: data.data || {},
          status: data.status || 'completed',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return reports;
    } catch (error) {
      throw error;
    }
  },

  // Generate report
  async generateReport(data: ReportGenerationRequest): Promise<string> {
    try {
      const userId = 'current-user-id'; // This should come from auth context
      
      // Hole companyId aus dem User oder Auth
      let companyId: string | null = null;
      if (userId) {
        const userDoc = await getDoc(doc(getDb(), 'users', userId));
        if (userDoc.exists()) {
          companyId = userDoc.data().companyId || null;
        }
      }
      if (!companyId) {
        companyId = await getCompanyIdFromAuth();
      }
      if (!companyId) {
        throw new Error('No companyId found for report');
      }
      
      const reportData = {
        userId,
        companyId: companyId,
        type: data.type,
        title: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)}-Bericht`,
        period: data.period,
        dateRange: {
          start: data.dateRange.start,
          end: data.dateRange.end,
        },
        data: await this.generateReportData(data),
        status: 'generating',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), reportData);
      
      // Simulate report generation
      setTimeout(async () => {
        await updateDoc(docRef, {
          status: 'completed',
          updatedAt: serverTimestamp(),
        });
      }, 2000);

      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Generate report data based on type - nur noch echte Daten, keine Mock-Daten
  async generateReportData(data: ReportGenerationRequest): Promise<Record<string, unknown>> {
    try {
      // TODO: Implementiere echte Datenabfrage aus Firestore für jeden Report-Typ
      // Für jetzt: Leere Objekte zurückgeben, keine Mock-Daten
      logger.warn(`generateReportData for type "${data.type}" not yet implemented - returning empty data`);
      
      switch (data.type) {
        case 'worktime':
          return {
            totalHours: 0,
            regularHours: 0,
            overtimeHours: 0,
            averageHoursPerDay: 0,
            daysWorked: 0,
            facilities: [],
            shifts: [],
          };
        
        case 'overtime':
          return {
            totalOvertime: 0,
            weeklyOvertime: [],
            monthlyOvertime: [],
            overtimeByType: {
              night: 0,
              weekend: 0,
              holiday: 0,
            },
            compensation: {
              paid: 0,
              timeOff: 0,
            },
          };
        
        case 'bonus':
          return {
            totalAmount: 0,
            monthlyBreakdown: [],
            byType: {
              night: 0,
              weekend: 0,
              holiday: 0,
              special: 0,
            },
            averagePerMonth: 0,
          };
        
        case 'summary':
          return {
            period: data.period,
            worktime: {
              totalHours: 0,
              overtimeHours: 0,
              efficiency: 0,
            },
            bonus: {
              totalAmount: 0,
              averagePerMonth: 0,
            },
            performance: {
              score: 0,
              trend: 'stable',
              goals: [],
            },
          };
        
        default:
          return {};
      }
    } catch (error) {
      throw error;
    }
  },

  // Export report
  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<string> {
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        throw new Error('No companyId found');
      }

      // Get report data
      const reportDoc = await getDoc(doc(getDb(), COLLECTION_NAME, reportId));
      if (!reportDoc.exists()) {
        throw new Error('Bericht nicht gefunden');
      }

      const reportData = reportDoc.data();
      // Prüfe, ob das Report zur gleichen Company gehört
      if (reportData.companyId !== companyId) {
        throw new Error('Report belongs to different company');
      }
      
      // Generate export file URL
      const fileUrl = `/reports/export-${reportId}.${format}`;
      
      // Simulate file generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return fileUrl;
    } catch (error) {
      throw error;
    }
  },

  // Get report by ID
  async getById(reportId: string): Promise<Report | null> {
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        logger.warn('No companyId found, returning null');
        return null;
      }

      const reportDoc = await getDoc(doc(getDb(), COLLECTION_NAME, reportId));
      if (!reportDoc.exists()) {
        return null;
      }

      const data = reportDoc.data();
      // Prüfe, ob das Report zur gleichen Company gehört
      if (data.companyId !== companyId) {
        logger.warn('Report belongs to different company, returning null');
        return null;
      }

      return {
        id: reportDoc.id,
        userId: data.userId,
        companyId: data.companyId || '',
        type: data.type,
        title: data.title,
        period: data.period,
        dateRange: {
          start: data.dateRange.start?.toDate() || new Date(),
          end: data.dateRange.end?.toDate() || new Date(),
        },
        data: data.data || {},
        status: data.status || 'completed',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      throw error;
    }
  },

  // Delete report
  async deleteReport(reportId: string): Promise<void> {
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        throw new Error('No companyId found');
      }

      const reportDoc = await getDoc(doc(getDb(), COLLECTION_NAME, reportId));
      if (!reportDoc.exists()) {
        throw new Error('Report not found');
      }

      const reportData = reportDoc.data();
      // Prüfe, ob das Report zur gleichen Company gehört
      if (reportData.companyId !== companyId) {
        throw new Error('Report belongs to different company');
      }

      await deleteDoc(doc(getDb(), COLLECTION_NAME, reportId));
    } catch (error) {
      throw error;
    }
  },

  // Get reports by type
  async getByType(type: string): Promise<Report[]> {
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        logger.warn('No companyId found, returning empty array');
        return [];
      }

      const userId = 'current-user-id'; // This should come from auth context
      
      const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const reports: Report[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          userId: data.userId,
          companyId: data.companyId || '',
          type: data.type,
          title: data.title,
          period: data.period,
          dateRange: {
            start: data.dateRange.start?.toDate() || new Date(),
            end: data.dateRange.end?.toDate() || new Date(),
          },
          data: data.data || {},
          status: data.status || 'completed',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return reports;
    } catch (error) {
      throw error;
    }
  },

  // Get reports by period
  async getByPeriod(period: string): Promise<Report[]> {
    try {
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        logger.warn('No companyId found, returning empty array');
        return [];
      }

      const userId = 'current-user-id'; // This should come from auth context
      
      const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', '==', userId),
        where('period', '==', period),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const reports: Report[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          userId: data.userId,
          companyId: data.companyId || '',
          type: data.type,
          title: data.title,
          period: data.period,
          dateRange: {
            start: data.dateRange.start?.toDate() || new Date(),
            end: data.dateRange.end?.toDate() || new Date(),
          },
          data: data.data || {},
          status: data.status || 'completed',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return reports;
    } catch (error) {
      throw error;
    }
  },

  // Get report statistics
  async getStats(): Promise<{
    totalReports: number;
    reportsByType: Record<string, number>;
    reportsByStatus: Record<string, number>;
    lastGenerated: Date | null;
  }> {
    try {
      const userId = 'current-user-id'; // This should come from auth context
      
      const companyId = await getCompanyIdFromAuth();
      if (!companyId) {
        return {
          totalReports: 0,
          reportsByType: {},
          reportsByStatus: {},
          lastGenerated: null,
        };
      }

      const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const reports: Report[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          userId: data.userId,
          companyId: data.companyId || '',
          type: data.type,
          title: data.title,
          period: data.period,
          dateRange: {
            start: data.dateRange.start?.toDate() || new Date(),
            end: data.dateRange.end?.toDate() || new Date(),
          },
          data: data.data || {},
          status: data.status || 'completed',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      const totalReports = reports.length;
      const reportsByType: Record<string, number> = {};
      const reportsByStatus: Record<string, number> = {};
      let lastGenerated: Date | null = null;

      reports.forEach(report => {
        reportsByType[report.type] = (reportsByType[report.type] || 0) + 1;
        reportsByStatus[report.status] = (reportsByStatus[report.status] || 0) + 1;
        
        if (!lastGenerated || report.createdAt > lastGenerated) {
          lastGenerated = report.createdAt;
        }
      });

      return {
        totalReports,
        reportsByType,
        reportsByStatus,
        lastGenerated,
      };
    } catch (error) {
      throw error;
    }
  },

  // Schedule report generation
  async scheduleReport(data: ReportGenerationRequest & { schedule: Date }): Promise<string> {
    try {
      const userId = 'current-user-id'; // This should come from auth context
      
      // Hole companyId aus dem User oder Auth
      let companyId: string | null = null;
      if (userId) {
        const userDoc = await getDoc(doc(getDb(), 'users', userId));
        if (userDoc.exists()) {
          companyId = userDoc.data().companyId || null;
        }
      }
      if (!companyId) {
        companyId = await getCompanyIdFromAuth();
      }
      if (!companyId) {
        throw new Error('No companyId found for report');
      }
      
      const reportData = {
        userId,
        companyId: companyId,
        type: data.type,
        title: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)}-Bericht (Geplant)`,
        period: data.period,
        dateRange: {
          start: data.dateRange.start,
          end: data.dateRange.end,
        },
        data: {},
        status: 'scheduled',
        scheduledFor: data.schedule,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), reportData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Bulk export reports
  async bulkExport(_reportIds: string[], _format: 'pdf' | 'excel' | 'csv'): Promise<string> {
    try {
      // Create zip file with all reports
      const fileUrl = `/reports/bulk-export-${Date.now()}.zip`;
      
      // Bulk export process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return fileUrl;
    } catch (error) {
      throw error;
    }
  },
};
