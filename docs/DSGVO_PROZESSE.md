# DSGVO Prozesse (JobFlow)

Dieses Dokument beschreibt die datenschutzrelevanten Prozesse: Auftragsverarbeitung (AVV), Technische und organisatorische Maßnahmen (TOMs), Datenfluss, sowie Lösch- und Exportprozesse.

## 1. Auftragsverarbeitung (AVV) – Checkliste

- Parteien: Verantwortlicher (Kunde), Auftragsverarbeiter (JobFlow), Unterauftragsverarbeiter (Google/Firebase)
- Gegenstand/Zweck: Personal-/Einsatzplanung, Zeiterfassung, Dokumente
- Dauer: Vertragslaufzeit + gesetzliche Aufbewahrung
- Art/Umfang der Daten: Konto-, Kontakt-, Beschäftigungs- und Dokumentdaten
- Betroffene: Mitarbeiter, Disponenten, Administratoren
- TOMs: siehe Abschnitt 2
- Unterauftragsverarbeiter: Firebase/Google Cloud (Standorte EU/EEA bevorzugt)
- Weisungsrecht, Unterstützung Betroffenenrechte, Löschkonzept, Audit-Rechte
- Übermittlungen in Drittländer: SCCs/Transfer Impact Assessment falls nötig

## 2. Technische und organisatorische Maßnahmen (TOMs)

- Zugriffskontrolle: RBAC, Least Privilege, MFA für Admins
- Mandantenisolation: Firestore-Rules mit `tenantId`-Abgleich
- Transport-/Speichersicherheit: HTTPS/HSTS, Firebase-Verschlüsselung at-rest
- Härtung: CSP, Sicherheitsheader, Rate Limiting, Secret-Management
- Protokollierung: Unveränderliche Audit-Logs für Admin-Aktionen
- Backup & DR: Tägliche Backups, RTO ≤ 2h, RPO ≤ 24h (siehe DR-Runbook)
- Schwachstellenmanagement: Regelmäßige Updates, Pen-Test/ASVS-Checklisten
- Verfügbarkeit: Monitoring/Alerts, Status-Kommunikation

## 3. Datenfluss (vereinfacht)

- Web/App → Next.js (App Router)
- Auth → Firebase Auth (OIDC)
- Datenhaltung → Firestore (EU Region), Storage für Dokumente
- Cloud Functions → Datenexport/-löschung, Benachrichtigungen
- Monitoring → strukturierte Logs, Security-Events Webhook

## 4. Betroffenenrechte: Export & Löschung

- Export: Callable Function `exportUserData` aggregiert Nutzer-bezogene Daten (Users, Assignments, Timesheets, Documents, Notifications, Messages) gefiltert per `tenantId`
- Löschung: Callable Function `deleteUserData` (Soft-/Hard-Delete je Operation) mit `tenantId`-Sicherung; personenbezogene Felder werden entfernt
- Self-Service: Admin-UI Trigger und Statusanzeige (geplant)

## 5. Löschkonzept & Aufbewahrung

- Operative Daten: Löschung auf Anfrage oder bei Beendigung der Nutzung
- Aufbewahrungsfristen: Geschäftsrelevante Nachweise gemäß rechtlicher Vorgaben (Mandantenverantwortung); Export zur Archivierung möglich
- Backups: Rotationsstrategie; Restore-Drills dokumentiert

## 6. Verantwortlichkeiten

- Datenschutzkoordination: Produkt/Legal
- Technische Umsetzung: Engineering (Security/Infra)
- Support: Helpdesk (Anfragen zu Auskunft/Löschung)

## 7. Nachweise/Dokumentation

- `docs/DISASTER_RECOVERY.md` – DR-Runbook
- `firestore.rules` – Mandantenisolation
- Middleware/Config – CSP & Security-Header
- Audit-Logs – Admin-Aktionen nachvollziehbar (Viewer vorhanden)
