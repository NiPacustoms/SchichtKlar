# OWASP ASVS / Penetrationstest Checkliste

Diese Checkliste unterstützt interne Sicherheitsreviews und externe Penetrationstests.

## 1. Architektur & Bedrohungsmodell

- [ ] Datenflussdiagramm (Auth, Firestore, Storage, Functions)
- [ ] Vertrauensgrenzen definiert (Client, Middleware, Functions, GCP)
- [ ] Mandantenisolation dokumentiert (`tenantId` in Regeln/Code)

## 2. Authentisierung & Session

- [ ] Firebase Auth Provider auf erlaubte Domains begrenzt
- [ ] Session/ID Token Validierung auf Server-seite (bei geschützten Endpunkten)
- [ ] MFA für Admin-Konten aktiviert

## 3. Autorisierung (RBAC/ABAC)

- [ ] Deny-by-default im UI (Guards) und in `firestore.rules`
- [ ] Rollen und Scopes getestet (Admin/Dispatcher/Nurse)
- [ ] Zugriff über `tenantId` isoliert (negativ/positiv Tests)

## 4. Eingabenvalidierung / Deserialisierung

- [ ] Uploads: MIME/Größe geprüft, keine SVG-Script-Injektion
- [ ] API/Functions: Parameter-Validierung und Fehlermeldungen ohne Details

## 5. Sicherheits-Header & CSP

- [ ] CSP ohne Inline, Ausnahmen dokumentiert
- [ ] Referrer-Policy, X-Content-Type-Options, X-Frame-Options, HSTS aktiv

## 6. Geheimnisse & Konfiguration

- [ ] Keine Secrets im Repo; Nutzung von env/Secret Manager
- [ ] Schlüssel-Rotation geplant/dokumentiert

## 7. Protokollierung & Monitoring

- [ ] Audit-Logs für Admin-Aktionen vollständig und fälschungssicher
- [ ] Security-Events (Rate Limit, Auth-Fehler) erzeugen Alerts

## 8. Kryptografie

- [ ] TLS erzwungen (HSTS), keine Mixed Content Warnungen
- [ ] Hashing/Signaturen für revisionssichere Dokumentation (Roadmap)

## 9. Fehlerbehandlung

- [ ] Keine Stacktraces an Endnutzer; generische Fehlermeldungen
- [ ] Zentrale Error-Boundaries im UI aktiv

## 10. Abhängigkeiten & Supply Chain

- [ ] `npm audit`/`yarn audit` regelmäßig
- [ ] Dependabot/ Renovate aktiviert

## 11. Cloud / GCP-Freigaben

- [ ] Least-Privilege IAM für Service Accounts (Backup/Deploy)
- [ ] Firestore/Storage Regeln getestet, nur notwendige Indizes vorhanden

## 12. DR & Backups

- [ ] Backups erfolgreich; Restore-Drill < 2h (RTO), RPO < 24h

## Common Findings & Gegenmaßnahmen

- [ ] CSP-Blocker: externe Domains whitelisten oder Nonce nutzen
- [ ] Rate-Limit-Umgehung: Key-Strategie erweitern (User+IP)
- [ ] Übermäßige Firestore-Lesezugriffe: Indizes/Queries optimieren

Abschlusskriterium: Alle kritischen/high Findings geschlossen; mittlere binnen 14 Tagen; niedrige geplant.
