/**
 * UI & Context Types
 *
 * Ergänzende Typen für Dialoge, Toasts und React-Kontexte.
 * Diese Typen bauen auf den bestehenden Domain-Typen in `index.ts` / `core.ts` auf,
 * ersetzen diese aber nicht.
 */

import type { OfflineData } from './core';
import type { User } from './user';

/**
 * Dialog-Props für generische Dialog-Komponenten
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /**
   * Optionales Alias für `open` – für Legacy- oder Library-APIs
   */
  isOpen?: boolean;
}

/**
 * Toast / Snackbar Nachrichten
 */
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

/**
 * Offline-Kontext für Offline-First Funktionalität
 * Verwendet das bestehende `OfflineData`-Domain-Modell aus `core.ts`.
 */
export interface OfflineContext {
  isOnline: boolean;
  storeOfflineData: (type: OfflineData['type'], data: OfflineData) => Promise<void>;
  syncOfflineData: () => Promise<void>;
  getOfflineData: () => OfflineData[];
  clearOfflineData: () => void;
  pendingSyncs?: number;
}

/**
 * Auth-Kontext für die Anwendung
 *
 * Verwendet das bestehende `User`-Domain-Modell aus `index.ts`.
 * Die Implementierung kann intern z.B. Firebase Auth nutzen.
 */
export interface AuthContext {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}


