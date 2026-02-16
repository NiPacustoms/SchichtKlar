# GitHub Secrets automatisch setzen

## Schnellstart

1. **GitHub CLI authentifizieren** (einmalig):
   ```bash
   gh auth login
   ```
   Folge den Anweisungen im Browser.

2. **Secrets automatisch setzen**:
   ```bash
   ./scripts/set-github-secrets-auto.sh
   ```

Das Script liest die Werte aus `.env.e2e` und setzt sie automatisch als GitHub Secrets.

## Was wird gesetzt?

### Secrets (aus `.env.e2e`):
- `E2E_BASE_URL` - aus `BASE_URL`
- `E2E_ADMIN_EMAIL` - aus `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD` - aus `E2E_ADMIN_PASSWORD`
- `E2E_EMPLOYEE_EMAIL` - aus `E2E_EMPLOYEE_EMAIL`
- `E2E_EMPLOYEE_PASSWORD` - aus `E2E_EMPLOYEE_PASSWORD`

### Variables (aus `.firebaserc`):
- `FIREBASE_PROJECT_ID` - aus `default` Projekt

## Interaktives Setup

Falls du mehr Kontrolle benötigst oder optionale Secrets setzen möchtest:

```bash
./scripts/setup-github-secrets.sh
```

Dieses Script führt dich interaktiv durch alle Secrets und Variables.

## Manuelle Befehle

Falls du Secrets manuell setzen möchtest:

```bash
# Secret setzen
echo -n "wert" | gh secret set SECRET_NAME --repo OWNER/REPO

# Variable setzen
gh variable set VARIABLE_NAME --body "wert" --repo OWNER/REPO

# Liste aller Secrets anzeigen
gh secret list --repo OWNER/REPO

# Liste aller Variables anzeigen
gh variable list --repo OWNER/REPO
```
