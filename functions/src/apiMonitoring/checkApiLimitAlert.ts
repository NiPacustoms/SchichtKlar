import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { sendTemplatedEmail } from '../email';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const COLLECTION_NAME = 'api_monitoring';
const ALERT_THRESHOLD = 90; // Alert bei 90% Nutzung
const DAILY_LIMIT = 2000;

/**
 * Prüft API-Limit und sendet Alert bei 90% Erreichung
 * Läuft alle 15 Minuten
 */
export const checkApiLimitAlert = functions.pubsub
  .schedule('every 15 minutes')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const docRef = db.collection(COLLECTION_NAME).doc(today);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return { success: true, message: 'Keine Daten für heute' };
      }

      const data = docSnap.data();
      const dailyCount = data?.count || 0;
      const percentageUsed = (dailyCount / DAILY_LIMIT) * 100;
      const alertSent = data?.alertSent || false;

      // Prüfe ob Alert bereits gesendet wurde
      if (alertSent) {
        return { success: true, message: 'Alert bereits gesendet' };
      }

      // Prüfe ob Threshold erreicht wurde
      if (percentageUsed >= ALERT_THRESHOLD) {
        // Hole alle Admin-User
        const adminUsers = await db
          .collection('users')
          .where('role', '==', 'admin')
          .get();

        if (adminUsers.empty) {
          functions.logger.warn('Keine Admin-User gefunden für API-Limit-Alert');
          return { success: false, message: 'Keine Admin-User gefunden' };
        }

        // Sende E-Mail an alle Admins
        const emailPromises = adminUsers.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          const email = userData.email;

          if (!email || typeof email !== 'string') {
            return;
          }

          const remaining = Math.max(0, DAILY_LIMIT - dailyCount);
          const subject = `⚠️ Schichtklar: API-Limit fast erreicht (${percentageUsed.toFixed(1)}%)`;
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #ff9800; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
                .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                .stat { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #ff9800; }
                .stat-label { font-weight: bold; color: #666; }
                .stat-value { font-size: 24px; color: #ff9800; margin-top: 5px; }
                .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚠️ API-Limit Warnung</h1>
                </div>
                <div class="content">
                  <p>Das tägliche API-Limit für OpenRouteService (Routenberechnung) wurde zu ${percentageUsed.toFixed(1)}% erreicht.</p>
                  
                  <div class="stat">
                    <div class="stat-label">Verwendet</div>
                    <div class="stat-value">${dailyCount} / ${DAILY_LIMIT}</div>
                  </div>
                  
                  <div class="stat">
                    <div class="stat-label">Verbleibend</div>
                    <div class="stat-value">${remaining}</div>
                  </div>
                  
                  <div class="warning">
                    <strong>⚠️ Wichtig:</strong> Wenn das Limit erreicht wird, funktioniert die Routenberechnung nicht mehr bis zum nächsten Tag (00:00 UTC).
                  </div>
                  
                  <p><strong>Empfehlungen:</strong></p>
                  <ul>
                    <li>Überprüfen Sie die API-Nutzung im Admin-Dashboard</li>
                    <li>Das Caching-System reduziert bereits die API-Calls um ~60-80%</li>
                    <li>Bei regelmäßiger Überschreitung: Self-Hosting von OpenRouteService in Betracht ziehen</li>
                  </ul>
                  
                  <div class="footer">
                    <p>Diese E-Mail wurde automatisch von Schichtklar generiert.</p>
                    <p>Sie erhalten diese E-Mail nur einmal pro Tag, auch wenn das Limit weiter steigt.</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;
          const text = `
API-Limit Warnung

Das tägliche API-Limit für OpenRouteService wurde zu ${percentageUsed.toFixed(1)}% erreicht.

Verwendet: ${dailyCount} / ${DAILY_LIMIT}
Verbleibend: ${remaining}

Wichtig: Wenn das Limit erreicht wird, funktioniert die Routenberechnung nicht mehr bis zum nächsten Tag (00:00 UTC).

Empfehlungen:
- Überprüfen Sie die API-Nutzung im Admin-Dashboard
- Das Caching-System reduziert bereits die API-Calls um ~60-80%
- Bei regelmäßiger Überschreitung: Self-Hosting von OpenRouteService in Betracht ziehen

Diese E-Mail wurde automatisch von Schichtklar generiert.
          `;

          try {
            await sendTemplatedEmail({
              to: email,
              subject,
              html,
              text,
            });
            functions.logger.info(`API-Limit-Alert gesendet an: ${email}`);
          } catch (emailError) {
            functions.logger.error(`Fehler beim Senden des API-Limit-Alerts an ${email}:`, emailError);
          }
        });

        await Promise.all(emailPromises);

        // Markiere Alert als gesendet
        await docRef.update({
          alertSent: true,
        });

        functions.logger.info(
          `API-Limit-Alert gesendet: ${percentageUsed.toFixed(1)}% erreicht, ${adminUsers.size} Admin(s) benachrichtigt`
        );

        return {
          success: true,
          percentageUsed,
          dailyCount,
          adminsNotified: adminUsers.size,
        };
      }

      return { success: true, message: `Limit noch nicht erreicht: ${percentageUsed.toFixed(1)}%` };
    } catch (error) {
      functions.logger.error('Fehler beim Prüfen des API-Limits:', error);
      throw error;
    }
  });

/**
 * Manuelle Alert-Prüfung (für Testing)
 */
export const manualCheckApiLimitAlert = functions.https.onRequest(async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const docRef = db.collection(COLLECTION_NAME).doc(today);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      res.status(200).json({ ok: true, message: 'Keine Daten für heute' });
      return;
    }

    const data = docSnap.data();
    const dailyCount = data?.count || 0;
    const percentageUsed = (dailyCount / DAILY_LIMIT) * 100;

    res.status(200).json({
      ok: true,
      dailyCount,
      percentageUsed,
      threshold: ALERT_THRESHOLD,
      alertSent: data?.alertSent || false,
    });
  } catch (error) {
    functions.logger.error('Fehler bei manueller Alert-Prüfung:', error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'unknown',
    });
  }
});

