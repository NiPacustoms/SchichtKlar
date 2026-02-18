"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAggregateKPIs = runAggregateKPIs;
exports.runDailyKPIAggregation = runDailyKPIAggregation;
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const firestore_2 = require("firebase-admin/firestore");
function getDb() {
    return (0, firestore_2.getFirestore)();
}
async function runAggregateKPIs() {
    firebase_functions_1.logger.info('Starting KPI aggregation...');
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
            metadata: { timestamp: now.toISOString(), kpis: Object.keys(kpis) },
        });
        firebase_functions_1.logger.info('KPI aggregation completed successfully');
    }
    catch (error) {
        firebase_functions_1.logger.error('Error during KPI aggregation:', error);
        await createAuditLog({
            action: 'kpi_aggregation_error',
            userId: 'system',
            resourceType: 'system',
            description: `Fehler bei KPI-Aggregation: ${error.message}`,
            error: error.message,
        });
    }
}
async function runDailyKPIAggregation() {
    firebase_functions_1.logger.info('Starting daily KPI aggregation...');
    try {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfWeek = new Date(yesterday);
        startOfWeek.setDate(yesterday.getDate() - yesterday.getDay());
        const startOfMonth = new Date(yesterday.getFullYear(), yesterday.getMonth(), 1);
        const dailyKPIs = await calculateDailyKPIs(yesterday, startOfWeek, startOfMonth);
        await storeDailyKPIs(dailyKPIs, yesterday);
        firebase_functions_1.logger.info('Daily KPI aggregation completed successfully');
    }
    catch (error) {
        firebase_functions_1.logger.error('Error during daily KPI aggregation:', error);
    }
}
async function calculateAllKPIs(today, startOfWeek, startOfMonth) {
    return {
        openShifts: await countOpenShifts(),
        assignedShifts: await countAssignedShifts(),
        completedShifts: await countCompletedShifts(today),
        activeNurses: await countActiveNurses(),
        totalNurses: await countTotalNurses(),
        onlineUsers: await countOnlineUsers(),
        totalHoursToday: await calculateTotalHoursToday(today),
        totalHoursThisWeek: await calculateTotalHoursThisWeek(startOfWeek),
        totalHoursThisMonth: await calculateTotalHoursThisMonth(startOfMonth),
        documentsExpiringSoon: await countDocumentsExpiringSoon(),
        pendingDocumentVerifications: await countPendingDocumentVerifications(),
        estimatedRevenueToday: await calculateEstimatedRevenueToday(today),
        estimatedRevenueThisWeek: await calculateEstimatedRevenueThisWeek(startOfWeek),
        estimatedRevenueThisMonth: await calculateEstimatedRevenueThisMonth(startOfMonth),
        totalNotifications: await countTotalNotifications(),
        unreadNotifications: await countUnreadNotifications(),
        systemErrors: await countSystemErrors(today),
        aggregatedAt: firestore_1.FieldValue.serverTimestamp(),
    };
}
async function calculateDailyKPIs(date, startOfWeek, startOfMonth) {
    return {
        date: date.toISOString().split('T')[0],
        shiftsCompleted: await countCompletedShifts(date),
        hoursWorked: await calculateTotalHoursForDate(date),
        revenue: await calculateRevenueForDate(date),
        shiftsCompletedThisWeek: await countCompletedShiftsInPeriod(startOfWeek, date),
        hoursWorkedThisWeek: await calculateTotalHoursInPeriod(startOfWeek, date),
        revenueThisWeek: await calculateRevenueInPeriod(startOfWeek, date),
        shiftsCompletedThisMonth: await countCompletedShiftsInPeriod(startOfMonth, date),
        hoursWorkedThisMonth: await calculateTotalHoursInPeriod(startOfMonth, date),
        revenueThisMonth: await calculateRevenueInPeriod(startOfMonth, date),
        activeUsers: await countActiveUsersForDate(date),
        newRegistrations: await countNewRegistrationsForDate(date),
        documentsUploaded: await countDocumentsUploadedForDate(date),
        documentsVerified: await countDocumentsVerifiedForDate(date),
        averageResponseTime: await calculateAverageResponseTime(date),
        errorRate: await calculateErrorRate(date),
    };
}
async function countOpenShifts() {
    const db = getDb();
    return (await db.collection('shifts').where('status', '==', 'open').get()).size;
}
async function countAssignedShifts() {
    const db = getDb();
    return (await db.collection('shifts').where('status', '==', 'assigned').get()).size;
}
async function countCompletedShifts(date) {
    const db = getDb();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const snapshot = await db.collection('shifts').where('status', '==', 'done')
        .where('date', '>=', startOfDay.toISOString().split('T')[0])
        .where('date', '<=', endOfDay.toISOString().split('T')[0]).get();
    return snapshot.size;
}
async function countCompletedShiftsInPeriod(startDate, endDate) {
    const db = getDb();
    const snapshot = await db.collection('shifts').where('status', '==', 'done')
        .where('date', '>=', startDate.toISOString().split('T')[0])
        .where('date', '<=', endDate.toISOString().split('T')[0]).get();
    return snapshot.size;
}
async function countActiveNurses() {
    const db = getDb();
    return (await db.collection('users').where('role', '==', 'nurse').where('isActive', '==', true).get()).size;
}
async function countTotalNurses() {
    const db = getDb();
    return (await db.collection('users').where('role', '==', 'nurse').get()).size;
}
async function countOnlineUsers() {
    const db = getDb();
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    return (await db.collection('users').where('lastSeen', '>=', fiveMinutesAgo.toISOString()).get()).size;
}
async function countActiveUsersForDate(date) {
    const db = getDb();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const snapshot = await db.collection('timesheets')
        .where('startTime', '>=', startOfDay.toISOString())
        .where('startTime', '<=', endOfDay.toISOString()).get();
    const uniqueUsers = new Set();
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId)
            uniqueUsers.add(data.userId);
    });
    return uniqueUsers.size;
}
async function countNewRegistrationsForDate(date) {
    const db = getDb();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return (await db.collection('users').where('createdAt', '>=', startOfDay).where('createdAt', '<=', endOfDay).get()).size;
}
async function calculateTotalHoursToday(date) {
    const db = getDb();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const snapshot = await db.collection('timesheets')
        .where('startTime', '>=', startOfDay.toISOString())
        .where('startTime', '<=', endOfDay.toISOString())
        .where('status', '==', 'completed').get();
    let total = 0;
    snapshot.docs.forEach(doc => { const d = doc.data(); if (d.totalHours)
        total += d.totalHours; });
    return total;
}
async function calculateTotalHoursThisWeek(startOfWeek) {
    const db = getDb();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const snapshot = await db.collection('timesheets')
        .where('startTime', '>=', startOfWeek.toISOString())
        .where('startTime', '<=', endOfWeek.toISOString())
        .where('status', '==', 'completed').get();
    let total = 0;
    snapshot.docs.forEach(doc => { const d = doc.data(); if (d.totalHours)
        total += d.totalHours; });
    return total;
}
async function calculateTotalHoursThisMonth(startOfMonth) {
    const db = getDb();
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    const snapshot = await db.collection('timesheets')
        .where('startTime', '>=', startOfMonth.toISOString())
        .where('startTime', '<=', endOfMonth.toISOString())
        .where('status', '==', 'completed').get();
    let total = 0;
    snapshot.docs.forEach(doc => { const d = doc.data(); if (d.totalHours)
        total += d.totalHours; });
    return total;
}
async function calculateTotalHoursForDate(date) {
    return calculateTotalHoursToday(date);
}
async function calculateTotalHoursInPeriod(startDate, endDate) {
    const db = getDb();
    const snapshot = await db.collection('timesheets')
        .where('startTime', '>=', startDate.toISOString())
        .where('startTime', '<=', endDate.toISOString())
        .where('status', '==', 'completed').get();
    let total = 0;
    snapshot.docs.forEach(doc => { const d = doc.data(); if (d.totalHours)
        total += d.totalHours; });
    return total;
}
async function countDocumentsExpiringSoon() {
    const db = getDb();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return (await db.collection('documents')
        .where('expiryDate', '>=', new Date().toISOString())
        .where('expiryDate', '<=', thirtyDaysFromNow.toISOString()).get()).size;
}
async function countPendingDocumentVerifications() {
    const db = getDb();
    return (await db.collection('documents').where('verified', '==', false).get()).size;
}
async function countDocumentsUploadedForDate(date) {
    const db = getDb();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return (await db.collection('documents').where('uploadedAt', '>=', startOfDay).where('uploadedAt', '<=', endOfDay).get()).size;
}
async function countDocumentsVerifiedForDate(date) {
    const db = getDb();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return (await db.collection('documents').where('verifiedAt', '>=', startOfDay).where('verifiedAt', '<=', endOfDay).get()).size;
}
async function calculateEstimatedRevenueToday(date) {
    return (await calculateTotalHoursToday(date)) * 25;
}
async function calculateEstimatedRevenueThisWeek(startOfWeek) {
    return (await calculateTotalHoursThisWeek(startOfWeek)) * 25;
}
async function calculateEstimatedRevenueThisMonth(startOfMonth) {
    return (await calculateTotalHoursThisMonth(startOfMonth)) * 25;
}
async function calculateRevenueForDate(date) {
    return calculateEstimatedRevenueToday(date);
}
async function calculateRevenueInPeriod(startDate, endDate) {
    return (await calculateTotalHoursInPeriod(startDate, endDate)) * 25;
}
async function countTotalNotifications() {
    const db = getDb();
    return (await db.collection('notifications').get()).size;
}
async function countUnreadNotifications() {
    const db = getDb();
    return (await db.collection('notifications').where('read', '==', false).get()).size;
}
async function countSystemErrors(date) {
    const db = getDb();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return (await db.collection('auditLogs').where('action', '==', 'error')
        .where('timestamp', '>=', startOfDay).where('timestamp', '<=', endOfDay).get()).size;
}
async function calculateAverageResponseTime(_date) {
    return 150;
}
async function calculateErrorRate(date) {
    const errors = await countSystemErrors(date);
    return (errors / 1000) * 100;
}
async function storeAggregatedKPIs(kpis, timestamp) {
    const db = getDb();
    try {
        await db.collection('kpiAggregations').add(Object.assign(Object.assign({}, kpis), { timestamp: timestamp.toISOString(), createdAt: firestore_1.FieldValue.serverTimestamp() }));
    }
    catch (error) {
        firebase_functions_1.logger.error('Error storing aggregated KPIs:', error);
    }
}
async function storeDailyKPIs(dailyKPIs, _date) {
    const db = getDb();
    try {
        await db.collection('dailyKPIs').add(Object.assign(Object.assign({}, dailyKPIs), { createdAt: firestore_1.FieldValue.serverTimestamp() }));
    }
    catch (error) {
        firebase_functions_1.logger.error('Error storing daily KPIs:', error);
    }
}
async function createAuditLog(logData) {
    const db = getDb();
    try {
        await db.collection('auditLogs').add(Object.assign(Object.assign({}, logData), { timestamp: firestore_1.FieldValue.serverTimestamp(), createdAt: firestore_1.FieldValue.serverTimestamp() }));
    }
    catch (error) {
        firebase_functions_1.logger.error('Error creating audit log:', error);
    }
}
