# Firebase Service Account Automatisierung

## Verfügbare Scripts

### 1. `setup-service-account.sh` - Automatisches Setup
Setzt alle benötigten Rollen automatisch und entfernt redundante Rollen.

```bash
./scripts/setup-service-account.sh
```

**Was macht es:**
- ✅ Prüft vorhandene Rollen
- ✅ Entfernt redundante Rollen
- ✅ Fügt fehlende Rollen hinzu
- ✅ Verifiziert das Ergebnis

### 2. `verify-service-account.sh` - Verifikation
Prüft ob alle benötigten Rollen vorhanden sind.

```bash
./scripts/verify-service-account.sh
```

**Ausgabe:**
- ✅ Liste aller vorhandenen/fehlenden Rollen
- ❌ Exit Code 1 wenn Rollen fehlen

### 3. `auto-setup-firebase.sh` - Vollständiges Setup
Vollständiges Firebase Setup (Service Account + APIs).

```bash
./scripts/auto-setup-firebase.sh
```

**Was macht es:**
- ✅ Service Account Rollen setzen
- ✅ Benötigte APIs aktivieren
- ✅ Verifikation durchführen

## Verwendung

### Initial Setup
```bash
# 1. gcloud authentifizieren
gcloud auth login

# 2. Vollständiges Setup
./scripts/auto-setup-firebase.sh
```

### Nur Rollen aktualisieren
```bash
./scripts/setup-service-account.sh
```

### Nur verifizieren
```bash
./scripts/verify-service-account.sh
```

## Automatisierung in CI/CD

Die Scripts können auch in GitHub Actions verwendet werden:

```yaml
- name: Verify Service Account Permissions
  run: |
    gcloud auth activate-service-account --key-file=${{ secrets.FIREBASE_SERVICE_ACCOUNT_JobFlow }}
    ./scripts/verify-service-account.sh
```

## Benötigte Rollen (minimal)

1. `roles/cloudfunctions.admin`
2. `roles/firebase.sdkAdminServiceAgent`
3. `roles/firebaseextensions.admin`
4. `roles/firebasehosting.admin`
5. `roles/run.admin`
6. `roles/serviceusage.serviceUsageAdmin`

**Total: 6 Rollen** (optimiert für Least-Privilege-Prinzip)

