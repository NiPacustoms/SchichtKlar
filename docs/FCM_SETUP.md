# FCM (Firebase Cloud Messaging) Setup

**Datum:** 2025-01-27  
**Status:** ✅ **IMPLEMENTIERT**

---

## Übersicht

FCM-Integration für Push-Notifications im Chat-System wurde vollständig implementiert.

---

## 1. Implementierte Komponenten

### 1.1 FCM Service (`lib/services/fcmService.ts`)

**Funktionen:**

- `initMessaging()`: Initialisiert Firebase Messaging
- `requestNotificationPermission()`: Fragt nach Browser-Berechtigung und holt FCM-Token
- `saveFCMToken()`: Speichert Token im User-Dokument
- `removeFCMToken()`: Entfernt Token aus User-Dokument
- `onMessageReceived()`: Registriert Handler für eingehende Notifications

**Features:**

- Multi-Device-Support (bis zu 5 Tokens pro User)
- Automatische Token-Verwaltung
- Browser-Notification-Support

---

### 1.2 FCM Hook (`lib/hooks/useFCM.ts`)

**Funktionen:**

- Automatische Token-Anforderung bei Login
- Permission-Status-Tracking
- Message-Handler-Registrierung
- Browser-Notification-Anzeige

**Verwendung:**

```typescript
const { token, permission, requestToken, error } = useFCM();
```

---

### 1.3 Notification Settings Component (`components/chat/NotificationSettings.tsx`)

**Features:**

- Chat-Notification Toggle
- Permission-Status-Anzeige
- Token-Verwaltung
- Integration in Profil-Seite

---

## 2. Konfiguration

### 2.1 Environment Variables

**Erforderlich:**

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key-here
```

**VAPID Key generieren:**

1. Firebase Console öffnen
2. Project Settings → Cloud Messaging
3. Web Push certificates → Generate key pair
4. Key kopieren und in `.env.local` eintragen

---

### 2.2 Firebase Console Setup

1. **Cloud Messaging aktivieren:**
   - Firebase Console → Project Settings → Cloud Messaging
   - Web Push certificates konfigurieren

2. **Service Worker (Optional):**
   - Für Background-Notifications
   - Datei: `public/firebase-messaging-sw.js`

---

## 3. User-Dokument Struktur

**FCM-Token-Felder:**

```typescript
{
  fcmToken: string; // Haupt-Token (Rückwärtskompatibilität)
  fcmTokens: string[]; // Array aller Tokens (max. 5)
  fcmTokenUpdatedAt: Date;
  notificationSettings: {
    chatEnabled: boolean; // Default: true
    // ... andere Settings
  };
}
```

---

## 4. Notification-Einstellungen

**Speicherort:**

- `users/{userId}/notificationSettings.chatEnabled`

**Standard:**

- `chatEnabled: true` (aktiviert)

**Deaktivierung:**

- User kann in Profil → Einstellungen → Chat-Benachrichtigungen deaktivieren
- Cloud Function prüft diese Einstellung vor dem Senden

---

## 5. Cloud Function Integration

**`functions/src/chat/sendChatNotification.ts`:**

- Prüft `fcmToken` oder `fcmTokens[0]`
- Prüft `notificationSettings.chatEnabled`
- Sendet Notification an alle Teilnehmer außer Sender

---

## 6. Browser-Support

**Unterstützt:**

- Chrome/Edge (Desktop & Mobile)
- Firefox (Desktop & Mobile)
- Safari (iOS 16.4+)
- Opera

**Nicht unterstützt:**

- Safari Desktop (kein Web Push Support)

---

## 7. Testing

### 7.1 Manuelle Tests

1. **Permission anfordern:**
   - Profil → Einstellungen → Chat-Benachrichtigungen
   - "Berechtigung anfordern" klicken
   - Browser-Dialog bestätigen

2. **Token speichern:**
   - Token wird automatisch nach Permission-Erteilung gespeichert
   - Prüfe in Firestore: `users/{userId}/fcmToken`

3. **Notification senden:**
   - Chat-Nachricht senden
   - Notification sollte erscheinen (wenn App nicht im Vordergrund)

4. **Settings testen:**
   - Chat-Notifications deaktivieren
   - Neue Nachricht senden
   - Keine Notification sollte erscheinen

---

## 8. Troubleshooting

### Problem: Token wird nicht gespeichert

**Lösung:**

- Prüfe Browser-Konsole auf Fehler
- Prüfe Firestore Rules (User muss `users/{userId}` schreiben können)
- Prüfe VAPID Key in `.env.local`

### Problem: Notifications werden nicht empfangen

**Lösung:**

- Prüfe `notificationSettings.chatEnabled` (muss `true` sein)
- Prüfe `fcmToken` im User-Dokument
- Prüfe Browser-Notification-Berechtigung
- Prüfe Cloud Function Logs

### Problem: Permission wird nicht erteilt

**Lösung:**

- Browser-Einstellungen prüfen
- HTTPS erforderlich (nicht HTTP)
- Service Worker muss registriert sein (für Background-Notifications)

---

## 9. Nächste Schritte

### 9.1 Service Worker (Optional)

Für Background-Notifications:

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  // Firebase Config
});

const messaging = firebase.messaging();
```

### 9.2 Notification Click Handler

```typescript
// In App-Komponente
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      const data = event.data;
      if (data.type === 'notification-click') {
        // Navigate to chat
        router.push(`/chat/${data.channelId}`);
      }
    });
  }
}, []);
```

---

**Erstellt:** 2025-01-27  
**Status:** ✅ **VOLLSTÄNDIG IMPLEMENTIERT**
