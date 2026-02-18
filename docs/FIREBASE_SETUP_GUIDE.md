# Firebase Setup für JobFlow

## Problem: "Expected first argument to collection() to be a CollectionReference"

Dieser Fehler tritt auf, wenn die Firebase-Konfiguration nicht korrekt eingerichtet ist.

## Lösung

### 1. Firebase-Projekt erstellen

1. Gehen Sie zu [Firebase Console](https://console.firebase.google.com/)
2. Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes aus
3. Aktivieren Sie Firestore Database
4. Aktivieren Sie Authentication

### 2. Umgebungsvariablen einrichten

Erstellen Sie eine `.env.local` Datei im Projektverzeichnis mit folgenden Inhalten:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Emulator Settings (optional für Entwicklung)
NEXT_PUBLIC_USE_EMULATOR=false
```

### 3. Firebase-Konfiguration abrufen

1. Gehen Sie zu Firebase Console → Project Settings → General
2. Scrollen Sie nach unten zu "Your apps"
3. Klicken Sie auf das Web-Symbol (</>) um eine Web-App hinzuzufügen
4. Kopieren Sie die Konfigurationswerte in Ihre `.env.local` Datei

### 4. Firestore-Regeln einrichten

Stellen Sie sicher, dass Ihre `firestore.rules` Datei korrekt konfiguriert ist.

### 5. Entwicklungsserver neu starten

```bash
npm run dev
```

## Häufige Probleme

### Problem: "Missing Firebase environment variables"

**Lösung:** Stellen Sie sicher, dass alle erforderlichen Umgebungsvariablen in `.env.local` gesetzt sind.

### Problem: "Firestore instance could not be initialized"

**Lösung:** Überprüfen Sie Ihre Firebase-Konfiguration und stellen Sie sicher, dass Firestore in der Firebase Console aktiviert ist.

### Problem: Emulator-Verbindung schlägt fehl

**Lösung:** Stellen Sie sicher, dass die Firebase-Emulatoren laufen:

```bash
firebase emulators:start
```

## Debugging

Falls das Problem weiterhin besteht, überprüfen Sie:

1. **Browser-Konsole:** Schauen Sie nach Fehlermeldungen
2. **Firebase Console:** Überprüfen Sie, ob Ihr Projekt korrekt konfiguriert ist
3. **Umgebungsvariablen:** Stellen Sie sicher, dass alle Variablen korrekt gesetzt sind
4. **Netzwerk:** Überprüfen Sie, ob keine Firewall die Verbindung blockiert

## Support

Bei weiteren Problemen überprüfen Sie die [Firebase-Dokumentation](https://firebase.google.com/docs) oder erstellen Sie ein Issue im Projekt-Repository.
