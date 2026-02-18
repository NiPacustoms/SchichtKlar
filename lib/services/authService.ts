import {
  User,
  type IdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, getDb } from '../firebase';
import { logger } from '@/lib/logging';

type SupportedUserRole = 'admin' | 'nurse';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: SupportedUserRole;
  facilityId?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

class AuthService {
  // Anmeldung mit E-Mail und Passwort
  static async signIn(email: string, password: string): Promise<User> {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.updateLastLogin(userCredential.user.uid);
      return userCredential.user;
  }

  // Registrierung neuer Benutzer
  // HINWEIS: Direkte Registrierungen sind deaktiviert. Nur Admins können sich über /admin-register registrieren.
  // Mitarbeiter werden über das Einladungssystem hinzugefügt.
  static async signUp(
    email: string,
    password: string,
    displayName: string,
    _role: SupportedUserRole = 'nurse'
  ): Promise<User> {
    throw new Error(
      'Die öffentliche Registrierung ist deaktiviert. ' +
      'Nur Administratoren können sich über /admin-register registrieren. ' +
      'Mitarbeiter benötigen eine Einladung von ihrem Administrator.'
    );
  }

  // Abmeldung
  static async signOut(): Promise<void> {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    await signOut(auth);
  }

  // Auth State Listener
  static onAuthStateChanged(callback: (user: User | null) => void) {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    return onAuthStateChanged(auth, callback);
  }

  // Benutzerprofil abrufen
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(getDb(), 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  }

  // Letzten Login aktualisieren
  private static async updateLastLogin(uid: string): Promise<void> {
    await setDoc(
      doc(getDb(), 'users', uid),
      {
        lastLoginAt: new Date(),
      },
      { merge: true }
    );
  }

  // Aktueller Benutzer
  static getCurrentUser(): User | null {
    return auth?.currentUser || null;
  }

  /** Setzt __session-Cookie für Middleware (Zugriff auf /admin und /employee). Wirft bei Fehler, damit kein Redirect ohne Cookie erfolgt. */
  static async setSessionCookie(firebaseUser: User): Promise<void> {
    const token = await firebaseUser.getIdToken();
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text();
      logger.warn('Session cookie set failed', {}, { status: res.status, body: text });
      throw new Error(`Session fehlgeschlagen (${res.status}). Bitte erneut anmelden.`);
    }
  }

  /** Entfernt __session-Cookie (Logout). */
  static async clearSessionCookie(): Promise<void> {
    try {
      await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' });
    } catch {
      // ignore
    }
  }

  /** Synchronisiert Custom Claims vom Server; gibt neues IdTokenResult zurück oder null bei Fehler. */
  static async syncClaimsFromServer(firebaseUser: User, reason: string): Promise<IdTokenResult | null> {
    if (typeof window === 'undefined') return null;
    try {
      const token = await firebaseUser.getIdToken(true);
      const response = await fetch('/api/auth/sync-claims', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        let message = 'Sync custom claims failed';
        try {
          const body = await response.json();
          if (body?.message) message = body.message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      await firebaseUser.getIdToken(true);
      return firebaseUser.getIdTokenResult(true);
    } catch (error) {
      logger.warn('Failed to sync custom claims', { component: 'AuthService', action: 'syncClaimsFromServer' }, {
        reason,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  // Registrierung (Alias für signUp)
  static async register(
    email: string,
    password: string,
    displayName: string,
    role: SupportedUserRole = 'nurse'
  ): Promise<User> {
    return this.signUp(email, password, displayName, role);
  }
}

// Export the class and singleton instance
export { AuthService };
export const authService = new AuthService();
