# Firebase Cleanup Policy - Artifact Registry

## Problem

Beim Deployment von Cloud Functions tritt folgende Warnung auf:

```
Functions successfully deployed but could not set up cleanup policy in location europe-west1.
Pass the --force option to automatically set up a cleanup policy or run 'firebase functions:artifacts:setpolicy' to manually set up a cleanup policy.
```

## Bedeutung

Die Cleanup Policy ist **optional** und dient zur automatischen Bereinigung alter Build-Artefakte in Artifact Registry. Sie verhindert, dass sich alte Docker-Images und Build-Artefakte ansammeln und Speicherkosten verursachen.

**Wichtig:** Diese Warnung beeinträchtigt das Deployment **nicht**. Die Function wurde erfolgreich deployed.

## Lösung

### Option 1: Manuell einrichten (empfohlen)

Nach dem ersten erfolgreichen Deployment:

```bash
firebase functions:artifacts:setpolicy --project=jobflow25 --location=europe-west1
```

### Option 2: Automatisch im Workflow

Ein GitHub Actions Step wurde bereits hinzugefügt, der die Cleanup Policy automatisch einrichtet (mit `continue-on-error: true`, da es optional ist).

### Option 3: Mit --force Flag

Beim nächsten Deployment wird das `--force` Flag automatisch verwendet, wenn die Cleanup Policy noch nicht eingerichtet ist.

## Was macht die Cleanup Policy?

Die Cleanup Policy löscht automatisch:

- Alte Docker-Images von Cloud Functions
- Alte Build-Artefakte in Artifact Registry
- Standard: Behält die letzten 10 Versionen

## Kosten

Ohne Cleanup Policy können sich über die Zeit alte Artefakte ansammeln, was geringe Storage-Kosten verursachen kann. Die Cleanup Policy verhindert dies.

## Status

✅ **Deployment funktioniert** - Die Warnung ist nicht kritisch
⚠️ **Cleanup Policy optional** - Kann manuell eingerichtet werden für automatische Bereinigung
