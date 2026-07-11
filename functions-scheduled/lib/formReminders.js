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
function renderReminderEmailHtml(input) {
    const greeting = input.employeeName ? `Hallo ${input.employeeName},` : 'Guten Tag,';
    const reasons = [
        input.formNotDone ? 'die Einsatzmitteilung ist noch nicht bestätigt' : '',
        input.missingDailySignature ? 'die tägliche Unterschrift fehlt' : '',
    ].filter(Boolean).join(' und ');
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2>Erinnerung: Einsatz-Formular ausfüllen</h2>
      <p>${greeting}</p>
      <p>Für Ihren Einsatz ${reasons ? `ist noch etwas offen: ${reasons}.` : 'ist noch ein Formular offen.'}</p>
      <p>Bitte füllen Sie das Formular über folgenden Link aus:</p>
      <p>
        <a href="${input.formLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
          Formular öffnen
        </a>
      </p>
      <p>Falls der Button nicht funktioniert, nutzen Sie diesen Link: <br/>
        <a href="${input.formLink}">${input.formLink}</a>
      </p>
      <p>Vielen Dank!</p>
    </div>
  `;
}
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
            const email = typeof (user === null || user === void 0 ? void 0 : user.email) === 'string' ? user.email : undefined;
            const formLink = `${process.env.PUBLIC_APP_URL || 'https://app.example.com'}/employee/formulare/einsaetze/${doc.id}`;
            if (!email) {
                console.warn('[ReminderEmail] Keine E-Mail-Adresse für User', { userId: data.userId, assignmentId: doc.id });
                continue;
            }
            const html = renderReminderEmailHtml({
                employeeName: typeof (user === null || user === void 0 ? void 0 : user.displayName) === 'string' ? user.displayName : undefined,
                formLink,
                missingDailySignature: !dailySigned,
                formNotDone: !formDone,
            });
            // Mail in die Queue legen; der Firestore-Trigger `processMailQueue`
            // (default-Codebase) übernimmt den Versand. Deterministische ID
            // verhindert Duplikate, wenn der Job mehrfach am selben Tag läuft.
            const today = new Date().toISOString().slice(0, 10);
            const mailId = `formReminder_${doc.id}_${today}`;
            try {
                await db.collection('mail').doc(mailId).create({
                    to: email,
                    subject: 'Erinnerung: Einsatz-Formular ausfüllen',
                    html,
                    text: `Bitte füllen Sie das Einsatz-Formular aus: ${formLink}`,
                    delivery: {
                        state: 'PENDING',
                        attempts: 0,
                        error: null,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                });
                console.log('[ReminderEmail] eingereiht', { to: email, assignmentId: doc.id, mailId });
            }
            catch (e) {
                const code = e.code;
                if (code === 6) {
                    // ALREADY_EXISTS: Erinnerung für heute wurde bereits eingereiht
                    continue;
                }
                console.error('[ReminderEmail] Einreihen fehlgeschlagen', { assignmentId: doc.id }, e);
            }
        }
    }
}
