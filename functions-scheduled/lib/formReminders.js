"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFormReminderEmails = sendFormReminderEmails;
const admin = __importStar(require("firebase-admin"));
async function sendFormReminderEmails() {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    const db = admin.firestore();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const assignmentsSnap = await db.collection('assignments')
        .where('assignedAt', '<=', twentyFourHoursAgo)
        .get();
    for (const doc of assignmentsSnap.docs) {
        const data = doc.data();
        const formDone = data.formStatus === 'acknowledged' || data.formStatus === 'declined';
        const shiftDoc = await db.collection('shifts').doc(data.shiftId).get();
        const shift = shiftDoc.exists ? shiftDoc.data() : null;
        const shiftDate = shift === null || shift === void 0 ? void 0 : shift.date;
        const dateStr = (shiftDate === null || shiftDate === void 0 ? void 0 : shiftDate.toDate) ? shiftDate.toDate().toISOString().slice(0, 10) : undefined;
        const dailySignatures = Array.isArray(data.dailySignatures) ? data.dailySignatures : [];
        const dailySigned = dateStr ? dailySignatures.some((s) => s.date === dateStr) : false;
        if (!formDone || !dailySigned) {
            const userDoc = await db.collection('users').doc(data.userId).get();
            const user = userDoc.exists ? userDoc.data() : null;
            const email = user === null || user === void 0 ? void 0 : user.email;
            const formLink = `${process.env.PUBLIC_APP_URL || 'https://app.example.com'}/employee/formulare/einsaetze/${doc.id}`;
            console.log('[ReminderEmail]', { to: email, formLink, assignmentId: doc.id, missingDailySignature: !dailySigned, formNotDone: !formDone });
        }
    }
}
