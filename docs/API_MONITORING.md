# API-Monitoring & Caching für Routenberechnung

## Übersicht

Das System überwacht und optimiert die Nutzung der OpenRouteService API für Routenberechnungen in JobFlow.

## Features

### 1. **API-Monitoring** (`lib/services/apiMonitoring.ts`)

- **Tägliches Limit**: 2.000 Requests/Tag (OpenRouteService Free Tier)
- **Rate Limiting**: 40 Requests/Minute
- **Firestore-basiert**: Persistente Speicherung der API-Call-Statistiken
- **Automatische Bereinigung**: Alte Daten (>7 Tage) werden automatisch gelöscht

### 2. **Mehrstufiges Caching** (`lib/services/maps.ts`)

#### Memory Cache (schnell)

- In-Memory-Speicherung für sofortigen Zugriff
- TTL: 24 Stunden

#### Firestore Cache (persistent)

- Persistente Speicherung in Firestore
- TTL: 24 Stunden
- Überlebt Browser-Neustarts

#### Cache-Strategie

1. Zuerst Memory Cache prüfen (schnellste Option)
2. Falls nicht vorhanden: Firestore Cache prüfen
3. Falls im Firestore Cache: Zurück in Memory Cache laden
4. Bei Cache-Miss: API-Call durchführen

### 3. **Rate Limiting**

- Prüft vor jedem API-Call, ob Limits erreicht sind
- Blockiert Requests bei Limit-Erreichung
- Fallback auf OpenStreetMap-Link bei Limit-Erreichung

### 4. **Fehlerbehandlung**

- **429 (Too Many Requests)**: Fallback auf OpenStreetMap-Link
- **Tägliches Limit erreicht**: Fallback mit Hinweis
- **Rate Limit erreicht**: Fallback mit Hinweis
- **Fail-Open-Strategie**: Bei Monitoring-Fehlern wird Request erlaubt

## Verwendung

### Routenberechnung

```typescript
import { maps } from '@/lib/services/maps';

const route = await maps.getRoute(
  { latitude: 52.52, longitude: 13.405 }, // Origin
  { latitude: 48.1351, longitude: 11.582 } // Destination
);

if (route) {
  console.log(`Distanz: ${route.distanceMeters}m`);
  console.log(`Dauer: ${route.durationSeconds}s`);
}
```

### API-Statistiken abrufen

```typescript
import { ApiMonitoringService } from '@/lib/services/apiMonitoring';

const stats = await ApiMonitoringService.getStats();
console.log(`Verwendet: ${stats.dailyCount}/${2000}`);
console.log(`Verbleibend: ${stats.remaining}`);
console.log(`Prozent: ${stats.percentageUsed.toFixed(1)}%`);
```

### Rate Limit prüfen

```typescript
const check = await ApiMonitoringService.canMakeRequest();
if (!check.allowed) {
  console.warn(check.reason);
}
```

## Firestore Collections

### `api_monitoring`

- **Document ID**: Datum im Format `YYYY-MM-DD`
- **Felder**:
  - `date`: Datum (string)
  - `count`: Anzahl API-Calls (number)
  - `lastCallAt`: Zeitpunkt des letzten Calls (Timestamp)
  - `rateLimitWindow`: Array mit minütlichen Call-Zählern
  - `updatedAt`: Letzte Aktualisierung (Timestamp)

### `route_cache`

- **Document ID**: Cache-Key (z.B. `route:52.52,13.405->48.1351,11.5820`)
- **Felder**:
  - `value`: RouteSummary-Objekt
  - `expiresAt`: Ablaufzeitpunkt (Timestamp)
  - `cachedAt`: Zeitpunkt der Speicherung (Timestamp)

## Performance-Optimierungen

1. **Cache-Hit-Rate**: Durch 24h TTL werden identische Routen nicht mehrfach berechnet
2. **Memory + Firestore**: Kombination für beste Performance
3. **Rate Limiting**: Verhindert unnötige API-Calls bei Limit-Erreichung
4. **Fail-Silently**: Cache-Fehler blockieren nicht die App

## Limits & Kosten

- **Tägliches Limit**: 2.000 Requests/Tag (kostenlos)
- **Rate Limit**: 40 Requests/Minute
- **Kosten bei Überschreitung**: Keine (API blockiert nur)
- **Cache-Reduktion**: ~60-80% weniger API-Calls durch Caching

## Monitoring & Wartung

### Alte Daten bereinigen

```typescript
await ApiMonitoringService.cleanupOldRecords();
```

**Empfehlung**: Als Cloud Function täglich ausführen.

### Statistiken überwachen

Für Admin-Dashboard:

- Tägliche API-Call-Anzahl
- Verbleibende Requests
- Cache-Hit-Rate (kann über Firestore-Queries berechnet werden)

## Troubleshooting

### Problem: "API-Limit erreicht"

- **Lösung**: Warten bis zum nächsten Tag (Reset um 00:00 UTC)
- **Prävention**: Caching optimieren, weniger API-Calls

### Problem: Cache funktioniert nicht

- **Prüfen**: Firestore-Berechtigungen für `route_cache` Collection
- **Prüfen**: Browser-Konsole auf Fehler

### Problem: Rate Limit trotz Monitoring

- **Ursache**: Mehrere gleichzeitige Requests
- **Lösung**: Rate Limiting funktioniert, aber mehrere Requests können gleichzeitig durchgehen

## Zukünftige Verbesserungen

- [ ] Cache-Hit-Rate-Metriken
- [ ] Admin-Dashboard für API-Statistiken
- [ ] Automatische Cleanup-Cloud-Function
- [ ] Erweiterte Rate-Limiting-Strategien (z.B. pro User)
