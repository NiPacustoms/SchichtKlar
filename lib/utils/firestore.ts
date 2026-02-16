/**
 * Konvertiert Firestore Timestamps sicher zu JavaScript Date Objekten
 * @param timestamp - Firestore Timestamp, Date oder beliebiger Wert
 * @returns JavaScript Date Objekt
 */
export function toDate(timestamp: unknown): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  return new Date(timestamp as string | number);
}

/**
 * Konvertiert JavaScript Date zu Firestore Timestamp
 * @param date - JavaScript Date oder beliebiger Wert
 * @returns JavaScript Date Objekt
 */
export function toTimestamp(date: unknown): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'string') return new Date(date);
  if (typeof date === 'number') return new Date(date);
  return new Date();
}

/**
 * Sichere Objekt-Eigenschaftsabfrage mit Fallback-Wert
 * @param obj - Objekt
 * @param path - Pfad zur Eigenschaft (z.B. 'user.profile.name')
 * @param defaultValue - Fallback-Wert
 * @returns Wert oder Fallback-Wert
 */
export function safeGet<T>(obj: unknown, path: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
  }
  
  return current as T;
}

/**
 * Konvertiert Firestore-Daten rekursiv (Timestamps zu Dates)
 * @param data - Firestore-Daten
 * @returns Konvertierte Daten
 */
export function convertFirestoreData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value && typeof value === 'object' && 'toDate' in value) {
      converted[key] = (value as { toDate: () => Date }).toDate();
    } else if (value && typeof value === 'object') {
      converted[key] = convertFirestoreData(value);
    } else {
      converted[key] = value;
    }
  }
  
  return converted;
}

/**
 * Validiert Firestore-Dokument-ID
 * @param id - Dokument-ID
 * @returns true wenn gültig
 */
export function isValidDocumentId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && id.length <= 1500;
}

/**
 * Generiert eine zufällige Dokument-ID
 * @param length - Länge der ID (Standard: 20)
 * @returns Zufällige ID
 */
export function generateDocumentId(length: number = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Konvertiert ein Date-Objekt zu einem HTML input[type="date"] Wert
 * @param date - Date-Objekt oder null/undefined
 * @returns Formatierter String für HTML input[type="date"]
 */
export function toDateInputValue(date: unknown): string {
  if (!date) return '';
  const dateObj = toDate(date);
  return dateObj.toISOString().split('T')[0];
}

/**
 * Formatiert Firestore-Fehler für bessere Lesbarkeit
 * @param error - Firestore-Fehler
 * @returns Formatierte Fehlermeldung
 */
export function formatFirestoreError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const firestoreError = error as { code: string; message: string };
    
    switch (firestoreError.code) {
      case 'permission-denied':
        return 'Zugriff verweigert. Überprüfen Sie Ihre Berechtigungen.';
      case 'not-found':
        return 'Dokument nicht gefunden.';
      case 'already-exists':
        return 'Dokument existiert bereits.';
      case 'invalid-argument':
        return 'Ungültige Argumente übergeben.';
      case 'deadline-exceeded':
        return 'Zeitüberschreitung. Versuchen Sie es erneut.';
      case 'resource-exhausted':
        return 'Ressourcen erschöpft. Versuchen Sie es später erneut.';
      case 'failed-precondition':
        return 'Vorbedingung nicht erfüllt.';
      case 'aborted':
        return 'Vorgang abgebrochen.';
      case 'out-of-range':
        return 'Wert außerhalb des gültigen Bereichs.';
      case 'unimplemented':
        return 'Funktion nicht implementiert.';
      case 'internal':
        return 'Interner Fehler. Kontaktieren Sie den Support.';
      case 'unavailable':
        return 'Service nicht verfügbar. Versuchen Sie es später erneut.';
      case 'data-loss':
        return 'Datenverlust aufgetreten.';
      case 'unauthenticated':
        return 'Nicht authentifiziert. Bitte melden Sie sich an.';
      default:
        return firestoreError.message || 'Unbekannter Firestore-Fehler.';
    }
  }
  
  return 'Unbekannter Fehler aufgetreten.';
}