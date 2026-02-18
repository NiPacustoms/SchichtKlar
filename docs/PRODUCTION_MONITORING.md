# Production Monitoring & Alerts

Diese Dokumentation beschreibt das Monitoring und Alerting für Production.

## Übersicht

JobFlow verwendet mehrere Monitoring-Tools und Alerting-Mechanismen:

1. **Sentry** - Error Tracking & Performance Monitoring
2. **Firebase Console** - Firebase-spezifisches Monitoring
3. **Health Checks** - `/api/health` Endpoint
4. **Status Page** - `/status` öffentliche Status-Seite
5. **GCP Monitoring** - Cloud Functions & Hosting Monitoring

## Sentry Configuration

### Setup

Sentry ist bereits konfiguriert in:
- `sentry.client.config.ts` - Client-side Error Tracking
- `sentry.server.config.ts` - Server-side Error Tracking
- `sentry.edge.config.ts` - Edge Runtime Error Tracking

### Environment Variable

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Features

- **Error Tracking**: Automatisches Tracking aller JavaScript-Fehler
- **Performance Monitoring**: Tracking von API-Latenz und Page Load Times
- **Release Tracking**: Automatisches Tracking von Deployments
- **Sensitive Data Filtering**: Automatisches Entfernen von Passwörtern, Tokens, etc.

### Alerting in Sentry

1. Sentry Dashboard öffnen
2. Settings > Alerts
3. Alert Rules erstellen:
   - **Error Rate**: > 5% in 5 Minuten
   - **New Issues**: Sofort bei neuen kritischen Fehlern
   - **Performance Degradation**: P95 Latenz > 1s

## Health Check Endpoint

### `/api/health`

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok" | "degraded" | "error",
  "timestamp": 1234567890,
  "uptimeSeconds": 3600,
  "env": "production",
  "firebase": {
    "connected": true,
    "error": null
  }
}
```

**Status Codes:**
- `200` - OK
- `503` - Service Unavailable (degraded/error)

### Status Page

**Endpoint:** `GET /status`

Öffentliche Status-Seite, die den Health-Check konsumiert.

## GCP Monitoring & Alerts

### Cloud Functions Monitoring

**Empfohlene Alerts:**

1. **Error Rate Alert**
   - Metric: `cloudfunctions.googleapis.com/function/execution_count`
   - Filter: `status = "error"`
   - Threshold: > 5% in 5 Minuten
   - Notification: Email + Slack

2. **Execution Time Alert**
   - Metric: `cloudfunctions.googleapis.com/function/execution_times`
   - Threshold: P95 > 5s
   - Notification: Email

3. **Invocation Count Alert**
   - Metric: `cloudfunctions.googleapis.com/function/invocation_count`
   - Threshold: > 1000/Minute (anomaly detection)
   - Notification: Email

### Firebase Hosting Monitoring

**Empfohlene Alerts:**

1. **5xx Error Rate**
   - Metric: `firebase.googleapis.com/hosting/request_count`
   - Filter: `status_code >= 500`
   - Threshold: > 1/Minute
   - Notification: Email + PagerDuty (kritisch)

2. **Response Time**
   - Metric: `firebase.googleapis.com/hosting/response_time`
   - Threshold: P95 > 2s
   - Notification: Email

### Firestore Monitoring

**Empfohlene Alerts:**

1. **Read/Write Errors**
   - Metric: `firestore.googleapis.com/api/request_count`
   - Filter: `status = "error"`
   - Threshold: > 10/Minute
   - Notification: Email

2. **Quota Usage**
   - Metric: `firestore.googleapis.com/api/request_count`
   - Threshold: > 80% des Tageslimits
   - Notification: Email

### Storage Monitoring

**Empfohlene Alerts:**

1. **Storage Errors**
   - Metric: `storage.googleapis.com/api/request_count`
   - Filter: `status = "error"`
   - Threshold: > 5/Minute
   - Notification: Email

## Alerting Setup

### GCP Alerting Policy erstellen

1. GCP Console öffnen
2. Monitoring > Alerting > Policies
3. "Create Policy" klicken
4. Condition hinzufügen (siehe oben)
5. Notification Channel konfigurieren:
   - Email
   - Slack (optional)
   - PagerDuty (optional, für kritische Alerts)

### Beispiel: Health Check Alert

```yaml
Display Name: Health Check Failed
Condition:
  Resource Type: Cloud Function
  Metric: cloudfunctions.googleapis.com/function/execution_count
  Filter: function_name = "health-check" AND status = "error"
  Aggregation: count
  Threshold: > 0 in 5 minutes
Notification:
  - Email: ops@company.com
  - Slack: #alerts
```

## SLO/SLA Monitoring

Siehe `docs/SLO_SLA.md` für detaillierte SLO-Definitionen.

### Key Metrics

- **Availability**: 99.9% (Monat)
- **Error Rate**: < 0.5% (P95)
- **API Latency**: < 400ms (P95), < 900ms (P99)
- **App LCP**: < 2.5s (P75)
- **App INP**: < 200ms (P75)

### Error Budget

- **Monatliches Budget**: 0.1% Nichtverfügbarkeit
- **Policy**: Bei Budgetverbrauch > 50% Feature-Freeze

## Logging

### Firebase Logging

Logs sind verfügbar in:
- Firebase Console > Functions > Logs
- GCP Console > Logging

### Log Levels

- **ERROR**: Kritische Fehler, die sofortige Aufmerksamkeit erfordern
- **WARN**: Warnungen, die überwacht werden sollten
- **INFO**: Informative Nachrichten
- **DEBUG**: Debug-Informationen (nur in Development)

### Log Retention

- **Firebase Functions**: 30 Tage
- **Firebase Hosting**: 7 Tage
- **Firestore**: 7 Tage (Audit Logs)

## Monitoring Dashboard

### Empfohlene Dashboards

1. **Overview Dashboard**
   - Health Check Status
   - Error Rate (letzte 24h)
   - API Latency (P95/P99)
   - Active Users

2. **Infrastructure Dashboard**
   - Cloud Functions Invocations
   - Firestore Read/Write Operations
   - Storage Operations
   - Network Traffic

3. **Business Metrics Dashboard**
   - Active Users
   - New Registrations
   - Timesheets Created
   - Assignments Completed

## Incident Response

Siehe `docs/INCIDENT_RUNBOOKS.md` für detaillierte Incident-Response-Prozesse.

### Escalation Path

1. **Level 1**: Automated Alerts → Ops Team
2. **Level 2**: Critical Alerts → On-Call Engineer
3. **Level 3**: P1 Incidents → CTO/Lead Engineer

## Best Practices

1. **Alert Fatigue vermeiden**: Nur kritische Alerts konfigurieren
2. **Runbooks erstellen**: Für jeden Alert ein Runbook
3. **Regular Reviews**: Alerts monatlich überprüfen
4. **Documentation**: Alle Alerts dokumentieren
5. **Testing**: Alerts regelmäßig testen

## Weitere Informationen

- Siehe auch: `docs/API_MONITORING.md` für API-spezifisches Monitoring
- Siehe auch: `docs/ERROR_HANDLING.md` für Error-Handling-Strategien
- Siehe auch: `docs/SLO_SLA.md` für SLO/SLA-Definitionen

