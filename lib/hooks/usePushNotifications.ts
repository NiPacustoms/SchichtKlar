'use client';

import { logger } from '@/lib/logging';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getFCMToken,
  saveFCMToken,
  setupMessageListener,
  isPushNotificationSupported,
  requestNotificationPermission,
  sendPushNotification,
} from '@/lib/services/pushNotifications';
import { toast } from '@/lib/utils/toast';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializePushNotifications = useCallback(async () => {
    if (!user?.id || !isPushNotificationSupported()) {
      return;
    }

    // Verhindere mehrfache Initialisierung
    if (isInitialized) {
      return;
    }

    try {
      // Prüfe Berechtigung
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      // Nur initialisieren wenn Berechtigung bereits erteilt wurde
      // Nicht automatisch nach Berechtigung fragen - das sollte der Benutzer selbst tun
      if (currentPermission !== 'granted') {
        return;
      }

      // Warte kurz, um sicherzustellen, dass Service Worker bereit ist
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.ready;
        } catch (error) {
          // Service Worker nicht verfügbar - warte kurz und versuche es erneut
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Hole FCM Token
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        setToken(fcmToken);
        // Speichere Token für den Benutzer
        await saveFCMToken(user.id, fcmToken);
        setIsInitialized(true);
        logger.info('✅ [Push] FCM Token erfolgreich abgerufen und gespeichert');
      } else {
        // Token konnte nicht abgerufen werden - möglicherweise fehlt VAPID Key
        // Nur in Production warnen, in Development ist das optional
        if (process.env.NODE_ENV === 'production') {
          logger.warn('⚠️ [Push] FCM Token konnte nicht abgerufen werden. VAPID Key konfiguriert?');
        }
      }
    } catch (error) {
      logger.error('❌ [Push] Fehler bei der Initialisierung von Push-Benachrichtigungen:', error instanceof Error ? error.message : String(error));
      setIsInitialized(false);
    }
  }, [user?.id, isInitialized]);

  // Prüfe Support und Berechtigung
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsSupported(isPushNotificationSupported());
    setPermission(Notification.permission);

    // Initialisiere Token wenn Benutzer eingeloggt ist
    if (user?.id) {
      initializePushNotifications();
    }
  }, [user?.id, initializePushNotifications]);

  // Setup Message Listener für eingehende Nachrichten
  useEffect(() => {
    if (!isInitialized || !user?.id) {
      return;
    }

    const unsubscribe = setupMessageListener((payload) => {
      // Zeige Benachrichtigung wenn App im Vordergrund ist
      if (payload.notification) {
        toast.info(payload.notification.title || 'Neue Benachrichtigung');

        // Optional: Navigiere zu Link wenn vorhanden
        if (payload.data?.link) {
          // Navigation kann hier implementiert werden
        }
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInitialized, user?.id]);

  const requestPermission = useCallback(async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);

    if (newPermission === 'granted' && user?.id) {
      await initializePushNotifications();
    }

    return newPermission;
  }, [user?.id, initializePushNotifications]);

  const sendNotification = useCallback(async (params: {
    title: string;
    body: string;
    data?: Record<string, string>;
    link?: string;
  }) => {
    if (!user?.id) {
      throw new Error('Benutzer nicht eingeloggt');
    }

    await sendPushNotification({
      userId: user.id,
      ...params,
    });
  }, [user?.id]);

  return {
    isSupported,
    permission,
    token,
    isInitialized,
    requestPermission,
    sendNotification,
  };
}

