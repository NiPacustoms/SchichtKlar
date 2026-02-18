# SLO/SLA & Error Budgets

## Service Level Objectives (SLO)
- Verfügbarkeit (Monat): 99.9% (Downtime ≤ ~43min/Monat)
- Fehlerquote (5xx / 4xx authz): P95 < 0.5%
- Latenz API (P95): < 400ms, (P99): < 900ms
- App LCP: < 2.5s (P75), INP < 200ms (P75)

## Service Level Indicators (SLI)
- Uptime: Health-Endpoint `/api/health` (200 OK)
- Error Rate: Anteil nicht-erfolgreicher Requests
- Latenz: P95/P99 aus Logs/Monitoring

## Error Budget
- Monatliches Budget: 0.1% Nichtverfügbarkeit
- Policy: Bei Budgetverbrauch > 50% Feature-Freeze, Fokus auf Stabilität

## Messung & Reporting
- Status-Seite `/status` (öffentlich)
- Alerting: Degraded Health, Error-Rate > Schwellwert, Latenz-Spikes
- Wöchentlicher SLO-Report im Team-Channel

## SLA (extern, informativ)
- Basic SLA: 99.9% Availability (Monat) – geplante Wartungsfenster exkl.
- Support-Reaktionszeiten: P1 ≤ 1h, P2 ≤ 4h (Geschäftszeiten), P3 ≤ 2 WT
