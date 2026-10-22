import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { sendFormReminderEmails } from './formReminders';
import { runAggregateKPIs, runDailyKPIAggregation } from './kpiAggregations';

admin.initializeApp();

// Alle Functions in der EU (Belgien), wie die Haupt-Codebase
const eu = functions.region('europe-west1');

export const scheduledFormReminders = eu.pubsub
  .schedule('every 24 hours')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    await sendFormReminderEmails();
  });

export const runFormReminders = eu.https.onRequest(async (_req, res) => {
  try {
    await sendFormReminderEmails();
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'unknown' });
  }
});

export const aggregateKPIs = eu.pubsub
  .schedule('0 * * * *')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    await runAggregateKPIs();
  });

export const dailyKPIAggregation = eu.pubsub
  .schedule('0 1 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    await runDailyKPIAggregation();
  });
