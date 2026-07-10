# Deployment (nur Firebase)

Schichtklar nutzt **keine GitHub Actions**. Build und Deploy laufen ausschließlich über Firebase.

## Option 1: Firebase Console – GitHub-Anbindung

1. [Firebase Console](https://console.firebase.google.com) → dein Projekt → **Hosting**
2. **Get started** bzw. **Verbinden** → **GitHub** auswählen
3. Repo autorisieren und Branch wählen (z. B. `main`)
4. Firebase baut und deployed bei jedem Push automatisch.

Konfiguration, Build-Befehl und Ausgabeordner werden in der Console festgelegt (z. B. Build command: `npm run build`, Output: `.next` bzw. das von der Firebase Next.js-Integration vorgegebene).

## Option 2: Lokal mit Firebase CLI

Voraussetzung: eingeloggt mit `firebase login` und Projekt mit `firebase use <projectId>` gesetzt.

```bash
# Alles deployen (Hosting, Functions, Firestore-Regeln, Storage-Regeln)
npm run deploy

# Nur Hosting (Next.js bauen + deployen)
npm run deploy:hosting

# Nur Firestore-Regeln
firebase deploy --only firestore

# Nur Storage-Regeln
npm run storage:deploy-rules
```

## Storage CORS (lokal)

Falls du CORS für Cloud Storage setzen musst (z. B. für Uploads aus dem Browser):

```bash
npm run storage:cors
```

Dafür muss ein Service-Account konfiguriert sein (z. B. `firebase:setup` / `GOOGLE_APPLICATION_CREDENTIALS`).

## Nützliche Skripte

| Befehl | Beschreibung |
|--------|--------------|
| `npm run firebase:setup` | Service-Account einrichten |
| `npm run firebase:verify` | Firebase-Anbindung prüfen |
| `npm run firebase:enable-apis` | Benötigte APIs aktivieren |
| `npm run firebase:fix-permissions` | Service-Account-Berechtigungen anpassen |
