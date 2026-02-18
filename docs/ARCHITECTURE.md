# JobFlow L8 – Architektur (Endgültige Fertigstellung)

## Übersicht

JobFlow folgt einer **Domain-Driven-Design / Hexagonal-Architektur** mit klarer Schichtung:

- **Domain** – reine Fachlogik (Entities, Status, Events), keine Infrastruktur
- **Application** – Use Cases und Ports (Interfaces)
- **Infrastructure** – Firebase-Repositories, Cloud-Function-Gateways, EventBus
- **Composition** – eine Stelle, an der alles verdrahtet wird
- **UI** – app/, components/ nutzen Use Cases über Hooks oder direkt über Composition

## Verzeichnisstruktur

```
src/
├── domain/          # Bounded Contexts: assignment, shift, timesheet, user, facility
├── application/     # ports/ (Repositories, Gateways), useCases/
├── infrastructure/  # firebase/ (Repos, CloudFunctionsGateway), events/ (EventBus)
├── plugins/         # Registry, notifications-Plugin
├── composition.ts   # Composition Root: alle Use Cases, initPlugins()
```

## Nutzung in der App

### 1. Plugins (automatisch)

Beim App-Start wird `PluginInit` gerendert und ruft einmalig `initPlugins()` auf. Die Plugin-Registry (z. B. Notifications mit EventBus-Subscribe) ist damit aktiv.

### 2. Domain-Hooks (empfohlen für Lese-Zugriffe)

```ts
import { useDomainAssignments, useDomainAssignment } from '@/lib/hooks/useDomainAssignments';

// Liste der Einsätze des aktuellen Users
const { assignments, isLoading, error, refetch } = useDomainAssignments({ companyId, limit: 50 });

// Einzelnes Assignment
const { assignment, isLoading } = useDomainAssignment(assignmentId);
```

### 3. Direkt aus Composition (für erweiterte Fälle)

```ts
import {
  listAssignmentsForUser,
  getAssignmentById,
  createAssignmentWithMatching,
  listShiftsForFacility,
  listTimesheetsForUser,
  getUserById,
  listFacilitiesByCompany,
} from '@/src/composition';

const assignments = await listAssignmentsForUser.execute({ userId, companyId });
const result = await createAssignmentWithMatching.execute(payload, idToken);
```

### 4. Bestehende Services & Migration

`lib/services/*` bleiben für Schreibzugriffe und erweiterte Lesefälle erhalten. **Bereits migriert:** Mitarbeiter „Meine Einsätze“ (Liste und Detail) nutzen `useDomainAssignments` bzw. `useDomainAssignment`; weitere Seiten können schrittweise folgen.

### 5. Domain-Generator (DX)

Neuen Bounded Context anlegen:

```bash
npm run generate:domain -- --name=myFeature
```

Erzeugt `src/domain/myFeature/` mit Entity-Klasse und index. Anschließend in `src/domain/index.ts` exportieren: `export * from './myFeature';`

## Regeln

- **Kein Firestore in Components** – nur über Repositories/Use Cases
- **Keine Business-Logik in der UI** – Domain/Application nutzen
- **Eine Datei &lt; 150 Zeilen** (Ziel; lib/services noch nicht vollständig geteilt)
- **Domain → Application → Infrastructure** – Abhängigkeiten nur nach innen

## Metriken & Health

Siehe [ARCHITECTURE-HEALTH.md](../ARCHITECTURE-HEALTH.md) für aktuelle Metriken, CI/CD und optionales Backlog.
