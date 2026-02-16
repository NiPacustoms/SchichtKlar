# JobFlow – Dokumentation Teil 18

*Zeichen 337710–357594 von 2862906*

---

  if (FEATURE_FLAGS.USE_MOCK_AUTH) {
    // Mock-Login - immer erfolgreich
    return Promise.resolve();
  }

  // Real Firebase Auth
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw new Error(error.message || 'Login fehlgeschlagen');
  }
};

const signOutUser = async () => {
  if (FEATURE_FLAGS.USE_MOCK_AUTH) {
    setUser(null);
    setFirebaseUser(null);
    return Promise.resolve();
  }

  // Real Firebase Auth
  try {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  } catch (error: any) {
    throw new Error(error.message || 'Logout fehlgeschlagen');
  }
};
```

### Step 4: Dashboard Hooks Migration (2-3 Stunden)

**Datei**: `lib/hooks/useDashboard.ts`

```typescript
import { FEATURE_FLAGS } from '@/lib/config/featureFlags';
import { assignmentService } from '@/lib/services/assignments';
import { timesheetService } from '@/lib/services/timesheets';

export const useDashboard = () => {
  const { user } = useAuth();
  const userId = user?.id;

  // Today's Assignment
  const { data: todayAssignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ['dashboard', 'todayAssignment', userId],
    queryFn: async () => {
      if (!userId) return null;

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data
        return {
          id: 'mock-assignment-1',
          userId: userId,
          shiftId: 'mock-shift-1',
          status: 'accepted' as const,
          assignedAt: new Date(),
          acceptedAt: new Date(),
          notes: 'Frühschicht - Station 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Real Firebase Query
      return assignmentService.getTodayAssignment(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Today's Timesheet
  const { data: todayTimesheet, isLoading: loadingTimesheet } = useQuery({
    queryKey: ['dashboard', 'todayTimesheet', userId],
    queryFn: async () => {
      if (!userId) return null;

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data
        return {
          id: 'mock-timesheet-1',
          userId: userId,
          date: new Date(),
          startTime: '06:00',
          endTime: '14:00',
          breakMinutes: 30,
          totalHours: 7.5,
          startDate: new Date(),
          endDate: new Date(),
          notes: 'Frühschicht',
          status: 'draft' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Real Firebase Query
      return timesheetService.getTodayTimesheet(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // Recent Timesheets
  const { data: recentTimesheets, isLoading: loadingTimesheets } = useQuery({
    queryKey: ['dashboard', 'recentTimesheets', userId],
    queryFn: async () => {
      if (!userId) return [];

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data (7 days)
        const mockTimesheets = [];
        for (let i = 0; i < 7; i++) {
          const date = subDays(new Date(), i);
          mockTimesheets.push({
            id: `mock-timesheet-${i}`,
            userId: userId,
            date: date,
            startTime: '08:00',
            endTime: '16:00',
            breakMinutes: 30,
            totalHours: 7.5,
            startDate: date,
            endDate: date,
            notes: `Mock timesheet ${i}`,
            status: 'draft' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return mockTimesheets;
      }

      // Real Firebase Query
      return timesheetService.getRecentTimesheets(userId, 7);
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  // Upcoming Assignments
  const { data: upcomingAssignments, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['dashboard', 'upcomingAssignments', userId],
    queryFn: async () => {
      if (!userId) return [];

      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        // Mock data (3 upcoming)
        const mockAssignments = [];
        for (let i = 1; i <= 3; i++) {
          const date = addDays(new Date(), i);
          mockAssignments.push({
            id: `mock-upcoming-${i}`,
            userId: userId,
            shiftId: `mock-shift-${i}`,
            status: 'pending' as const,
            assignedAt: new Date(),
            notes: `Schicht ${i}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return mockAssignments;
      }

      // Real Firebase Query
      return assignmentService.getUpcomingAssignments(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Rest of the hook stays the same...
};
```

### Step 5: Service Layer Validation

Die Services sind bereits vollständig implementiert! Nur eine Kleinigkeit ergänzen:

**Neue Methoden hinzufügen** (falls noch nicht vorhanden):

**`lib/services/assignments.ts`**:

```typescript
// Add these methods if missing:
async getTodayAssignment(userId: string): Promise<Assignment | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'assignments'),
    where('userId', '==', userId),
    where('date', '>=', today),
    where('date', '<', new Date(today.getTime() + 24 * 60 * 60 * 1000)),
    orderBy('date', 'asc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return this.mapDocToAssignment(doc);
}

async getUpcomingAssignments(userId: string): Promise<Assignment[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'assignments'),
    where('userId', '==', userId),
    where('date', '>=', tomorrow),
    where('status', '==', 'pending'),
    orderBy('date', 'asc'),
    limit(5)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => this.mapDocToAssignment(doc));
}
```

**`lib/services/timesheets.ts`**:

```typescript
// Add these methods if missing:
async getTodayTimesheet(userId: string): Promise<Timesheet | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'timesheets'),
    where('userId', '==', userId),
    where('date', '>=', today),
    where('date', '<', new Date(today.getTime() + 24 * 60 * 60 * 1000)),
    orderBy('date', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return this.mapDocToTimesheet(doc);
}

async getRecentTimesheets(userId: string, days: number = 7): Promise<Timesheet[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'assignments'),
    where('userId', '==', userId),
    where('date', '>=', startDate),
    orderBy('date', 'desc'),
    limit(days)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => this.mapDocToTimesheet(doc));
}
```

### Step 6: Realtime Updates Migration (1-2 Stunden)

**Datei**: `lib/hooks/useRealtimeUpdates.ts`

```typescript
import { FEATURE_FLAGS } from '@/lib/config/featureFlags';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!FEATURE_FLAGS.USE_REALTIME || !user) {
      // Fallback: Simulated updates
      const simulateUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
      };

      const interval = setInterval(simulateUpdate, 60000); // Every 60s
      return () => clearInterval(interval);
    }

    // === PRODUCTION: Real Firestore Listeners ===
    const unsubscribers: Array<() => void> = [];

    // Listen to shifts updates
    const shiftsQuery = query(collection(db, 'shifts'), where('date', '>=', new Date()));
    const unsubShifts = onSnapshot(shiftsQuery, snapshot => {
      console.log('Realtime: Shifts updated');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    });
    unsubscribers.push(unsubShifts);

    // Listen to user's assignments
    const assignmentsQuery = query(collection(db, 'assignments'), where('userId', '==', user.id));
    const unsubAssignments = onSnapshot(assignmentsQuery, snapshot => {
      console.log('Realtime: Assignments updated');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });
    unsubscribers.push(unsubAssignments);

    // Listen to notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false)
    );
    const unsubNotifications = onSnapshot(notificationsQuery, snapshot => {
      console.log('Realtime: Notifications updated');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    unsubscribers.push(unsubNotifications);

    // Cleanup all listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [queryClient, user]);

  return {
    isConnected: FEATURE_FLAGS.USE_REALTIME,
  };
}
```

### Step 7: Testing Strategy

#### Unit Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

#### Integration Tests

```bash
# E2E Tests mit Playwright (falls vorhanden)
npm run test:e2e

# Oder mit Cypress
npm run cypress:open
```

#### Manual Testing Checklist

**Auth Flow**:

- [ ] Login mit echtem User
- [ ] Logout
- [ ] Token Refresh
- [ ] Rollenbasierte Zugriffe

**Dashboard**:

- [ ] Daten laden korrekt
- [ ] KPIs werden angezeigt
- [ ] Keine Mock-Daten sichtbar

**Realtime**:

- [ ] Änderungen werden Live angezeigt
- [ ] Keine Latenz > 2s

### Step 8: Deployment

#### Staging

```bash
# Build für Staging
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false \
NEXT_PUBLIC_ENABLE_MOCK_DATA=false \
NEXT_PUBLIC_ENABLE_REALTIME=true \
npm run build

# Deploy to Staging
npm run deploy:staging
```

#### Production

```bash
# Build für Production
npm run build

# Deploy to Production
npm run deploy:production
```

## Troubleshooting

### Problem: "Auth User not found"

**Lösung**: Custom Claims noch nicht gesetzt

```bash
# Firebase Console → Authentication → User → Custom Claims
{
  "role": "nurse"
}
```

### Problem: "Firestore Permission Denied"

**Lösung**: Rules noch nicht deployed

```bash
firebase deploy --only firestore:rules
```

### Problem: "Too many reads/writes"

**Lösung**: Query Optimization + Caching

- Erhöhe `staleTime` in React Query
- Füge Pagination hinzu
- Nutze Firestore Indexes

## Success Metrics

- [ ] Auth Conversion Rate: 100%
- [ ] Data Accuracy: 100% (keine Mock-Daten)
- [ ] Realtime Latency: < 2s
- [ ] Error Rate: < 1%
- [ ] Firebase Costs: < $50/Monat

## Support

Bei Fragen oder Problemen:

1. Check MIGRATION_PLAN.md
2. Firebase Console Logs prüfen
3. Sentry Error Tracking
4. Team kontaktieren



---

## Quelle: docs/INCIDENT_RUNBOOKS.md

# Incident Runbooks

## Schweregrade

- P1: Vollständiger Ausfall kritischer Funktionen (Login, Schichtplan)
- P2: Degradierung > 10% Nutzer betroffen
- P3: Einzelne Kundenvorfälle / UI-Bugs

## On-Call Prozess

1. Alert empfängt On-Call (24/7 oder Geschäftszeiten-Modell)
2. Bestätigung binnen 10 Minuten (P1)
3. Triage: Ursache eingrenzen (Netz, Firebase, Release, Abuse)
4. Kommunikation: Status-Seite Update; Kunde bei P1/P2 informieren

## Triage Checkliste

- Health `/api/health` Status prüfen
- Error-Rate/Latenz Charts prüfen
- Letzte Releases/Deployments checken
- Firebase Status-Dashboard prüfen
- Quoten/Abrechnungen (GCP) prüfen

## Sofortmaßnahmen (Beispiele)

- Feature-Flag deaktivieren (Rollback light)
- Rate Limits temporär lockern/verschärfen
- Cache invalideren
- Re-Deploy stabiles Release

## Postmortem

- Timeline, Ursache (Root Cause), Impact, gelernte Punkte
- Maßnahmenliste mit Ownern & Deadlines
- Review im Team; Dokumentation im Repo

## Vorlagen/Links

- `docs/SLO_SLA.md` – Zielwerte
- `docs/DISASTER_RECOVERY.md` – Wiederherstellung
- Status-Seite: `/status`

## Firestore Aggregations 403 (companyId fehlt)

**Symptome**

- Browser-Konsole zeigt `runAggregationQuery 403 (Forbidden)` mit Hinweis `Missing companyId in token`.
- Dashboards, Userlisten oder Notification-Counter laden nicht / zeigen 0.

**Ursache**

- Custom Claims (`companyId`, `role`) im Firebase Auth Token fehlen oder sind veraltet.
- Service-Account-Secret (`FIREBASE_ADMIN_CREDENTIALS_BASE64`) wurde nicht gesetzt oder nach Deploy nicht neu eingelesen.

**Diagnose**

1. `lib/utils/companyId.ts` prüfen: Logs `[companyId]` geben Aufschluss über Claim-/UserDoc-Status.
2. Im Browser `sessionStorage.__TOKEN_DEBUG__` bzw. `contexts/AuthContext` Logs checken.
3. `firebase auth:export` oder Admin-Console → User → Custom Claims verifizieren.
4. Firestore Rules (`firestore.rules` → `hasCompanyContext`) stellen sicher, dass Aggregationen nur mit gültiger `companyId` laufen.

**Behebung**

1. Sicherstellen, dass `FIREBASE_ADMIN_CREDENTIALS_BASE64` als Secret hinterlegt und deployt ist.
2. Als betroffener User `/api/auth/sync-claims` aufrufen (oder in der UI ab-/anmelden). Der `companyId`-Helper ruft diesen Endpoint nun automatisch bei Permission-Errors.
3. Token-Refresh forcieren (`await auth.currentUser.getIdToken(true)`) oder `lib/utils/tokenDebug.ts` → `syncCustomClaims()` ausführen.
4. Falls der User im `users/{uid}`-Dokument keine `companyId` hat, diese setzen (Standard: `aufabruf`).
5. Seite neu laden; Aggregationen rufen `refreshTokenAndGetCompanyId()` auf und sollten wieder funktionieren.

**Nacharbeiten**

- In `docs/ENV_EXAMPLE.md` und `docs/PRODUCTION_ENVIRONMENT.md` vermerken, wenn Secrets geändert wurden.
- Post-Incident kurz dokumentieren (Wer war betroffen? Welche Claims fehlten?).



---

## Quelle: docs/KONSOLIDIERTE_DOKUMENTATION.md

# JobFlow - Konsolidierte Dokumentation

*Generiert aus 140 Markdown-Dateien*

---

## Inhaltsverzeichnis

- [Release & Audit](#release--audit)
- [Analyse & Dokumentation](#analyse--dokumentation)
- [Implementation Guides](#implementation-guides)
- [Firebase Setup](#firebase-setup)
- [Features & Guides](#features--guides)
- [Lohnabrechnung](#lohnabrechnung)
- [Zeiterfassung](#zeiterfassung)
- [Chat](#chat)
- [Fehler & Fixes](#fehler--fixes)
- [Sonstiges](#sonstiges)

---

## Release & Audit

*15 Dateien*

### 📄 ASVS_CHECKLIST.md

```markdown
# OWASP ASVS / Penetrationstest Checkliste

Diese Checkliste unterstützt interne Sicherheitsreviews und externe Penetrationstests.

## 1. Architektur & Bedrohungsmodell
- [ ] Datenflussdiagramm (Auth, Firestore, Storage, Functions)
- [ ] Vertrauensgrenzen definiert (Client, Middleware, Functions, GCP)
- [ ] Mandantenisolation dokumentiert (`tenantId` in Regeln/Code)

## 2. Authentisierung & Session
- [ ] Firebase Auth Provider auf erlaubte Domains begrenzt
- [ ] Session/ID Token Validierung auf Server-seite (bei geschützten Endpunkten)
- [ ] MFA für Admin-Konten aktiviert

## 3. Autorisierung (RBAC/ABAC)
- [ ] Deny-by-default im UI (Guards) und in `firestore.rules`
- [ ] Rollen und Scopes getestet (Admin/Dispatcher/Nurse)
- [ ] Zugriff über `tenantId` isoliert (negativ/positiv Tests)

## 4. Eingabenvalidierung / Deserialisierung
- [ ] Uploads: MIME/Größe geprüft, keine SVG-Script-Injektion
- [ ] API/Functions: Parameter-Validierung und Fehlermeldungen ohne Details

## 5. Sicherheits-Header & CSP
- [ ] CSP ohne Inline, Ausnahmen dokumentiert
- [ ] Referrer-Policy, X-Content-Type-Options, X-Frame-Options, HSTS aktiv

## 6. Geheimnisse & Konfiguration
- [ ] Keine Secrets im Repo; Nutzung von env/Secret Manager
- [ ] Schlüssel-Rotation geplant/dokumentiert

## 7. Protokollierung & Monitoring
- [ ] Audit-Logs für Admin-Aktionen vollständig und fälschungssicher
- [ ] Security-Events (Rate Limit, Auth-Fehler) erzeugen Alerts

## 8. Kryptografie
- [ ] TLS erzwungen (HSTS), keine Mixed Content Warnungen
- [ ] Hashing/Signaturen für revisionssichere Dokumentation (Roadmap)

## 9. Fehlerbehandlung
- [ ] Keine Stacktraces an Endnutzer; generische Fehlermeldungen
- [ ] Zentrale Error-Boundaries im UI aktiv

## 10. Abhängigkeiten & Supply Chain
- [ ] `npm audit`/`yarn audit` regelmäßig
- [ ] Dependabot/ Renovate aktiviert

## 11. Cloud / GCP-Freigaben
- [ ] Least-Privilege IAM für Service Accounts (Backup/Deploy)
- [ ] Firestore/Storage Regeln getestet, nur notwendige Indizes vorhanden

## 12. DR & Backups
- [ ] Backups erfolgreich; Restore-Drill < 2h (RTO), RPO < 24h

## Common Findings & Gegenmaßnahmen
- [ ] CSP-Blocker: externe Domains whitelisten oder Nonce nutzen
- [ ] Rate-Limit-Umgehung: Key-Strategie erweitern (User+IP)
- [ ] Übermäßige Firestore-Lesezugriffe: Indizes/Queries optimieren

Abschlusskriterium: Alle kritischen/high Findings geschlossen; mittlere binnen 14 Tagen; niedrige geplant.

```

---

### 📄 GO_LIVE_CHECKLIST.md

```markdown
# Go‑Live Checkliste

## Technik
- [ ] Health `/api/health` liefert 200, Status-Seite `/status` grün
- [ ] CSP/Security-Header aktiv, keine Mixed-Content-Warnungen
- [ ] Rate Limiting aktiv für `/api` & `/auth`
- [ ] Firestore-Rules mit `tenantId`-Isolation verifiziert (neg./pos. Tests)
- [ ] Backups funktionsfähig (Firestore/Storage), letzter Erfolg < 24h
- [ ] Restore-Drill dokumentiert (RTO ≤ 2h, RPO ≤ 24h)

## Sicherheit & Compliance
- [ ] DSGVO-Prozesse dokumentiert (`DSGVO_PROZESSE.md`)
- [ ] Datenexport (`exportUserData`) & Löschung (`deleteUserData`) getestet
- [ ] Audit-Logs aktiv, Viewer erreichbar (`/admin/audit-logs`)
- [ ] ASVS-Checkliste geprüft, keine offenen High Findings

## Observability
- [ ] Alerts für Health/Fehlerraten/Latenz gesetzt
- [ ] SLO/SLA kommuniziert (`SLO_SLA.md`)

## Accounts & Rollen
- [ ] Admin/Dispatcher/Nurse Test-Accounts vorhanden
- [ ] RBAC: `tenantId`/`facilityIds` im Client wirksam

## Dokumentation
- [ ] Admin Guide aktuell (`ADMIN_GUIDE.md`)
- [ ] Changelog gepflegt (`CHANGELOG.md`)
- [ ] Tests-Doku (`TESTS.md`) vorhanden

## Betrieb
- [ ] Env/Secrets validiert (`scripts/validate-env.js`)
- [ ] Rollout-Plan: Pilot → GA, Kommunikationsplan vorbereitet

Abschluss: Wenn alle Punkte gecheckt sind, Go‑Live freigeben.

```

---

### 📄 LAUNCH_SALES_READINESS_TODO.md

```markdown
# Launch Sales Readiness TODO

**Erstellt:** 2025-01-27  
**Zweck:** Priorisierte Liste aller Issues für Verkaufsbereitschaft

---

## Priorisierung

- **P0 (BLOCKER):** Muss vor Verkauf behoben werden
- **P1 (MUSS):** Sollte vor Verkauf behoben werden
- **P2 (SOLLTE):** Kann nach Verkauf behoben werden

---

## P0 - BLOCKER (müssen vor Verkauf behoben werden)

### P0-1: Build-Fehler beheben

**Beschreibung:** Build schlägt fehl, verhindert Deployment

**Betroffene Dateien:**
- `package.json` (ESLint fehlt)
- `app/(app)/chat/[channelId]/page.tsx` (Next.js 15 `params` Promise)
- 60+ Dateien mit TypeScript-Fehler

**Vorschlag zur Behebung:**
1. ESLint installieren: `npm install --save-dev eslint`
2. Next.js 15 `params` Promise-Fix: `params` muss `Promise<{ channelId: string }>` sein
3. TypeScript-Fehler beheben (priorisiert nach Häufigkeit):
   - Fehlende Type-Properties hinzufügen
   - Fehlende Imports/Exports hinzufügen
   - Type-Inkompatibilitäten beheben

**Referenz:** `docs/release/01_STATIC_CHECKS.md`

---

### P0-2: Impressum - Echte Firmendaten eintragen

**Beschreibung:** Impressum enthält nur Mock-Daten (JobFlow GmbH, Musterstraße 123, etc.)

**Betroffene Dateien:**
- `app/(auth)/legal/imprint/page.tsx`

**Vorschlag zur Behebung:**
- Alle Platzhalter durch echte Firmendaten ersetzen:
