import { logger } from '@/lib/logging';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  requestNotificationPermission,
  saveFCMToken,
  removeFCMToken,
  onMessageReceived,
} from '@/lib/services/fcmService';

export function useFCM() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<string | null>(null);

  // Prüfe Notification-Berechtigung
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    setPermission(Notification.permission);
  }, []);

  // Registriere Message-Handler
  useEffect(() => {
    const unsubscribe = onMessageReceived((payload) => {
      logger.info('Message received:', payload);
      
      // Zeige Notification im Browser
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = payload.notification;
        if (notification) {
          new Notification(notification.title || 'Neue Nachricht', {
            body: notification.body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: payload.data?.channelId,
            data: payload.data,
          });
        }
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Token anfordern und speichern
  const requestToken = useCallback(async () => {
    if (!user?.id) {
      setError('User nicht angemeldet');
      return null;
    }

    try {
      setError(null);
      const fcmToken = await requestNotificationPermission();
      
      if (fcmToken) {
        await saveFCMToken(user.id, fcmToken);
        setToken(fcmToken);
        setPermission(Notification.permission);
        return fcmToken;
      } else {
        setError('Token konnte nicht abgerufen werden');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);
      return null;
    }
  }, [user?.id]);

  // Token entfernen
  const removeToken = useCallback(async () => {
    if (!user?.id || !token) {
      return;
    }

    try {
      await removeFCMToken(user.id, token);
      setToken(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);
    }
  }, [user?.id, token]);

  // Automatisch Token anfordern wenn User eingeloggt ist
  useEffect(() => {
    if (user?.id && permission === 'granted' && !token) {
      requestToken().catch((err) =>
        logger.warn('FCM requestToken failed', {}, { error: err instanceof Error ? err.message : String(err) })
      );
    }
  }, [user?.id, permission, token, requestToken]);

  return {
    token,
    permission,
    error,
    requestToken,
    removeToken,
  };
}

