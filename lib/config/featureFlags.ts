/**
 * Laufzeit-Schalter der App. Es gibt keine Mock-Daten: die App arbeitet
 * ausschließlich mit Firebase (Auth + Firestore).
 */
export const FEATURE_FLAGS = {
  // Echtzeit-Updates über Firestore-Listener
  USE_REALTIME: true,

  // Umgebung
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;
