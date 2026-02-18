# Admin Guide

Dieser Leitfaden beschreibt die wichtigsten Admin-Workflows in JobFlow.

## Anmeldung

- Klassisch mit E-Mail/Passwort
- Optional SSO (OIDC), wenn `NEXT_PUBLIC_OIDC_PROVIDER_ID` konfiguriert ist

## Rollen & Berechtigungen

- Rollen: Admin, Dispatcher, Nurse
- Mandanten & Scopes:
  - Mandant wird über `tenantId` gesteuert (Server-Regeln + Client-Guards)
  - Zugriffe auf Einrichtungen über `facilityIds` (Client-Guards)

## Audit Logs

- Ansicht: Admin → Audit Logs (`/admin/audit-logs`)
- Enthält: Actor, Aktion, Ziel, Zeitstempel
- Filterbar nach Aktion und Actor

## Sicherheit & Stabilität

- Sicherheits-Header & CSP aktiv
- Rate Limiting für `/api` & `/auth`
- Health-Check: `/api/health`, Status-Seite: `/status`

## DSGVO

- Datenexport (Callable): `exportUserData`
- Datenlöschung (Callable): `deleteUserData` (Soft-/Hard-Delete)
- Prozesse: siehe `docs/DSGVO_PROZESSE.md`

## Backups & Wiederherstellung

- Firestore-Backup: `scripts/firestore-backup.sh`
- Storage-Backup: `scripts/storage-backup.sh`
- Runbook: `docs/DISASTER_RECOVERY.md`

## Häufige Admin-Operationen

- Einrichtungen verwalten (Anlegen, Bearbeiten, Löschen)
- Schichten verwalten (Kapazität, Status, Zuweisungen)
- Nutzer verwalten (Rollen, Aktivierung, Profile)

Hinweis: Änderungen werden in Audit-Logs protokolliert.
