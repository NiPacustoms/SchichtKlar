/* eslint-disable @typescript-eslint/no-explicit-any */
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, getDb } from '@/lib/firebase';
import { getApp } from 'firebase/app';
import { logger } from '@/lib/logging';

let messaging: Messaging | null = null;

/**
 * Initialisiert Firebase Cloud Messaging
 */
export function initMessaging(): Messaging | null {
  if (typeof window === 'undefined') {
    return null; // SSR - kein Messaging
  }

  try {
    if (!messaging) {
      const app = getApp();
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (error) {
    logger.error('Fehler beim Initialisieren von FCM', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Fragt nach Notification-Berechtigung und holt FCM-Token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const msg = initMessaging();
  if (!msg) {
    logger.warn('Messaging nicht initialisiert');
    return null;
  }

  try {
    // Prüfe Browser-Support
    if (!('Notification' in window)) {
      logger.warn('Browser unterstützt keine Notifications');
      return null;
    }

    // Prüfe Berechtigung
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      logger.warn('Notification-Berechtigung nicht erteilt');
      return null;
    }

    // Hole FCM-Token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      logger.warn('VAPID Key nicht konfiguriert');
      return null;
    }

    const token = await getToken(msg, { vapidKey });
    return token;
  } catch (error) {
    logger.error('Fehler beim Abrufen des FCM-Tokens', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Speichert FCM-Token im User-Dokument
 */
export async function saveFCMToken(userId: string, token: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore nicht initialisiert');
  }

  try {
    const userRef = doc(getDb(), 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User-Dokument existiert nicht');
    }

    const userData = userDoc.data();
    const existingTokens = userData.fcmTokens || [];
    
    // Prüfe ob Token bereits vorhanden
    if (existingTokens.includes(token)) {
      return; // Token bereits vorhanden
    }

    // Füge Token hinzu (max. 5 Tokens pro User für Multi-Device-Support)
    const updatedTokens = [...existingTokens, token].slice(-5);

    await updateDoc(userRef, {
      fcmToken: token, // Haupt-Token (für Rückwärtskompatibilität)
      fcmTokens: updatedTokens, // Array aller Tokens
      fcmTokenUpdatedAt: new Date(),
    });
  } catch (error) {
    logger.error('Fehler beim Speichern des FCM-Tokens', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Entfernt FCM-Token aus User-Dokument
 */
export async function removeFCMToken(userId: string, token: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore nicht initialisiert');
  }

  try {
    const userRef = doc(getDb(), 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return;
    }

    const userData = userDoc.data();
    const existingTokens = userData.fcmTokens || [];
    const updatedTokens = existingTokens.filter((t: string) => t !== token);

    await updateDoc(userRef, {
      fcmTokens: updatedTokens,
      fcmToken: updatedTokens[0] || null, // Haupt-Token auf erstes Element setzen oder null
    });
  } catch (error) {
    logger.error('Fehler beim Entfernen des FCM-Tokens', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Registriert Message-Handler für eingehende Notifications
 */
export function onMessageReceived(callback: (payload: any) => void): (() => void) | null {
  const msg = initMessaging();
  if (!msg) {
    return null;
  }

  try {
    return onMessage(msg, callback);
  } catch (error) {
    logger.error('Fehler beim Registrieren des Message-Handlers', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

