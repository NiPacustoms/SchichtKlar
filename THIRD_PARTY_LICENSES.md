# Third-Party-Lizenzen

**Stand:** 10.07.2026 · Schichtklar

Diese Übersicht listet die direkten Laufzeit-Abhängigkeiten (Production Dependencies) und ihre Lizenzen. Alle sind **permissiv** (MIT/Apache-2.0/ISC/BSD) und erlauben die kommerzielle Nutzung, Weiterverbreitung und den Weiterverkauf des Produkts. Es sind **keine** Copyleft-Lizenzen (GPL/AGPL/LGPL) enthalten, die den Verkauf einschränken würden.

Die vollständige, versionsgenaue Liste inkl. transitiver Abhängigkeiten lässt sich jederzeit erzeugen mit:
```bash
npx license-checker --production --summary
```

## Direkte Laufzeit-Abhängigkeiten

| Paket | Lizenz | Zweck |
|---|---|---|
| next | MIT | Web-Framework (App Router, SSR) |
| react, react-dom | MIT | UI-Runtime |
| @mui/material, @mui/icons-material, @mui/x-date-pickers | MIT | UI-Komponenten (Design-System) |
| @emotion/react, @emotion/styled | MIT | CSS-in-JS (MUI-Styling-Engine) |
| @tanstack/react-query | MIT | Server-State/Caching |
| react-hook-form, @hookform/resolvers | MIT | Formulare |
| zod | MIT | Schema-Validierung |
| firebase-admin | Apache-2.0 | Server-SDK (Firestore/Auth Admin) |
| @sentry/nextjs | MIT | Fehler-Monitoring |
| date-fns | MIT | Datum/Zeit |
| lodash | MIT | Utilities |
| recharts | MIT | Diagramme |
| react-dnd, react-dnd-html5-backend | MIT | Drag & Drop (Dienstplan) |
| jspdf, jspdf-autotable | MIT | PDF-Erzeugung (Nachweise) |
| pdf-lib | MIT | PDF-Manipulation |
| exceljs | MIT (mit Apache-2.0-Teilen) | Excel-Export |
| crypto-js | MIT | Verschlüsselung (clientseitig) |
| isomorphic-dompurify | (Apache-2.0/MPL-2.0 – DOMPurify) | HTML-Sanitisierung |
| @babel/runtime | MIT | Babel-Runtime-Helpers |
| baseline-browser-mapping | (Build-Tooling, Apache-2.0) | Browserslist-Daten |

> `isomorphic-dompurify` bündelt DOMPurify (Dual-License Apache-2.0 **oder** MPL-2.0). Beide erlauben kommerzielle Nutzung; MPL-2.0 ist file-level-copyleft und betrifft nur Änderungen an DOMPurify selbst (hier nicht der Fall).

## Hinweis für den Käufer

- Firebase (`firebase-admin`, `firebase`) steht unter Apache-2.0; die **Nutzung des Firebase-Dienstes** unterliegt zusätzlich den Google-Cloud-Nutzungsbedingungen (kommerziell zulässig, kostenpflichtig nach Verbrauch).
- Vor Auslieferung empfohlen: `npx license-checker --production --failOn 'GPL;AGPL;LGPL'` als CI-Gate, um versehentlich eingeschleuste Copyleft-Abhängigkeiten auszuschließen.
