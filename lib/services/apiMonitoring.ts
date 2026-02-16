import { collection, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, query, where, getDocs, orderBy, limit, Timestamp, deleteDoc } from 'firebase/firestore';
import { getDb } from '../firebase';
import { logger } from '@/lib/logging';

const COLLECTION_NAME = 'api_monitoring';
const DAILY_LIMIT = 2000; // OpenRouteService Free Tier Limit
const RATE_LIMIT_PER_MINUTE = 40;

export interface ApiCallRecord {
  date: string; // YYYY-MM-DD format
  count: number;
  lastCallAt: Timestamp;
  rateLimitWindow: {
    minute: string; // YYYY-MM-DD-HH-MM format
    count: number;
  }[];
  cacheHits?: number; // Anzahl Cache-Hits
  cacheMisses?: number; // Anzahl Cache-Misses
  totalResponseTime?: number; // Gesamte Response-Zeit in ms
  responseTimeCount?: number; // Anzahl gemessener Response-Zeiten
  alertSent?: boolean; // Ob 90% Alert bereits gesendet wurde
  updatedAt: Timestamp;
}

/**
 * API-Monitoring-Service für OpenRouteService
 * Trackt tägliche und minütliche API-Calls
 */
export class ApiMonitoringService {
  /**
   * Prüft, ob ein API-Call erlaubt ist (Rate Limiting)
   */
  static async canMakeRequest(): Promise<{ allowed: boolean; reason?: string; dailyCount?: number }> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const now = new Date();
      const currentMinute = `${today}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;

      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, today);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Erster Call heute - erlaubt
        return { allowed: true, dailyCount: 0 };
      }

      const data = docSnap.data() as ApiCallRecord;
      const dailyCount = data.count || 0;

      // Prüfe tägliches Limit
      if (dailyCount >= DAILY_LIMIT) {
        return {
          allowed: false,
          reason: `Tägliches Limit erreicht (${DAILY_LIMIT} Requests/Tag)`,
          dailyCount,
        };
      }

      // Prüfe Rate Limit (40 pro Minute)
      const currentMinuteEntry = data.rateLimitWindow?.find(w => w.minute === currentMinute);
      const minuteCount = currentMinuteEntry?.count || 0;

      if (minuteCount >= RATE_LIMIT_PER_MINUTE) {
        return {
          allowed: false,
          reason: `Rate Limit erreicht (${RATE_LIMIT_PER_MINUTE} Requests/Minute)`,
          dailyCount,
        };
      }

      return { allowed: true, dailyCount };
    } catch (error) {
      // Bei Fehler erlauben wir den Call (Fail-Open-Strategie)
      logger.warn('⚠️ API-Monitoring-Fehler, erlaube Request', {}, { error: error instanceof Error ? error.message : String(error) });
      return { allowed: true };
    }
  }

  /**
   * Registriert einen API-Call
   * @param fromCache - Ob der Call aus dem Cache kam
   * @param responseTime - Response-Zeit in Millisekunden (optional)
   */
  static async recordRequest(fromCache: boolean = false, responseTime?: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const now = new Date();
      const currentMinute = `${today}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;

      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, today);
      const docSnap = await getDoc(docRef);

      const updateData: Record<string, unknown> = {
        lastCallAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!docSnap.exists()) {
        // Erster Call heute - erstelle Dokument
        await setDoc(docRef, {
          date: today,
          count: fromCache ? 0 : 1, // WICHTIG: count nur bei echten API-Calls
          lastCallAt: serverTimestamp(),
          rateLimitWindow: fromCache ? [] : [{ minute: currentMinute, count: 1 }], // Rate-Limit nur bei echten API-Calls
          cacheHits: fromCache ? 1 : 0,
          cacheMisses: fromCache ? 0 : 1,
          totalResponseTime: responseTime || 0,
          responseTimeCount: responseTime ? 1 : 0,
          alertSent: false,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Dokument existiert - Update mit increment
        const data = docSnap.data() as ApiCallRecord;
        const rateLimitWindow = data.rateLimitWindow || [];
        
        // Entferne alte Minuten (älter als 1 Minute)
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
        const oneMinuteAgoDate = oneMinuteAgo.toISOString().split('T')[0]; // Kann ein anderer Tag sein
        const oneMinuteAgoStr = `${oneMinuteAgoDate}-${String(oneMinuteAgo.getHours()).padStart(2, '0')}-${String(oneMinuteAgo.getMinutes()).padStart(2, '0')}`;
        const filteredWindow = rateLimitWindow.filter(w => w.minute > oneMinuteAgoStr);

        // Rate-Limit-Window nur bei echten API-Calls aktualisieren (nicht bei Cache-Hits)
        if (!fromCache) {
          // Update oder füge aktuelle Minute hinzu
          const currentMinuteEntry = filteredWindow.find(w => w.minute === currentMinute);
          if (currentMinuteEntry) {
            currentMinuteEntry.count = (currentMinuteEntry.count || 0) + 1;
          } else {
            filteredWindow.push({ minute: currentMinute, count: 1 });
          }
          updateData.rateLimitWindow = filteredWindow;
          updateData.count = increment(1);
        } else {
          // Bei Cache-Hits: Rate-Limit-Window nicht ändern, nur Cache-Statistiken
          updateData.rateLimitWindow = filteredWindow; // Behalte aktuelles Window
        }

        // Cache-Statistiken
        if (fromCache) {
          updateData.cacheHits = increment(1);
        } else {
          updateData.cacheMisses = increment(1);
        }

        // Response-Zeit-Tracking
        if (responseTime !== undefined) {
          const currentTotal = data.totalResponseTime || 0;
          const currentCount = data.responseTimeCount || 0;
          updateData.totalResponseTime = currentTotal + responseTime;
          updateData.responseTimeCount = currentCount + 1;
        }

        await updateDoc(docRef, updateData);
      }
    } catch (error) {
      // Fail-Silently - Monitoring sollte nicht die App blockieren
      logger.warn('⚠️ Fehler beim Aufzeichnen des API-Calls', {}, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Gibt die aktuellen Statistiken zurück
   */
  static async getStats(): Promise<{
    dailyCount: number;
    remaining: number;
    percentageUsed: number;
    lastCallAt?: Date;
    cacheHitRate?: number;
    averageResponseTime?: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, today);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          dailyCount: 0,
          remaining: DAILY_LIMIT,
          percentageUsed: 0,
          cacheHitRate: undefined,
          averageResponseTime: undefined,
        };
      }

      const data = docSnap.data() as ApiCallRecord;
      const dailyCount = data.count || 0;
      const remaining = Math.max(0, DAILY_LIMIT - dailyCount);
      const percentageUsed = (dailyCount / DAILY_LIMIT) * 100;
      const lastCallAt = data.lastCallAt?.toDate();

      // Cache-Hit-Rate berechnen
      const cacheHits = data.cacheHits || 0;
      const cacheMisses = data.cacheMisses || 0;
      const totalCacheRequests = cacheHits + cacheMisses;
      const cacheHitRate = totalCacheRequests > 0 
        ? (cacheHits / totalCacheRequests) * 100 
        : undefined;

      // Durchschnittliche Response-Zeit berechnen
      const totalResponseTime = data.totalResponseTime || 0;
      const responseTimeCount = data.responseTimeCount || 0;
      const averageResponseTime = responseTimeCount > 0
        ? totalResponseTime / responseTimeCount
        : undefined;

      return {
        dailyCount,
        remaining,
        percentageUsed,
        lastCallAt,
        cacheHitRate,
        averageResponseTime,
      };
    } catch (error) {
      logger.warn('⚠️ Fehler beim Abrufen der API-Statistiken', {}, { error: error instanceof Error ? error.message : String(error) });
      return {
        dailyCount: 0,
        remaining: DAILY_LIMIT,
        percentageUsed: 0,
        cacheHitRate: undefined,
        averageResponseTime: undefined,
      };
    }
  }

  /**
   * Lädt historische API-Statistiken (z. B. letzte N Tage) für Charts.
   */
  static async getHistoricalStats(limitDays: number = 7): Promise<Array<{
    date: string;
    count: number;
    cacheHits?: number;
    cacheMisses?: number;
    cacheHitRate?: number;
    averageResponseTime?: number;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - limitDays);
      const cutoffDate = startDate.toISOString().split('T')[0];

      const db = getDb();
      const q = query(
        collection(db, COLLECTION_NAME),
        where('date', '>=', cutoffDate),
        orderBy('date', 'desc'),
        limit(limitDays)
      );

      const snapshot = await getDocs(q);
      const data: Array<{
        date: string;
        count: number;
        cacheHits?: number;
        cacheMisses?: number;
        cacheHitRate?: number;
        averageResponseTime?: number;
      }> = [];

      snapshot.docs.forEach((docSnap) => {
        const docData = docSnap.data() as ApiCallRecord;
        const cacheHits = docData.cacheHits || 0;
        const cacheMisses = docData.cacheMisses || 0;
        const totalCacheRequests = cacheHits + cacheMisses;
        const cacheHitRate = totalCacheRequests > 0
          ? (cacheHits / totalCacheRequests) * 100
          : undefined;
        const totalResponseTime = docData.totalResponseTime || 0;
        const responseTimeCount = docData.responseTimeCount || 0;
        const averageResponseTime = responseTimeCount > 0
          ? totalResponseTime / responseTimeCount
          : undefined;
        data.push({
          date: docData.date || docSnap.id,
          count: docData.count || 0,
          cacheHits,
          cacheMisses,
          cacheHitRate,
          averageResponseTime,
        });
      });

      return data.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      logger.warn('⚠️ Fehler beim Abrufen historischer API-Statistiken', {}, { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * Bereinigt alte Monitoring-Daten (älter als 7 Tage)
   */
  static async cleanupOldRecords(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

      const db = getDb();
      const q = query(
        collection(db, COLLECTION_NAME),
        where('date', '<', cutoffDate)
      );

      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(d => d.ref);

      // Firestore Batch Delete (max 500 pro Batch)
      for (let i = 0; i < batch.length; i += 500) {
        const chunk = batch.slice(i, i + 500);
        // Note: Firestore hat keine batch delete, daher müssen wir einzeln löschen
        // In Production sollte das über Cloud Functions gemacht werden
        await Promise.all(chunk.map(ref => deleteDoc(ref)));
      }
    } catch (error) {
      logger.warn('⚠️ Fehler beim Bereinigen alter Monitoring-Daten', {}, { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

