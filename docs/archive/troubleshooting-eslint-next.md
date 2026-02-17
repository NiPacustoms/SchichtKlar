# Troubleshooting: ESLint & Next.js Build

## ESLint: `require(...).execute is not a function`

- **Ursache:** Es existieren zwei Config-Formate (`.eslintrc.json` und `eslint.config.mjs`). Bei ESLint 8 kann die Kombination oder die Flat-Config-Ladung zu diesem Fehler führen. Zusätzlich kann `@eslint/eslintrc` (Legacy.ConfigOps) fehlerhaft aufgelöst werden.
- **Lösungen:**
  1. **Saubere Installation:** `npm ci` (oder `rm -rf node_modules && npm install`) ausführen.
  2. **Nur Legacy-Config nutzen:** `eslint.config.mjs` vorübergehend umbenennen (z. B. in `eslint.flat.config.mjs.bak`), dann `npm run lint` erneut ausführen. Dann verwendet ESLint nur noch `.eslintrc.json`.
  3. **Auf ESLint 9 umsteigen (Flat Config):**  
     `npm install eslint@^9 --save-dev`  
     Anschließend im `package.json`-Script `lint` die Option `--ext` entfernen (in ESLint 9 übernimmt die Flat Config die Datei-Auswahl). Ggf. `eslint-config-next` und Plugins auf mit ESLint 9 kompatible Versionen prüfen.

## Next.js Build: `(0 , _build.default) is not a function`

- **Ursache:** Oft fehlerhafte oder inkonsistente `node_modules` (z. B. nach Branch-Wechsel oder abgebrochenem Install). Bei Next.js 15.x kann in Einzelfällen auch ein bekanntes Bundling-Problem mit bestimmten Drittanbieter-Bibliotheken auftreten.
- **Lösungen:**
  1. **Saubere Installation:**  
     `rm -rf node_modules .next && npm ci`  
     Anschließend: `npm run build`.
  2. **Cache leeren:**  
     `rm -rf .next` dann erneut `npm run build`.
  3. **Falls der Fehler bleibt:** Next.js auf 14.x downgraden (in `package.json`: `"next": "14.2.x"`) und erneut `npm install` und `npm run build` ausführen. Danach prüfen, ob der Fehler weg ist (Hinweis auf ein Next-15-spezifisches Problem).

## Übernahme der Änderungen im Projekt

- In `package.json` ist ein **Override** für `@eslint/eslintrc: 2.1.4` eingetragen, damit nur eine Version geladen wird und `Legacy.ConfigOps` verfügbar ist.
- Damit die Overrides wirken, muss eine **frische Installation** laufen. Vorher alle Prozesse beenden, die auf `node_modules` zugreifen (z. B. Dev-Server, IDE-Terminals).

## Empfohlene Reihenfolge

1. Alle Terminals/Prozesse mit `npm run dev` oder anderen Node-Befehlen in diesem Projekt beenden.
2. `rm -rf node_modules .next`
3. `npm ci` (oder `npm install`)
3. `npm run typecheck` (sollte bereits funktionieren)
4. `npm run lint`
5. `npm run build`

Wenn Schritt 4 oder 5 fehlschlägt, die jeweiligen Absätze oben anwenden.
