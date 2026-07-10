import { NextResponse } from 'next/server';

// Firebase Cloud Messaging Service Worker
// Diese Datei wird für Background-Notifications benötigt, wenn die App nicht im Vordergrund ist
const serviceWorkerCode = `// Firebase Cloud Messaging Service Worker
// Diese Datei wird für Background-Notifications benötigt, wenn die App nicht im Vordergrund ist

// Lade Firebase SDKs (compat-Version für Service Worker)
// Verwende Version 11.x für bessere Kompatibilität mit Firebase 12.x
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Firebase-Konfiguration direkt beim Build-Zeitpunkt eingebettet
// WICHTIG: Diese muss beim initialen Laden verfügbar sein, damit Firebase Messaging
// die Event Handler korrekt registrieren kann
const firebaseConfig = {
  apiKey: '${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}',
  authDomain: '${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}',
  projectId: '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}',
  storageBucket: '${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}',
  messagingSenderId: '${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}',
  appId: '${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}',
};

// Initialisiere Firebase Messaging SOFORT beim initialen Laden
// Dies ist erforderlich, damit die Event Handler für 'push', 'pushsubscriptionchange'
// und 'notificationclick' korrekt registriert werden
let messaging = null;
try {
  // Initialisiere Firebase mit der Konfiguration
  firebase.initializeApp(firebaseConfig);

  // Hole Messaging-Instanz - dies registriert automatisch die Event Handler
  messaging = firebase.messaging();

  // Background Message Handler
  // Wird aufgerufen, wenn eine Nachricht empfangen wird, während die App im Hintergrund ist
  messaging.onBackgroundMessage((payload) => {
    logger.info('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'Schichtklar';
    const notificationOptions = {
      body: payload.notification?.body || 'Sie haben eine neue Benachrichtigung',
      icon: payload.notification?.icon || '/icons/icon-192x192.png',
      badge: payload.notification?.badge || '/icons/icon-96x96.png',
      data: payload.data || {},
      tag: payload.data?.tag || 'default',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      actions: payload.data?.link ? [
        {
          action: 'open',
          title: 'Öffnen',
        },
        {
          action: 'close',
          title: 'Schließen',
        },
      ] : [],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

  logger.info('[firebase-messaging-sw.js] Firebase Messaging initialisiert');
} catch (error) {
  logger.error('[firebase-messaging-sw.js] Fehler bei Firebase-Initialisierung:', error);
}

// Fallback: Unterstützung für dynamische Konfiguration über postMessage (falls benötigt)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG' && !messaging) {
    try {
      const config = event.data.config;
      firebase.initializeApp(config);
      messaging = firebase.messaging();
      logger.info('[firebase-messaging-sw.js] Firebase Messaging über postMessage initialisiert');
    } catch (error) {
      logger.error('[firebase-messaging-sw.js] Fehler bei Firebase-Initialisierung über postMessage:', error);
    }
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action || 'open';
  const link = notificationData.link || '/';

  if (action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Prüfe ob bereits ein Fenster/Tab geöffnet ist
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            // Navigiere zu Link wenn vorhanden
            if (link && link !== '/') {
              if (client.navigate) {
                return client.navigate(link);
              } else {
                client.postMessage({ type: 'NAVIGATE', url: link });
                return Promise.resolve();
              }
            }
          });
        }
      }
      // Öffne neues Fenster/Tab
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    }).catch((error) => {
      logger.error('[firebase-messaging-sw.js] Fehler beim Öffnen des Clients:', error);
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
`;

export async function GET() {
  return new NextResponse(serviceWorkerCode, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
