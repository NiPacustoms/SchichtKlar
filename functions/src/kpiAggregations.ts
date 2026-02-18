import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

/** Lazy init to avoid getFirestore() at module load (reduces deploy timeout) */
function getDb() {
  return getFirestore();
}

/** Called by index.ts schedule (hourly). Exported for dynamic import. */
export async function runAggregateKPIs(): Promise<void> {
  logger.info('Starting KPI aggregation...');

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const kpis = await calculateAllKPIs(today, startOfWeek, startOfMonth);

    await storeAggregatedKPIs(kpis, now);

    await createAuditLog({
      action: 'kpi_aggregation',
      userId: 'system',
      resourceType: 'system',
      description: 'KPI-Aggregation abgeschlossen',
      metadata: {
        timestamp: now.toISOString(),
        kpis: Object.keys(kpis),
      },
    });

    logger.info('KPI aggregation completed successfully');
  } catch (error) {
    logger.error('Error during KPI aggregation:', error);

    await createAuditLog({
      action: 'kpi_aggregation_error',
      userId: 'system',
      resourceType: 'system',
      description: `Fehler bei KPI-Aggregation: ${(error as Error).message}`,
      error: (error as Error).message,
    });
  }
}

/** Called by index.ts schedule (daily). Exported for dynamic import. */
export async function runDailyKPIAggregation(): Promise<void> {
  logger.info('Starting daily KPI aggregation...');

  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfWeek = new Date(yesterday);
    startOfWeek.setDate(yesterday.getDate() - yesterday.getDay());

    const startOfMonth = new Date(yesterday.getFullYear(), yesterday.getMonth(), 1);

    const dailyKPIs = await calculateDailyKPIs(yesterday, startOfWeek, startOfMonth);

    await storeDailyKPIs(dailyKPIs, yesterday);

    logger.info('Daily KPI aggregation completed successfully');
  } catch (error) {
    logger.error('Error during daily KPI aggregation:', error);
  }
}

async function calculateAllKPIs(today: Date, startOfWeek: Date, startOfMonth: Date) {
  const kpis = {
    // Shift-related KPIs
    openShifts: await countOpenShifts(),
    assignedShifts: await countAssignedShifts(),
    completedShifts: await countCompletedShifts(today),

    // User-related KPIs
    activeNurses: await countActiveNurses(),
    totalNurses: await countTotalNurses(),
    onlineUsers: await countOnlineUsers(),

    // Time-related KPIs
    totalHoursToday: await calculateTotalHoursToday(today),
    totalHoursThisWeek: await calculateTotalHoursThisWeek(startOfWeek),
    totalHoursThisMonth: await calculateTotalHoursThisMonth(startOfMonth),

    // Document-related KPIs
    documentsExpiringSoon: await countDocumentsExpiringSoon(),
    pendingDocumentVerifications: await countPendingDocumentVerifications(),

    // Financial KPIs
    estimatedRevenueToday: await calculateEstimatedRevenueToday(today),
    estimatedRevenueThisWeek: await calculateEstimatedRevenueThisWeek(startOfWeek),
    estimatedRevenueThisMonth: await calculateEstimatedRevenueThisMonth(startOfMonth),

    // System KPIs
    totalNotifications: await countTotalNotifications(),
    unreadNotifications: await countUnreadNotifications(),
    systemErrors: await countSystemErrors(today),

    // Timestamp
    aggregatedAt: FieldValue.serverTimestamp(),
  };

  return kpis;
}

async function calculateDailyKPIs(date: Date, startOfWeek: Date, startOfMonth: Date) {
  return {
    date: date.toISOString().split('T')[0],

    // Daily metrics
    shiftsCompleted: await countCompletedShifts(date),
    hoursWorked: await calculateTotalHoursForDate(date),
    revenue: await calculateRevenueForDate(date),

    // Weekly metrics
    shiftsCompletedThisWeek: await countCompletedShiftsInPeriod(startOfWeek, date),
    hoursWorkedThisWeek: await calculateTotalHoursInPeriod(startOfWeek, date),
    revenueThisWeek: await calculateRevenueInPeriod(startOfWeek, date),

    // Monthly metrics
    shiftsCompletedThisMonth: await countCompletedShiftsInPeriod(startOfMonth, date),
    hoursWorkedThisMonth: await calculateTotalHoursInPeriod(startOfMonth, date),
    revenueThisMonth: await calculateRevenueInPeriod(startOfMonth, date),

    // User activity
    activeUsers: await countActiveUsersForDate(date),
    newRegistrations: await countNewRegistrationsForDate(date),

    // Document activity
    documentsUploaded: await countDocumentsUploadedForDate(date),
    documentsVerified: await countDocumentsVerifiedForDate(date),

    // System health
    averageResponseTime: await calculateAverageResponseTime(date),
    errorRate: await calculateErrorRate(date),
  };
}

// Shift-related functions
async function countOpenShifts(): Promise<number> {
  const db = getDb();
  const snapshot = await db.collection('shifts').where('status', '==', 'open').get();
  return snapshot.size;
}

async function countAssignedShifts(): Promise<number> {
  const db = getDb();
  const snapshot = await db.collection('shifts').where('status', '==', 'assigned').get();
  return snapshot.size;
}

async function countCompletedShifts(date: Date): Promise<number> {
  const db = getDb();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await db
    .collection('shifts')
    .where('status', '==', 'done')
    .where('date', '>=', startOfDay.toISOString().split('T')[0])
    .where('date', '<=', endOfDay.toISOString().split('T')[0])
    .get();
  return snapshot.size;
}

async function countCompletedShiftsInPeriod(startDate: Date, endDate: Date): Promise<number> {
  const db = getDb();
  const snapshot = await db
    .collection('shifts')
    .where('status', '==', 'done')
    .where('date', '>=', startDate.toISOString().split('T')[0])
    .where('date', '<=', endDate.toISOString().split('T')[0])
    .get();
  return snapshot.size;
}

// User-related functions
async function countActiveNurses(): Promise<number> {
  const db = getDb();
  const snapshot = await db
    .collection('users')
    .where('role', '==', 'nurse')
    .where('isActive', '==', true)
    .get();
  return snapshot.size;
}

async function countTotalNurses(): Promise<number> {
  const db = getDb();
  const snapshot = await db.collection('users').where('role', '==', 'nurse').get();
  return snapshot.size;
}

async function countOnlineUsers(): Promise<number> {
  const db = getDb();
  const fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

  const snapshot = await db
    .collection('users')
    .where('lastSeen', '>=', fiveMinutesAgo.toISOString())
    .get();
  return snapshot.size;
}

async function countActiveUsersForDate(date: Date): Promise<number> {
  const db = getDb();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await db
    .collection('timesheets')
    .where('startTime', '>=', startOfDay.toISOString())
    .where('startTime', '<=', endOfDay.toISOString())
    .get();

  const uniqueUsers = new Set();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.userId) {
      uniqueUsers.add(data.userId);
    }
  });

  return uniqueUsers.size;
}

async function countNewRegistrationsForDate(date: Date): Promise<number> {
  const db = getDb();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await db
    .collection('users')
    .where('createdAt', '>=', startOfDay)
    .where('createdAt', '<=', endOfDay)
    .get();
  return snapshot.size;
}

// Time-related functions
async function calculateTotalHoursToday(date: Date): Promise<number> {
  const db = getDb();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await db
    .collection('timesheets')
    .where('startTime', '>=', startOfDay.toISOString())
    .where('startTime', '<=', endOfDay.toISOString())
    .where('status', '==', 'completed')
    .get();

  let totalHours = 0;
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.totalHours) {
      totalHours += data.totalHours;
    }
  });

  return totalHours;
}

async function calculateTotalHoursThisWeek(startOfWeek: Date): Promise<number> {
  const db = getDb();
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const snapshot = await db
    .collection('timesheets')
    .where('startTime', '>=', startOfWeek.toISOString())
    .where('startTime', '<=', endOfWeek.toISOString())
    .where('status', '==', 'completed')
    .get();

  let totalHours = 0;
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.totalHours) {
      totalHours += data.totalHours;
    }
  });

  return totalHours;
}

async function calculateTotalHoursThisMonth(startOfMonth: Date): Promise<number> {
  const db = getDb();
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const snapshot = await db
    .collection('timesheets')
    .where('startTime', '>=', startOfMonth.toISOString())
    .where('startTime', '<=', endOfMonth.toISOString())
    .where('status', '==', 'completed')
    .get();

  let totalHours = 0;
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.totalHours) {
      totalHours += data.totalHours;
    }
  });

  return totalHours;
}

async function calculateTotalHoursForDate(date: Date): Promise<number> {
  return await calculateTotalHoursToday(date);
}

async function calculateTotalHoursInPeriod(startDate: Date, endDate: Date): Promise<number> {
  const db = getDb();
  const snapshot = await db
    .collection('timesheets')
    .where('startTime', '>=', startDate.toISOString())
    .where('startTime', '<=', endDate.toISOString())
    .where('status', '==', 'completed')
    .get();

  let totalHours = 0;
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.totalHours) {
      totalHours += data.totalHours;
    }
  });

  return totalHours;
}

// Document-related functions
async function countDocumentsExpiringSoon(): Promise<number> {
  const db = getDb();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const snapshot = await db
    .collection('documents')
    .where('expiryDate', '>=', new Date().toISOString())
    .where('expiryDate', '<=', thirtyDaysFromNow.toISOString())
    .get();
  return snapshot.size;
}

async function countPendingDocumentVerifications(): Promise<number> {
  const db = getDb();
  const snapshot = await db.collection('documents').where('verified', '==', false).get();
  return snapshot.size;
}

async function countDocumentsUploadedForDate(date: Date): Promise<number> {
  const db = getDb();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await db
    .collection('documents')
    .where('uploadedAt', '>=', startOfDay)
    .where('uploadedAt', '<=', endOfDay)
    .get();
  return snapshot.size;
}

async function countDocumentsVerifiedForDate(date: Date): Promise<number> {
  const db = getDb();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await db
    .collection('documents')
    .where('verifiedAt', '>=', startOfDay)
    .where('verifiedAt', '<=', endOfDay)
    .get();
  return snapshot.size;
}

// Financial functions
async function calculateEstimatedRevenueToday(date: Date): Promise<number> {
  const totalHours = await calculateTotalHoursToday(date);
  const averageHourlyRate = 25; // €25 per hour (configurable)
  return totalHours * averageHourlyRate;
}

async function calculateEstimatedRevenueThisWeek(startOfWeek: Date): Promise<number> {
  const totalHours = await calculateTotalHoursThisWeek(startOfWeek);
  const averageHourlyRate = 25;
  return totalHours * averageHourlyRate;
}

async function calculateEstimatedRevenueThisMonth(startOfMonth: Date): Promise<number> {
  const totalHours = await calculateTotalHoursThisMonth(startOfMonth);
  const averageHourlyRate = 25;
  return totalHours * averageHourlyRate;
}

async function calculateRevenueForDate(date: Date): Promise<number> {
  return await calculateEstimatedRevenueToday(date);
}

async function calculateRevenueInPeriod(startDate: Date, endDate: Date): Promise<number> {
  const totalHours = await calculateTotalHoursInPeriod(startDate, endDate);
  const averageHourlyRate = 25;
  return totalHours * averageHourlyRate;
}

// System functions
async function countTotalNotifications(): Promise<number> {
  const db = getDb();
  const snapshot = await db.collection('notifications').get();
  return snapshot.size;
}

async function countUnreadNotifications(): Promise<number> {
  const db = getDb();
  const snapshot = await db.collection('notifications').where('read', '==', false).get();
  return snapshot.size;
}

async function countSystemErrors(date: Date): Promise<number> {
  const db = getDb();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshot = await db
    .collection('auditLogs')
    .where('action', '==', 'error')
    .where('timestamp', '>=', startOfDay)
    .where('timestamp', '<=', endOfDay)
    .get();
  return snapshot.size;
}

async function calculateAverageResponseTime(date: Date): Promise<number> {
  // This would typically come from monitoring data
  // For now, return a mock value
  return 150; // 150ms average response time
}

async function calculateErrorRate(date: Date): Promise<number> {
  const totalRequests = 1000; // Mock value
  const errors = await countSystemErrors(date);
  return (errors / totalRequests) * 100;
}

// Storage functions
async function storeAggregatedKPIs(kpis: any, timestamp: Date) {
  const db = getDb();
  try {
    await db.collection('kpiAggregations').add({
      ...kpis,
      timestamp: timestamp.toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error('Error storing aggregated KPIs:', error);
  }
}

async function storeDailyKPIs(dailyKPIs: any, date: Date) {
  const db = getDb();
  try {
    await db.collection('dailyKPIs').add({
      ...dailyKPIs,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error('Error storing daily KPIs:', error);
  }
}

async function createAuditLog(logData: any) {
  const db = getDb();
  try {
    await db.collection('auditLogs').add({
      ...logData,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error('Error creating audit log:', error);
  }
}
