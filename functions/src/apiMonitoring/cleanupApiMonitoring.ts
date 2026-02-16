import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const COLLECTION_NAME = 'api_monitoring';
const ROUTE_CACHE_COLLECTION = 'route_cache';
const DAYS_TO_KEEP = 7; // Daten älter als 7 Tage löschen

/**
 * Cloud Function: Bereinigt alte API-Monitoring-Daten
 * Läuft täglich um 02:00 Uhr (Europe/Berlin)
 */
export const cleanupApiMonitoring = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('Europe/Berlin')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD

    let deletedMonitoringDocs = 0;
    let deletedCacheDocs = 0;

    try {
      // 1. Lösche alte API-Monitoring-Dokumente (älter als 7 Tage)
      // Loop für mehr als 500 Dokumente
      let hasMoreMonitoringDocs = true;
      while (hasMoreMonitoringDocs) {
        const monitoringQuery = db
          .collection(COLLECTION_NAME)
          .where('date', '<', cutoffDateString)
          .limit(500);

        const monitoringSnapshot = await monitoringQuery.get();

        if (monitoringSnapshot.empty) {
          hasMoreMonitoringDocs = false;
          break;
        }

        const batch = db.batch();
        monitoringSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          deletedMonitoringDocs++;
        });

        await batch.commit();
        functions.logger.info(`Gelöscht: ${monitoringSnapshot.size} API-Monitoring-Dokumente (Batch)`);
        
        // Wenn weniger als 500 Dokumente, sind wir fertig
        if (monitoringSnapshot.size < 500) {
          hasMoreMonitoringDocs = false;
        }
      }

      // 2. Lösche abgelaufene Route-Cache-Dokumente
      // Loop für mehr als 500 Dokumente
      let hasMoreCacheDocs = true;
      while (hasMoreCacheDocs) {
        const cacheQuery = db
          .collection(ROUTE_CACHE_COLLECTION)
          .where('expiresAt', '<', now)
          .limit(500);

        const cacheSnapshot = await cacheQuery.get();

        if (cacheSnapshot.empty) {
          hasMoreCacheDocs = false;
          break;
        }

        const batch = db.batch();
        cacheSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          deletedCacheDocs++;
        });

        await batch.commit();
        functions.logger.info(`Gelöscht: ${cacheSnapshot.size} Route-Cache-Dokumente (Batch)`);
        
        // Wenn weniger als 500 Dokumente, sind wir fertig
        if (cacheSnapshot.size < 500) {
          hasMoreCacheDocs = false;
        }
      }

      functions.logger.info(
        `Cleanup abgeschlossen: ${deletedMonitoringDocs} Monitoring-Docs, ${deletedCacheDocs} Cache-Docs gelöscht`
      );

      return {
        success: true,
        deletedMonitoringDocs,
        deletedCacheDocs,
        cutoffDate: cutoffDateString,
      };
    } catch (error) {
      functions.logger.error('Fehler beim Cleanup der API-Monitoring-Daten:', error);
      throw error;
    }
  });

/**
 * Manuelle Cleanup-Function (für Testing/Debugging)
 */
export const manualCleanupApiMonitoring = functions.https.onRequest(async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    let deletedMonitoringDocs = 0;
    let deletedCacheDocs = 0;

    // API-Monitoring Cleanup (Loop für mehr als 500 Dokumente)
    let hasMoreMonitoringDocs = true;
    while (hasMoreMonitoringDocs) {
      const monitoringQuery = db
        .collection(COLLECTION_NAME)
        .where('date', '<', cutoffDateString)
        .limit(500);

      const monitoringSnapshot = await monitoringQuery.get();

      if (monitoringSnapshot.empty) {
        hasMoreMonitoringDocs = false;
        break;
      }

      const batch = db.batch();
      monitoringSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedMonitoringDocs++;
      });

      await batch.commit();
      
      if (monitoringSnapshot.size < 500) {
        hasMoreMonitoringDocs = false;
      }
    }

    // Route-Cache Cleanup (Loop für mehr als 500 Dokumente)
    let hasMoreCacheDocs = true;
    while (hasMoreCacheDocs) {
      const cacheQuery = db
        .collection(ROUTE_CACHE_COLLECTION)
        .where('expiresAt', '<', now)
        .limit(500);

      const cacheSnapshot = await cacheQuery.get();

      if (cacheSnapshot.empty) {
        hasMoreCacheDocs = false;
        break;
      }

      const batch = db.batch();
      cacheSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCacheDocs++;
      });

      await batch.commit();
      
      if (cacheSnapshot.size < 500) {
        hasMoreCacheDocs = false;
      }
    }

    res.status(200).json({
      ok: true,
      deletedMonitoringDocs,
      deletedCacheDocs,
      cutoffDate: cutoffDateString,
    });
  } catch (error) {
    functions.logger.error('Fehler beim manuellen Cleanup:', error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'unknown',
    });
  }
});

