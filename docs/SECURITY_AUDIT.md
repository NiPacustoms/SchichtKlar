# Security-Audit (Phase 4 – Marktreife)

**Stand:** 10.07.2026 · Branch `chore/market-ready`
**Prüfumfang:** Firebase Authentication, Firestore Security Rules, Storage Rules, Cloud Functions, Next.js API-Routen, Secret-Management, Rollen-/Rechtemodell.
**Methode:** Statische Code-Analyse + reproduzierbare Emulator-Tests der Firestore-Rules (`tests/rules/`). Jeder kritische/hohe Befund wurde behoben und der Fix per Test bzw. Re-Review verifiziert.

Bewertungsskala: **Kritisch** (sofort ausnutzbar, Datenverlust/Rechteübernahme) · **Hoch** (schwerwiegend, eingeschränkte Voraussetzungen) · **Mittel** (Härtung/Defense-in-Depth) · **Niedrig** (kosmetisch/Hygiene).

---

## 1. Zusammenfassung

| Schweregrad | Gefunden | Behoben | Verbleibend (dokumentiert) |
|---|---|---|---|
| Kritisch | 2 | 2 | 0 |
| Hoch | 1 | 1 | 0 |
| Mittel | 4 | 3 | 1 |
| Niedrig | 2 | 1 | 1 |

**Kernaussage:** Die zwei kritischen Befunde (Rollen-Eskalation über das eigene User-Dokument; jsPDF-Object-Injection) sind behoben und – im Fall der Rollen-Eskalation – durch automatisierte Emulator-Tests dauerhaft abgesichert. Das Datenzugriffsmodell (Firestore-Rules) ist nach dem Fix konsistent: Nur Admins vergeben Rollen, Mitarbeiter sehen ausschließlich eigene Daten, Shifts sind gewollt firmenweit lesbar.

---

## 2. Befunde im Detail

### KRITISCH-1 — Privilege Escalation: Pflegekraft macht sich selbst zum Admin ✅ BEHOBEN

**Ort:** `firestore.rules`, `match /users/{uid}` (update-Regel) in Kombination mit `hasRoleFromUserDoc('admin')`.

**Problem:** Die update-Regel erlaubte `request.auth.uid == uid` **ohne Feldbeschränkung**. Gleichzeitig ermittelt `isAdmin()` die Admin-Rolle über einen Fallback aus `users/{uid}.role` (für den ersten Login vor dem Custom-Claims-Sync). Eine authentifizierte Pflegekraft konnte damit ihr eigenes Dokument auf `role: 'admin'` setzen und war anschließend – ohne Custom Claim – Administrator. Analog für `customRoleId` und `companyId` (Mandanten-/Rollenwechsel).

**Nachweis (Emulator, vor dem Fix):**
```
LECK | Nurse eskaliert eigene Rolle auf admin: ERLAUBT – erwartet: VERWEIGERT
LECK | Nurse setzt eigene customRoleId:        ERLAUBT – erwartet: VERWEIGERT
LECK | Nurse ändert eigene companyId:          ERLAUBT – erwartet: VERWEIGERT
```

**Fix:** Neue Rules-Funktion `selfUpdateKeepsPrivilegedFields()` verbietet beim Selbst-Update jede Änderung an `role`, `companyId`, `customRoleId` (via `diff().affectedKeys().hasAny(...)`). Rollenvergabe bleibt ausschließlich Admins über die zweite Regel-Verzweigung (`hasRole('admin')`, prüft den Custom Claim, nicht den Doc-Fallback) vorbehalten. Die `create`-Regel wurde ebenfalls gehärtet: Selbst-Anlage darf nur `role` fehlen lassen oder `'nurse'` setzen.

**Verifikation (nach dem Fix):** `tests/rules/firestore-escalation.test.mjs` – 4/4 grün; Regressions-Suite `firestore-rules.test.mjs` – 9/9 grün. Beide laufen über `npm run test:rules`.

**Kein Bruch legitimer Abläufe:** Öffentliche Registrierung ist deaktiviert (`AuthService.signUp` wirft), Admin-Registrierung und Einladungen laufen serverseitig über das Admin-SDK (umgeht Rules). Client-seitige Selbst-Schreibzugriffe beschränken sich auf `lastLoginAt` (unkritisch) und die Admin-Operation `restore`.

### KRITISCH-2 — jsPDF Object Injection / Arbitrary JS (CVE-Kette) ✅ BEHOBEN

**Ort:** `jspdf@^4.1.0` (produktive Abhängigkeit; genutzt in `reportService.ts`, `documentGeneration.ts`, `timesheetProof.ts` für Einsatznachweis-/Report-PDFs).

**Problem:** Version < 4.2.0 ist von mehreren Advisories betroffen (u. a. GHSA-9vjf-qc39-jprp – PDF Object Injection via `addJS`, GHSA-p5xg-68wr-hm3m – Arbitrary JavaScript Execution im AcroForm-Modul). Da PDF-Inhalte teils aus Nutzereingaben (Namen, Notizen) stammen, ist die Injektionsfläche real.

**Fix:** Kontrollierter Minor-Bump auf `jspdf@^4.2.1` (patched, gleiche Major-Version → geringes Regressionsrisiko). Typecheck und Produktions-Build nach dem Bump grün.

### HOCH-1 — Storage: Firmenlogo von jedem authentifizierten Nutzer überschreibbar ✅ BEHOBEN

**Ort:** `storage.rules`, `match /logos/{allPaths=**}`.

**Problem:** `allow write: if request.auth != null && ...` erlaubte **jedem** eingeloggten Nutzer (auch Pflegekräften), das öffentlich lesbare Firmenlogo zu überschreiben (Defacement/Phishing-Risiko, da das Logo appweit angezeigt wird).

**Fix:** Schreibrecht auf `request.auth.token.role == 'admin'` eingeschränkt (Bild-Typ- und 5-MB-Grenze bleiben). Lesen bleibt öffentlich (Anzeige im Login), Löschen war bereits Admin-only.

### MITTEL-1 — `/api/admin/shifts` ohne Rollenprüfung ✅ BEHOBEN

**Ort:** `app/api/admin/shifts/route.ts` (GET + POST).

**Problem:** Beide Handler prüften nur die Authentifizierung, nicht die Admin-Rolle – inkonsistent zu allen anderen `/api/admin/*`-Routen (die `getRoleFromToken(decoded) !== 'admin'` prüfen). Kein akuter Datenleak (Shifts sind per Firestore-Rule ohnehin für alle Authentifizierten lesbar, „offene Schichten"), aber POST hätte das Anlegen von Schichten durch Nicht-Admins über die API erlaubt.

**Fix:** Admin-Gate (`getRoleFromToken(decoded) !== 'admin' → 403`) in GET und POST ergänzt. Kein aktiver App-Aufrufer betroffen (Endpunkt hat aktuell keine Aufrufer im Client-Code).

### MITTEL-2 — Security-Webhook-URL im Client-Bundle exponiert ✅ BEHOBEN

**Ort:** `lib/monitoring/securityEvents.ts`.

**Problem:** `emitSecurityEvent` las `NEXT_PUBLIC_SECURITY_WEBHOOK_URL` als Fallback – eine mit `NEXT_PUBLIC_` präfixierte Variable landet im Client-Bundle und wäre öffentlich einsehbar (Fälschen von Security-Events, Endpunkt-Enumeration).

**Fix:** Auf serverseitige `SECURITY_WEBHOOK_URL` reduziert; README-Verweis korrigiert. (Funktion hat aktuell keine Aufrufer – reine Härtung des latenten Risikos.)

### MITTEL-3 — `deleteAllAssignments` (destruktive Cloud Function) ✅ GEPRÜFT, ausreichend abgesichert

**Ort:** `functions/src/deleteAllAssignments.ts`.

**Bewertung:** Die Function prüft `context.auth` (authentifiziert) UND `context.auth.token.role === 'admin'` (Custom Claim), bevor sie in Batches löscht. Autorisierung ist korrekt. **Empfehlung (nicht blockierend):** Als reine Wartungs-/Entwicklungsoperation sollte sie vor Auslieferung an Kunden entweder entfernt oder hinter ein zusätzliches Bestätigungs-Flag gestellt werden, um versehentliche Totallöschung zu verhindern → siehe `docs/KNOWN_LIMITATIONS.md`.

### MITTEL-4 — Fehlendes Rate-Limiting auf einzelnen Auth-/Einladungs-Routen ⚠ VERBLEIBEND (dokumentiert)

**Ort:** `app/api/auth/ensure-admin-role/route.ts`, `app/api/invitations/route.ts`.

**Bewertung:** `register-admin` und `accept-invite` besitzen bereits Rate-Limiting; `ensure-admin-role` (ENV-gegatet, in Produktion standardmäßig deaktiviert) und `invitations` (POST erfordert Admin) nicht. Rest-Risiko gering, aber für ein verkauftes Produkt empfohlen: einheitliches Rate-Limiting über alle schreibenden Auth-Routen. **Empfehlung für Käufer/Folge-PR**, kein Blocker.

### NIEDRIG-1 — Serverseitiges Routen-Gate fehlt (Middleware inaktiv) ⚠ VERBLEIBEND (dokumentiert)

**Ort:** `proxy.ts` (Root) ist für Next 16 vorbereitet, unter Next 15.5 aber inaktiv (Konvention `middleware.ts`).

**Bewertung:** Der Routen-Schutz für `/admin/*` und `/employee/*` erfolgt derzeit client-seitig (`AuthGuard`) plus – entscheidend – serverseitig auf **Datenebene** (Firestore-Rules, API-Rollenprüfung). Ein nicht berechtigter Nutzer bekommt zwar die Seiten-Shell, aber **keine Daten**. Damit ist der Schutz materiell gegeben; ein zusätzliches Server-Gate wäre Defense-in-Depth. Bewusst **nicht** aktiviert, weil das Umbenennen zu `middleware.ts` unter Next 15 auch die dort enthaltene CSP-/Header-Logik aktiviert, die sich mit den Headern aus `next.config.js` überschneidet → Risiko doppelter/uneinheitlicher Header. Aktivierung empfohlen im Zuge des Next-16-Upgrades. Siehe `docs/KNOWN_LIMITATIONS.md`.

### NIEDRIG-2 — Hartcodierte Firebase-Config-Fallbacks im Seed-Skript ✅ BEHOBEN (Phase 2)

`scripts/seed-firestore.js` enthielt Web-API-Key + Projekt-ID `jobflow25` als Fallback. In Phase 2 entfernt; Skript verlangt jetzt vollständige `.env.local`. (Web-API-Keys sind konzeptbedingt öffentlich, der Befund betraf den Verkäufer-Projektbezug, nicht ein echtes Geheimnis.)

---

## 3. Geprüft und in Ordnung (keine Änderung nötig)

- **Firestore Default-Deny:** `match /{document=**} { allow read, write: if false; }` als letzte Regel vorhanden.
- **API-Rollenprüfung:** `admin/import/employees`, `admin/import/facilities`, `admin/scheduled-reports`, `admin/user/[userId]/data-deletion|data-export` prüfen alle `getRoleFromToken(decoded) === 'admin'`.
- **Admin-SDK-Initialisierung** (`lib/server/firebaseAdmin.ts`): Service-Account aus ENV (Base64 oder JSON), niemals aus dem Repo; scheitert „graceful" ohne Crash.
- **Custom-Claims-Sync** (`/api/auth/sync-claims`): liest Rolle serverseitig aus dem User-Dokument, setzt Claims via Admin-SDK – korrekt.
- **Storage `documents/`:** Besitzer-oder-Admin, 10-MB-Grenze, `image/*|application/pdf` – solide.
- **Secrets:** Keine Private Keys, keine `sk_live`/`whsec`-Secrets im Repo. `.env*.example` enthalten nur Platzhalter.
- **Admin-Bootstrap** (`/api/auth/ensure-admin-role`, `/fix-admin-role`): in Produktion ENV-gegatet (PR #4), standardmäßig deaktiviert.
- **Fehlerausgaben:** API-Routen geben generische Fehler nach außen, Details nur ins serverseitige Logging (Sentry).

## 4. Für Käufer / rechtlich zu prüfen

- Rate-Limiting-Vereinheitlichung (MITTEL-4) vor Produktivbetrieb empfohlen.
- Aktivierung des Server-Routen-Gates (NIEDRIG-1) im Zuge des Next-16-Upgrades.
- `deleteAllAssignments` vor Kundenauslieferung entfernen oder zusätzlich absichern (MITTEL-3).
- Transitive `npm audit`-Befunde in Build-/Admin-Tooling (nicht laufzeitkritisch) → Detailbewertung in `docs/DEPENDENCY_AUDIT.md` (Phase 7).
