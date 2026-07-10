// Firebase Cloud Messaging Service Worker
// Diese Datei wird für Background-Notifications benötigt, wenn die App nicht im Vordergrund ist

// Lade Firebase SDKs (compat-Version für Service Worker)
// Verwende Version 11.x für bessere Kompatibilität mit Firebase 12.x
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// WICHTIG: Firebase-Konfiguration muss über postMessage gesendet werden
// Diese Datei wird als Fallback verwendet, wenn die Route-Datei nicht verfügbar ist
// Die Konfiguration wird vom Client über postMessage gesendet
let firebaseConfig = null;
let messaging = null;

// Warte auf Konfiguration vom Client und initialisiere SOFORT
// Dies ist erforderlich, damit die Event Handler für 'push', 'pushsubscriptionchange'
// und 'notificationclick' korrekt registriert werden
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG' && !messaging) {
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

// Initialisiere Firebase Messaging
function initializeFirebase() {
  if (!firebaseConfig || messaging) {
    return;
  }

  try {
    // Initialisiere Firebase mit der Konfiguration
    firebase.initializeApp(firebaseConfig);

    // Hole Messaging-Instanz - dies registriert automatisch die Event Handler
    messaging = firebase.messaging();

    // Background Message Handler
    // Wird aufgerufen, wenn eine Nachricht empfangen wird, während die App im Hintergrund ist
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);

      const notificationTitle = payload.notification?.title || 'Schichtklar';
      const notificationOptions = {
        body: payload.notification?.body || 'Sie haben eine neue Benachrichtigung',
        icon: payload.notification?.icon || '/favicon-192.png',
        badge: payload.notification?.badge || '/favicon-96.png',
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

    console.log('[firebase-messaging-sw.js] Firebase Messaging initialisiert');
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Fehler bei Firebase-Initialisierung:', error);
  }
}

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
      console.error('[firebase-messaging-sw.js] Fehler beim Öffnen des Clients:', error);
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});

