# Go‑Live Checkliste

## Technik

- [ ] Health `/api/health` liefert 200, Status-Seite `/status` grün
- [ ] CSP/Security-Header aktiv, keine Mixed-Content-Warnungen
- [ ] Rate Limiting aktiv für `/api` & `/auth`
- [ ] Firestore-Rules mit `tenantId`-Isolation verifiziert (neg./pos. Tests)
- [ ] Backups funktionsfähig (Firestore/Storage), letzter Erfolg < 24h
- [ ] Restore-Drill dokumentiert (RTO ≤ 2h, RPO ≤ 24h)

## Sicherheit & Compliance

- [ ] DSGVO-Prozesse dokumentiert (`DSGVO_PROZESSE.md`)
- [ ] Datenexport (`exportUserData`) & Löschung (`deleteUserData`) getestet
- [ ] Audit-Logs aktiv, Viewer erreichbar (`/admin/audit-logs`)
- [ ] ASVS-Checkliste geprüft, keine offenen High Findings

## Observability

- [ ] Alerts für Health/Fehlerraten/Latenz gesetzt
- [ ] SLO/SLA kommuniziert (`SLO_SLA.md`)

## Accounts & Rollen

- [ ] Admin/Dispatcher/Nurse Test-Accounts vorhanden
- [ ] RBAC: `tenantId`/`facilityIds` im Client wirksam

## Dokumentation

- [ ] Admin Guide aktuell (`ADMIN_GUIDE.md`)
- [ ] Changelog gepflegt (`CHANGELOG.md`)
- [ ] Tests-Doku (`TESTS.md`) vorhanden

## Betrieb

- [ ] Env/Secrets validiert (`scripts/validate-env.js`)
- [ ] Rollout-Plan: Pilot → GA, Kommunikationsplan vorbereitet

Abschluss: Wenn alle Punkte gecheckt sind, Go‑Live freigeben.
