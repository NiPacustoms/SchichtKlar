// Sentry-Server-Konfiguration
// Server-seitiges Error-Tracking für API-Routes und Server-Components

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance-Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release-Tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Sensitive Daten entfernen
  beforeSend(event) {
    // E-Mail-Adressen entfernen
    if (event.user) {
      delete event.user.email;
    }
    
    // Sensitive Felder aus Extra-Daten entfernen
    if (event.extra) {
      delete event.extra.password;
      delete event.extra.token;
      delete event.extra.apiKey;
      delete event.extra.secret;
    }
    
    return event;
  },
  
  // Ignorierte Errors
  ignoreErrors: [
    'Non-Error promise rejection captured',
  ],
});
