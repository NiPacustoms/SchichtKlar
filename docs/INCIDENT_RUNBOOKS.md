# Incident Runbooks

## Schweregrade

- P1: Vollständiger Ausfall kritischer Funktionen (Login, Schichtplan)
- P2: Degradierung > 10% Nutzer betroffen
- P3: Einzelne Kundenvorfälle / UI-Bugs

## On-Call Prozess

1. Alert empfängt On-Call (24/7 oder Geschäftszeiten-Modell)
2. Bestätigung binnen 10 Minuten (P1)
3. Triage: Ursache eingrenzen (Netz, Firebase, Release, Abuse)
4. Kommunikation: Status-Seite Update; Kunde bei P1/P2 informieren

## Triage Checkliste

- Health `/api/health` Status prüfen
- Error-Rate/Latenz Charts prüfen
- Letzte Releases/Deployments checken
- Firebase Status-Dashboard prüfen
- Quoten/Abrechnungen (GCP) prüfen

## Sofortmaßnahmen (Beispiele)

- Feature-Flag deaktivieren (Rollback light)
- Rate Limits temporär lockern/verschärfen
- Cache invalideren
- Re-Deploy stabiles Release

## Postmortem

- Timeline, Ursache (Root Cause), Impact, gelernte Punkte
- Maßnahmenliste mit Ownern & Deadlines
- Review im Team; Dokumentation im Repo

## Vorlagen/Links

- `docs/SLO_SLA.md` – Zielwerte
- `docs/DISASTER_RECOVERY.md` – Wiederherstellung
- Status-Seite: `/status`

## Firestore Aggregations 403 (companyId fehlt)

**Symptome**

- Browser-Konsole zeigt `runAggregationQuery 403 (Forbidden)` mit Hinweis `Missing companyId in token`.
- Dashboards, Userlisten oder Notification-Counter laden nicht / zeigen 0.

**Ursache**

- Custom Claims (`companyId`, `role`) im Firebase Auth Token fehlen oder sind veraltet.
- Service-Account-Secret (`FIREBASE_ADMIN_CREDENTIALS_BASE64`) wurde nicht gesetzt oder nach Deploy nicht neu eingelesen.

**Diagnose**

1. `lib/utils/companyId.ts` prüfen: Logs `[companyId]` geben Aufschluss über Claim-/UserDoc-Status.
2. Im Browser `sessionStorage.__TOKEN_DEBUG__` bzw. `contexts/AuthContext` Logs checken.
3. `firebase auth:export` oder Admin-Console → User → Custom Claims verifizieren.
4. Firestore Rules (`firestore.rules` → `hasCompanyContext`) stellen sicher, dass Aggregationen nur mit gültiger `companyId` laufen.

**Behebung**

1. Sicherstellen, dass `FIREBASE_ADMIN_CREDENTIALS_BASE64` als Secret hinterlegt und deployt ist.
2. Als betroffener User `/api/auth/sync-claims` aufrufen (oder in der UI ab-/anmelden). Der `companyId`-Helper ruft diesen Endpoint nun automatisch bei Permission-Errors.
3. Token-Refresh forcieren (`await auth.currentUser.getIdToken(true)`) oder `lib/utils/tokenDebug.ts` → `syncCustomClaims()` ausführen.
4. Falls der User im `users/{uid}`-Dokument keine `companyId` hat, diese setzen (Standard: `aufabruf`).
5. Seite neu laden; Aggregationen rufen `refreshTokenAndGetCompanyId()` auf und sollten wieder funktionieren.

**Nacharbeiten**

- In `docs/ENV_EXAMPLE.md` und `docs/PRODUCTION_ENVIRONMENT.md` vermerken, wenn Secrets geändert wurden.
- Post-Incident kurz dokumentieren (Wer war betroffen? Welche Claims fehlten?).
