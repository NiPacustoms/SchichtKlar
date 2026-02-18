# Tests

## Smoke
- Script: `scripts/smoke.sh`
- Ausführung: `BASE_URL=https://app.example.com ./scripts/smoke.sh`
- Prüft: `/api/health`, `/status`, `/auth/login`

## Load (k6)
- Script: `scripts/k6-health.js`
- Ausführung: `BASE_URL=https://app.example.com k6 run scripts/k6-health.js`
- Ziele: Error-Rate < 1%, P95 < 400ms, P99 < 900ms

## E2E (manuell, kurz)
- Admin Login → Audit-Logs öffnen
- Mitarbeiter Login → Dienstplan laden → Zeiten erfassen
- Dokument hochladen → Anzeige prüfen

## E2E (Playwright)

Ausführen:

```bash
npm run test:e2e
```

### Echte E2E-Logins (ohne Mock)

Für reale Logins lege lokal eine `.env.e2e` im Projektwurzelverzeichnis an (nicht einchecken):

```
# Admin-Account (Rolle: admin oder dispatcher)
E2E_ADMIN_EMAIL=admin@your-domain.tld
E2E_ADMIN_PASSWORD=your-admin-password

# Mitarbeiter-Account (Rolle: nurse)
E2E_EMPLOYEE_EMAIL=employee@your-domain.tld
E2E_EMPLOYEE_PASSWORD=your-employee-password

# Für echte Logins Mock-Auth nicht verwenden
NEXT_PUBLIC_E2E_TEST=
```

Die Playwright-Konfiguration lädt `.env.e2e` automatisch, falls vorhanden. Starte reale E2E-Tests z. B. mit:

```bash
npm run test:e2e:real
```
