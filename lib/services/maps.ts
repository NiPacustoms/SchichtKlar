import { FEATURE_FLAGS } from '@/lib/config/featureFlags';
import { doc, getDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { getDb } from '../firebase';
import { ApiMonitoringService } from './apiMonitoring';
import { logger } from '@/lib/logging';

// Export API-Monitoring für externe Nutzung
export { ApiMonitoringService } from './apiMonitoring';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteSummary {
  distanceMeters: number;
  durationSeconds: number;
  steps: string[];
  mapUrl?: string;
}

type CacheEntry<T> = { value: T; expiresAt: number };

const memoryCache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24h (optimiert von 1h)
const FIRESTORE_CACHE_COLLECTION = 'route_cache';

/**
 * Memory Cache (schnell, aber nicht persistent)
 */
function getFromMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function setInMemoryCache<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Firestore Cache (persistent, 24h TTL)
 */
async function getFromFirestoreCache<T>(key: string): Promise<T | null> {
  try {
    if (typeof window === 'undefined') return null; // SSR: kein Firestore-Zugriff
    
    const db = getDb();
    const docRef = doc(db, FIRESTORE_CACHE_COLLECTION, key);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    const expiresAt = (data.expiresAt as Timestamp)?.toMillis();
    
    if (!expiresAt || Date.now() > expiresAt) {
      // Abgelaufen - Dokument löschen (async, nicht blockierend)
      deleteDoc(docRef).catch(() => {});
      return null;
    }

    return data.value as T;
  } catch (error) {
    // Fail-Silently - Cache-Fehler sollten nicht die App blockieren
    logger.warn('⚠️ Firestore-Cache-Fehler', {}, { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

async function setInFirestoreCache<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
  try {
    if (typeof window === 'undefined') return; // SSR: kein Firestore-Zugriff
    
    const db = getDb();
    const expiresAt = Timestamp.fromMillis(Date.now() + ttlMs);
    const docRef = doc(db, FIRESTORE_CACHE_COLLECTION, key);

    await setDoc(docRef, {
      value,
      expiresAt,
      cachedAt: Timestamp.now(),
    });
  } catch (error) {
    // Fail-Silently
    logger.warn('⚠️ Firestore-Cache-Speicher-Fehler', {}, { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Kombinierter Cache: Zuerst Memory, dann Firestore
 */
async function getFromCache<T>(key: string): Promise<T | null> {
  // 1. Memory Cache (schnellste Option)
  const memoryCached = getFromMemoryCache<T>(key);
  if (memoryCached) return memoryCached;

  // 2. Firestore Cache (persistent)
  const firestoreCached = await getFromFirestoreCache<T>(key);
  if (firestoreCached) {
    // Zurück in Memory Cache für schnelleren Zugriff
    setInMemoryCache(key, firestoreCached);
    return firestoreCached;
  }

  return null;
}

async function setInCache<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
  // Beide Caches aktualisieren
  setInMemoryCache(key, value, ttlMs);
  await setInFirestoreCache(key, value, ttlMs);
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car';

function getUserAgent(): string {
  // Nominatim policy requires a descriptive UA with contact URL/email
  // Configure via env if available
  return process.env.NEXT_PUBLIC_APP_USER_AGENT || 'JobFlow/1.0 (contact: https://jobflow.example)';
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const cacheKey = `geocode:${address}`;
  const cached = await getFromCache<Coordinates>(cacheKey);
  if (cached) return cached;

  const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(address)}&limit=1`; 
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': getUserAgent(),
      // Nominatim discourages repeated calls without caching
      'Referer': 'https://app.jobflow.local',
    },
  });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0] as { lat?: string; lon?: string };
  if (!first?.lat || !first?.lon) return null;
  const coords: Coordinates = { latitude: parseFloat(first.lat), longitude: parseFloat(first.lon) };
  await setInCache(cacheKey, coords);
  return coords;
}

export async function getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteSummary | null> {
  const cacheKey = `route:${origin.latitude},${origin.longitude}->${destination.latitude},${destination.longitude}`;
  const startTime = Date.now();
  
  // 1. Cache prüfen
  const cached = await getFromCache<RouteSummary>(cacheKey);
  if (cached) {
    // Cache-Hit: Response-Zeit ist sehr schnell (Cache-Zugriff)
    const responseTime = Date.now() - startTime;
    // API-Monitoring deaktiviert - Fehler ignorieren
    try {
      await ApiMonitoringService.recordRequest(true, responseTime);
    } catch (_error) {
      // Ignoriere API-Monitoring-Fehler
    }
    return cached;
  }

  // 2. Rate Limiting prüfen (deaktiviert - API-Monitoring nicht mehr verfügbar)
  // Rate Limiting wird nicht mehr durchgeführt

  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY || process.env.ORS_API_KEY;
  if (!apiKey && FEATURE_FLAGS.IS_PRODUCTION) {
    // In Production ohne Key liefern wir nichts zurück
    return null;
  }

  const body = {
    coordinates: [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
    ],
    instructions: true,
  };

  // 3. API-Call durchführen
  const res = await fetch(ORS_BASE, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': apiKey } : {}),
    },
    body: JSON.stringify(body),
  });

  // 4. API-Call registrieren (deaktiviert - API-Monitoring nicht mehr verfügbar)
  // API-Monitoring-Aufruf entfernt

  if (!res.ok) {
    // Bei 429 (Too Many Requests) oder anderen Fehlern
    if (res.status === 429) {
      logger.warn('⚠️ OpenRouteService Rate Limit erreicht');
      return {
        distanceMeters: 0,
        durationSeconds: 0,
        steps: ['API-Rate-Limit erreicht. Bitte versuchen Sie es in einer Minute erneut.'],
        mapUrl: `https://www.openstreetmap.org/directions?from=${origin.latitude},${origin.longitude}&to=${destination.latitude},${destination.longitude}`,
      };
    }
    return null;
  }
  const data: unknown = await res.json();
  const route0 = (data as { routes?: Array<{ segments?: Array<{ steps?: Array<{ instruction?: string }> }>; summary?: { distance?: number; duration?: number } }> }).routes?.[0];
  const segment0 = route0?.segments?.[0];
  const steps: string[] = Array.isArray(segment0?.steps)
    ? segment0!.steps!.map(s => (typeof s.instruction === 'string' ? s.instruction : '')).filter(Boolean)
    : [];

  const distanceMeters = route0?.summary?.distance ?? 0;
  const durationSeconds = route0?.summary?.duration ?? 0;

  const mapUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.latitude}%2C${origin.longitude}%3B${destination.latitude}%2C${destination.longitude}`;

  const summary: RouteSummary = {
    distanceMeters,
    durationSeconds,
    steps,
    mapUrl,
  };
  
  // 5. In Cache speichern (beide: Memory + Firestore)
  await setInCache(cacheKey, summary);
  return summary;
}

export const maps = {
  geocodeAddress,
  getRoute,
};


