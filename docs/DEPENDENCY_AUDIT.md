# Dependency-Audit (Phase 7 – Marktreife)

**Stand:** 10.07.2026 · Branch `chore/rename-jobflow-to-schichtklar`
**Methode:** `npm ls`, `npm audit`, Import-Referenzanalyse, Lizenzprüfung.

## 1. Zusammenfassung

- **Lizenzen:** ausschließlich permissiv (MIT/Apache-2.0/ISC/BSD) → kommerzieller Weiterverkauf uneingeschränkt möglich. Details: `THIRD_PARTY_LICENSES.md`.
- **Kritische Sicherheitslücken:** **0** (der jsPDF-Object-Injection-Befund wurde in Phase 4 durch Bump auf `^4.2.1` behoben).
- **Ungenutzte Pakete:** 3 entfernt (`@react-pdf/renderer`, `html2canvas`, `nanoid`) – reduziert Bundle- und Supply-Chain-Fläche.
- **Verbleibende Advisories:** 13 hoch / 34 moderate – **alle transitiv** über Build-/Test-/Admin-Tooling, keine im clientseitig ausgelieferten Laufzeitpfad kritisch. Bewertung unten.

## 2. Entfernte ungenutzte Dependencies

| Paket | Nachweis „ungenutzt" | Auswirkung |
|---|---|---|
| `@react-pdf/renderer` | 0 Code-Referenzen (nur in Alt-Doku); PDF-Erzeugung läuft über `jspdf`/`pdf-lib` | keine (Build grün) |
| `html2canvas` | 0 Referenzen; jsPDF `.html()` wird nirgends genutzt (die einzige Funktion, die html2canvas als Peer bräuchte) | keine |
| `nanoid` | 0 Referenzen; ID-Erzeugung via `crypto.randomUUID`/Firestore-IDs | keine |

**Behalten trotz 0 direkter Referenzen:** `baseline-browser-mapping` (Browserslist-/Build-Datenpaket; Entfernung mit Build-Risiko behaftet, geringer Nutzen), diverse `@types/*` (typ-nur, in `tsconfig`/IDE genutzt), `@babel/runtime`, `react-dom` (Next.js-Laufzeit).

## 3. Verbleibende `npm audit`-Befunde (13 hoch, transitiv)

| Paket | Über | Einordnung |
|---|---|---|
| `rollup`, `serialize-javascript` | Storybook/Build-Toolchain | **DevDependency** – nicht im Auslieferungsartefakt |
| `@grpc/grpc-js`, `node-forge` | `firebase-admin` (Server) | serverseitig; Fix folgt mit `firebase-admin`-Update |
| `fast-uri`, `form-data`, `ws`, `tmp`, `minimatch`, `picomatch` | transitive Build-/Netzwerk-Utilities | überwiegend Dev/Build; kein direkter Nutzereingabepfad |
| `next` (moderate: Request-Smuggling in Rewrites, `<15.5.13`) | direkt | **empfohlener Patch:** `next` auf `>=15.5.13` anheben (Minor, geringes Risiko) → in Folge-PR |

**Warum nicht `npm audit fix --force` in diesem PR:** Der `--force`-Pfad enthält Breaking-Major-Upgrades (u. a. Storybook/ESLint-Ökosystem), die eigene Regressionstests erfordern. Gemäß Auftrag („Pakete nur kontrolliert aktualisieren, keine riskanten Major-Upgrades") werden diese in einem separaten, testbegleiteten Wartungs-PR gebündelt.

## 4. Empfohlene Maßnahmen (Folge-PR / Käufer)

1. `next` auf den neuesten 15.5.x-Patch heben (schließt Rewrite-Smuggling-Advisory).
2. `firebase-admin` auf die neueste 12.x/13.x-Version aktualisieren (schließt `@grpc/grpc-js`, `node-forge`) – mit Funktionstest der Server-Routen.
3. CI-Gate ergänzen: `npm audit --omit=dev --audit-level=high` sowie `license-checker --failOn 'GPL;AGPL;LGPL'`.
4. Regelmäßiges Dependency-Update-Fenster (z. B. monatlich) etablieren.
