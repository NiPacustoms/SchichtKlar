'use client';

import { User } from '@/lib/types';
import { logger } from '@/lib/logging';
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { firebaseAuthErrorMessages } from '@/lib/validations/authForms';
import { AuthService } from '@/lib/services/authService';
import { authUserService } from '@/lib/services/authUserService';

declare global {
  interface Window {
    __E2E_TEST_MODE__?: boolean;
  }
}

interface AuthContextType {
  user: (User & { facilityIds?: string[] }) | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  /** Nach Login, wenn Session-Cookie fehlschlägt (z. B. Firebase Admin in Dev nicht aktiv) */
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendEmailVerificationEmail: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const isE2ETestMode = typeof window !== 'undefined' && window.__E2E_TEST_MODE__ === true;

  const handleLoadingTimeout = useCallback(() => {
    setLoading((prev) => {
      if (prev) {
        logger.debug('Auth loading timeout reached, forcing loading to false');
        return false;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(handleLoadingTimeout, 20000);
    return () => clearTimeout(timeout);
  }, [handleLoadingTimeout]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    if (!auth) {
      logger.warn('Firebase Auth not initialized');
      setLoading(false);
      return;
    }
    if (isE2ETestMode) {
      logger.debug('E2E Test Mode detected, skipping Firebase auth listener');
      setLoading(false);
      setUser(null);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((fbUser: FirebaseUser | null) => {
      setAuthError(null);
      if (fbUser) {
        // Sofort anzeigen: App mit Fallback-User nutzbar machen, dann volles Profil im Hintergrund laden
        setUser(authUserService.buildFallbackUser(fbUser));
        setFirebaseUser(fbUser);
        setLoading(false);
        (async () => {
          try {
            await AuthService.setSessionCookie(fbUser);
            const loadedUser = await authUserService.loadUserForAuth(fbUser);
            if (loadedUser) {
              setUser(loadedUser);
            }
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            setAuthError(msg || 'Sitzung konnte nicht eingerichtet werden.');
            logger.error('Session/User fehlgeschlagen', error instanceof Error ? error : new Error(String(error)));
          }
        })();
      } else {
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
        void AuthService.clearSessionCookie();
      }
    });

    return () => unsubscribe();
  }, [isE2ETestMode]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    if (isE2ETestMode) {
      if (!email?.trim() || !password?.trim()) {
        throw new Error('E-Mail und Passwort sind erforderlich');
      }
      const lower = email.toLowerCase();
      const derivedRole: User['role'] = lower.includes('admin') ? 'admin' : 'nurse';
      const mock: User = {
        id: `e2e-${derivedRole}-user`,
        email,
        displayName: `E2E ${derivedRole}`,
        role: derivedRole,
        active: true,
        phone: '',
        qualifications: [],
        documents: [],
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          shiftReminders: true,
          documentExpiry: true,
          systemAnnouncements: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUser(mock);
      setFirebaseUser(null);
      if (typeof window !== 'undefined') {
        (window as unknown as { __JOBFLOW_USER_ROLE?: string }).__JOBFLOW_USER_ROLE = mock.role;
      }
      return;
    }

    if (!email?.trim() || !password?.trim()) {
      throw new Error('E-Mail und Passwort sind erforderlich');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Ungültige E-Mail-Adresse');
    }
    logger.debug('Attempting Firebase authentication', {}, { email });
    if (!auth) throw new Error('Firebase Auth not initialized');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      logger.info('Firebase authentication successful', {}, { email });
      // Direkt nach Login: Session setzen und User übernehmen (nicht auf onAuthStateChanged warten)
      const fbUser = auth.currentUser;
      if (fbUser) {
        try {
          await AuthService.setSessionCookie(fbUser);
          const loadedUser = await authUserService.loadUserForAuth(fbUser);
          if (loadedUser) {
            setUser(loadedUser);
          } else {
            setUser(authUserService.buildFallbackUser(fbUser));
          }
          setFirebaseUser(fbUser);
        } catch (sessionError) {
          const msg = sessionError instanceof Error ? sessionError.message : String(sessionError);
          setAuthError(msg || 'Sitzung konnte nicht eingerichtet werden.');
          setUser(null);
          setFirebaseUser(null);
          setLoading(false);
          throw sessionError;
        }
      }
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      logger.error('Firebase authentication failed', error instanceof Error ? error : new Error(String(error)));
      const code = (error as { code?: string })?.code;
      const errorMessage =
        (code && firebaseAuthErrorMessages[code as keyof typeof firebaseAuthErrorMessages]) ||
        'Anmeldung fehlgeschlagen';
      throw new Error(errorMessage);
    }
  }, [isE2ETestMode]);

  const signOutUser = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'test' || isE2ETestMode) {
        setUser(null);
        setFirebaseUser(null);
        return;
      }
      await AuthService.clearSessionCookie();
      if (!auth) throw new Error('Firebase Auth not initialized');
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error: unknown) {
      throw new Error((error as Error).message || 'Logout fehlgeschlagen');
    }
  }, [isE2ETestMode]);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    try {
      await authUserService.updateAuthUserProfile(user.id, data);
      setUser((prev) => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      logger.error('Failed to update user', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Benutzeraktualisierung fehlgeschlagen');
    }
  }, [user]);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!email?.trim()) throw new Error('E-Mail ist erforderlich');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ungültige E-Mail-Adresse');
    if (!auth) throw new Error('Firebase Auth not initialized');
    const actionCodeSettings = {
      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/anmelden`,
      handleCodeInApp: false,
    };
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (error: unknown) {
      logger.error('Password reset failed', error instanceof Error ? error : new Error(String(error)));
      const code = (error as { code?: string })?.code;
      const errorMessage =
        (code && firebaseAuthErrorMessages[code as keyof typeof firebaseAuthErrorMessages]) ||
        'Fehler beim Senden der Passwort-Reset-E-Mail';
      throw new Error(errorMessage);
    }
  }, []);

  const sendEmailVerificationEmail = useCallback(async () => {
    if (!auth?.currentUser) throw new Error('Kein Benutzer angemeldet');
    const actionCodeSettings = {
      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/anmelden`,
      handleCodeInApp: false,
    };
    try {
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
    } catch (error: unknown) {
      logger.error('Email verification failed', error instanceof Error ? error : new Error(String(error)));
      const code = (error as { code?: string })?.code;
      const errorMessage =
        (code && firebaseAuthErrorMessages[code as keyof typeof firebaseAuthErrorMessages]) ||
        'Fehler beim Senden der E-Mail-Verifizierung';
      throw new Error(errorMessage);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      authError,
      signIn,
      signOut: signOutUser,
      updateUser,
      sendPasswordReset,
      sendEmailVerificationEmail,
    }),
    [user, firebaseUser, loading, authError, signIn, signOutUser, updateUser, sendPasswordReset, sendEmailVerificationEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
