'use client';

import { logger } from '@/lib/logging';

import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

export function PushNotificationInitializer() {
  const { isSupported, isInitialized, permission } = usePushNotifications();
  const initLogRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isSupported && !isInitialized && !initLogRef.current) {
      // Logge nur einmal beim Start der Initialisierung
      logger.info('🔔 [Push] Push-Benachrichtigungen werden initialisiert...', {
        permission,
        supported: isSupported,
      });
      initLogRef.current = true;
    }

    if (isInitialized && initLogRef.current) {
      logger.info('✅ [Push] Push-Benachrichtigungen erfolgreich initialisiert');
      initLogRef.current = false; // Reset für mögliche Re-Initialisierung
    }
  }, [isSupported, isInitialized, permission]);

  // Diese Komponente rendert nichts, sie initialisiert nur die Push-Benachrichtigungen
  return null;
}
