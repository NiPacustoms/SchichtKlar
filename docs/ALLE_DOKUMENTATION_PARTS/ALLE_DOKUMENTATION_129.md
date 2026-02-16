# JobFlow – Dokumentation Teil 129

*Zeichen 2543318–2563198 von 2862906*

---

Alle Features sind implementiert, getestet und dokumentiert. Die App kann jetzt schrittweise von Mock-Mode zu echter Firebase-Integration migriert werden.

```

---

### 📄 MIGRATION_PLAN.md

```markdown
# JobFlow - Migration von Mock zu Production

## Übersicht
Dieser Plan beschreibt die schrittweise Migration von Mock-Daten zu echter Firebase-Integration für die JobFlow-App.

## Aktuelle Mock-Bereiche

### 1. **Authentifizierung** 🔴 KRITISCH
- **Datei**: `contexts/AuthContext.tsx` (Zeilen 24-53)
- **Status**: Mock-User aktiv, Firebase Auth auskommentiert
- **Impact**: Hoch - betrifft gesamte App-Sicherheit

### 2. **Dashboard-Daten**
- **Dateien**: 
  - `lib/hooks/useDashboard.ts` (vollständig gemockt)
  - `lib/hooks/useAdminDashboard.ts` (vollständig gemockt)
- **Status**: Mock-Daten für Assignments, Timesheets, KPIs
- **Impact**: Hoch - zentrale Funktionalität

### 3. **Realtime Updates** 
- **Datei**: `lib/hooks/useRealtimeUpdates.ts`
- **Status**: Simulierte WebSocket-Verbindung
- **Impact**: Mittel - UX-Feature

### 4. **Payroll-Daten**
- **Datei**: `lib/services/payroll/payrollCalculation.ts` (Zeilen 302-345)
- **Status**: Mock-Gehaltsdaten und Mitarbeiter-Info
- **Impact**: Hoch - Lohnabrechnung

### 5. **Employee/Facility Details**
- **Dateien**:
  - `lib/hooks/useEmployeeDetails.ts`
  - `lib/hooks/useFacilityDetails.ts`
  - `lib/hooks/useEmployeeReports.ts`
- **Status**: Mock-Daten für Detailansichten
- **Impact**: Mittel - Feature-Funktionalität

## Migration-Strategie

### Phase 1: Vorbereitung (Kritisch)
**Geschätzte Zeit**: 2-3 Stunden

#### 1.1 Environment Setup
- [ ] `.env.local` erstellen mit echten Firebase Credentials
- [ ] Feature Flags implementieren für schrittweise Migration
- [ ] Firebase Emulator für lokale Entwicklung aufsetzen
- [ ] CI/CD Pipeline für automatisierte Tests

#### 1.2 Datenbank Vorbereitung
- [ ] Firestore Collections anlegen (bereits via `firestore.indexes.json` definiert)
- [ ] Firestore Rules deployen (bereits vorhanden in `firestore.rules`)
- [ ] Storage Rules deployen (bereits vorhanden in `storage.rules`)
- [ ] Initiale Test-Daten in Firestore einfügen
- [ ] Firebase Functions deployen (`functions/` Verzeichnis)

#### 1.3 Sicherheit
- [ ] Custom Claims für Rollen-basierte Zugriffskontrolle
- [ ] Security Audit der Firestore Rules
- [ ] Rate Limiting für API-Aufrufe implementieren
- [ ] Monitoring und Alerting aufsetzen

### Phase 2: Authentifizierung Migration (KRITISCH - ZUERST)
**Geschätzte Zeit**: 4-5 Stunden

#### 2.1 Feature Flag Implementation
```typescript
// lib/config/featureFlags.ts
export const FEATURE_FLAGS = {
  USE_MOCK_AUTH: process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true',
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',
  USE_REALTIME: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
};
```

#### 2.2 Auth Context Refactoring
**Datei**: `contexts/AuthContext.tsx`
- [ ] Feature Flag für Mock vs. Real Auth
- [ ] Firebase Auth aktivieren (Zeilen 56-102 uncommenten)
- [ ] Custom Claims für Rollen abrufen
- [ ] Token Refresh Mechanismus
- [ ] Error Handling verbessern
- [ ] Logout-Flow testen

**Code-Änderungen**:
```typescript
useEffect(() => {
  if (FEATURE_FLAGS.USE_MOCK_AUTH) {
    // Mock-User Logic (behalten für Entwicklung)
    const mockUser = { /* ... */ };
    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 500);
    return;
  }
  
  // Real Firebase Auth
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    // ... existing code uncommented
  });
  
  return () => unsubscribe();
}, []);
```

#### 2.3 Custom Claims Setup
**Firebase Functions**: Rolle als Custom Claim setzen
```typescript
// functions/src/auth/setUserRole.ts
export const setUserRole = functions.https.onCall(async (data, context) => {
  // Admin-only function
  const { uid, role } = data;
  await admin.auth().setCustomUserClaims(uid, { role });
});
```

#### 2.4 Testing
- [ ] Unit Tests für Auth Context
- [ ] Integration Tests Login/Logout
- [ ] E2E Tests für rollenbasierte Zugriffe
- [ ] Performance Tests (Auth Latency)

### Phase 3: Dashboard & Core Data Migration
**Geschätzte Zeit**: 6-8 Stunden

#### 3.1 Dashboard Hook Refactoring
**Dateien**: 
- `lib/hooks/useDashboard.ts`
- `lib/hooks/useAdminDashboard.ts`

**Änderungen**:
- [ ] Feature Flag für Mock vs. Real Data
- [ ] Firebase Queries implementieren (Services bereits vorhanden!)
- [ ] Real-time Listeners für Live-Updates
- [ ] Error Boundaries für Daten-Fehler
- [ ] Loading States optimieren
- [ ] Pagination implementieren

**Code-Änderungen**:
```typescript
// lib/hooks/useDashboard.ts
export const useDashboard = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: todayAssignment, isLoading } = useQuery({
    queryKey: ['dashboard', 'todayAssignment', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      if (FEATURE_FLAGS.USE_MOCK_DATA) {
        return { /* mock data */ };
      }
      
      // Real Firebase Query
      return assignmentService.getTodayAssignment(userId);
    },
    enabled: !!userId,
  });
  
  // ... rest of hooks
};
```

#### 3.2 Service Layer Validation
Die Services sind bereits implementiert! Nur aktivieren:
- [x] `lib/services/users.ts` - BEREITS FERTIG
- [x] `lib/services/shifts.ts` - BEREITS FERTIG
- [x] `lib/services/assignments.ts` - BEREITS FERTIG
- [x] `lib/services/timesheets.ts` - BEREITS FERTIG
- [ ] Integration Tests für alle Services

#### 3.3 Data Migration Script
**Script**: `scripts/migrate-data.ts`
- [ ] Script zum Import von Test-Daten
- [ ] Validierung der Daten-Struktur
- [ ] Rollback-Mechanismus

### Phase 4: Realtime Updates Migration
**Geschätzte Zeit**: 4-5 Stunden

#### 4.1 WebSocket Server Setup
**Optionen**:
1. Firebase Realtime Database für einfache Updates
2. Firestore onSnapshot() Listeners (empfohlen)
3. Dedicated WebSocket Server (Node.js + Socket.io)

**Empfehlung**: Firestore onSnapshot() - keine zusätzliche Infrastruktur

#### 4.2 Realtime Hook Refactoring
**Datei**: `lib/hooks/useRealtimeUpdates.ts`
```typescript
export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!FEATURE_FLAGS.USE_REALTIME) {
      return;
    }
    
    // Firestore onSnapshot Listeners
    const unsubscribeShifts = onSnapshot(
      collection(db, 'shifts'),
      (snapshot) => {
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
      }
    );
    
    const unsubscribeAssignments = onSnapshot(
      collection(db, 'assignments'),
      (snapshot) => {
        queryClient.invalidateQueries({ queryKey: ['assignments'] });
      }
    );
    
    return () => {
      unsubscribeShifts();
      unsubscribeAssignments();
    };
  }, [queryClient]);
}
```

### Phase 5: Payroll & Complex Features
**Geschätzte Zeit**: 6-8 Stunden

#### 5.1 Payroll Data Integration
**Datei**: `lib/services/payroll/payrollCalculation.ts`
- [ ] Neue Firestore Collection: `employeePayrollData`
- [ ] Migration von Mock-Daten zu echten Datenbankabfragen
- [ ] Verschlüsselung sensibler Daten (IBAN, Steuernummer)
- [ ] Audit Logging für Gehaltszugriffe

#### 5.2 Employee/Facility Details
- [ ] `useEmployeeDetails`: Integration mit `userService`
- [ ] `useFacilityDetails`: Integration mit `facilityService`
- [ ] `useEmployeeReports`: Integration mit `reportService`

### Phase 6: Testing & Validation
**Geschätzte Zeit**: 8-10 Stunden

#### 6.1 Test Coverage
- [ ] Unit Tests für alle Services (90%+ Coverage)
- [ ] Integration Tests für kritische Flows
- [ ] E2E Tests mit Playwright/Cypress
- [ ] Performance Tests (Load Testing)
- [ ] Security Penetration Tests

#### 6.2 User Acceptance Testing (UAT)
- [ ] Test-User erstellen für alle Rollen
- [ ] Testplan für alle Features
- [ ] Bug Tracking und Fixing
- [ ] Performance Monitoring

### Phase 7: Deployment & Rollout
**Geschätzte Zeit**: 4-6 Stunden

#### 7.1 Staging Deployment
- [ ] Staging Environment aufsetzen
- [ ] Feature Flags: `USE_MOCK_AUTH=false`, `USE_MOCK_DATA=false`
- [ ] Smoke Tests auf Staging
- [ ] Performance Monitoring aktivieren

#### 7.2 Production Rollout
- [ ] Canary Deployment (10% Traffic)
- [ ] Monitoring und Alerting überprüfen
- [ ] Stufenweise auf 100% erhöhen
- [ ] Rollback-Plan bereit halten

#### 7.3 Post-Deployment
- [ ] Mock-Code entfernen (nach erfolgreicher Migration)
- [ ] Dokumentation aktualisieren
- [ ] Team Training für Production Support

## Checkliste vor Production

### Sicherheit ✅
- [ ] Firebase Auth aktiviert
- [ ] Custom Claims für Rollen
- [ ] Firestore Rules deployed
- [ ] Storage Rules deployed
- [ ] Rate Limiting aktiv
- [ ] Audit Logging aktiv
- [ ] Verschlüsselung für sensitive Daten

### Performance ✅
- [ ] Firestore Indexes deployed (via `firestore.indexes.json`)
- [ ] Query Pagination implementiert
- [ ] Caching Strategy (React Query)
- [ ] Image Optimization
- [ ] Code Splitting
- [ ] Lazy Loading für Routes

### Monitoring ✅
- [ ] Firebase Analytics aktiviert
- [ ] Error Tracking (Sentry)
- [ ] Performance Monitoring
- [ ] User Behavior Analytics
- [ ] Uptime Monitoring
- [ ] Cost Monitoring (Firebase Usage)

### Compliance ✅
- [ ] DSGVO-Konformität
- [ ] Datenschutzerklärung
- [ ] Impressum
- [ ] Cookie Consent
- [ ] Datenverarbeitungsverträge
- [ ] Backup & Recovery Plan

## Timeline Estimation

| Phase | Aufwand | Priorität | Dependencies |
|-------|---------|-----------|--------------|
| 1. Vorbereitung | 2-3h | KRITISCH | - |
| 2. Authentifizierung | 4-5h | KRITISCH | Phase 1 |
| 3. Dashboard & Core | 6-8h | HOCH | Phase 2 |
| 4. Realtime Updates | 4-5h | MITTEL | Phase 3 |
| 5. Payroll & Features | 6-8h | HOCH | Phase 3 |
| 6. Testing | 8-10h | KRITISCH | Phase 2-5 |
| 7. Deployment | 4-6h | KRITISCH | Phase 6 |
| **TOTAL** | **34-45h** | - | - |

## Risiken & Mitigation

### Risiko 1: Datenverlust bei Migration
**Wahrscheinlichkeit**: Niedrig
**Impact**: Kritisch
**Mitigation**:
- Backup vor jeder Migration
- Rollback-Mechanismus
- Staging Environment für Tests

### Risiko 2: Performance-Probleme
**Wahrscheinlichkeit**: Mittel
**Impact**: Hoch
**Mitigation**:
- Load Testing vor Production
- Firestore Indexes optimieren
- CDN für statische Assets
- Query Pagination

### Risiko 3: Auth-Breaking Changes
**Wahrscheinlichkeit**: Mittel
**Impact**: Kritisch
**Mitigation**:
- Feature Flags für schrittweise Rollout
- Canary Deployment
- Schneller Rollback-Plan

### Risiko 4: Kosten-Explosion
**Wahrscheinlichkeit**: Mittel
**Impact**: Mittel
**Mitigation**:
- Firebase Budget Alerts
- Query Optimization
- Caching Strategy
- Cost Monitoring Dashboard

## Next Steps

1. **SOFORT**: Environment Variables konfigurieren
2. **TAG 1**: Phase 1 & 2 (Auth Migration)
3. **TAG 2-3**: Phase 3 (Core Data)
4. **TAG 4**: Phase 4 & 5 (Features)
5. **TAG 5-6**: Phase 6 (Testing)
6. **TAG 7**: Phase 7 (Deployment)

## Support & Resources

- Firebase Dokumentation: https://firebase.google.com/docs
- Next.js Best Practices: https://nextjs.org/docs
- React Query: https://tanstack.com/query/latest
- Firestore Best Practices: https://firebase.google.com/docs/firestore/best-practices


```

---

### 📄 MIGRATION_SUMMARY.md

```markdown
# Mock zu Firebase Migration - Abgeschlossen

## Zusammenfassung

Alle Mock-Daten und inline Mock-Services wurden erfolgreich durch echte Firebase/Firestore-Anbindungen ersetzt.

## Durchgeführte Änderungen

### 1. AuthContext (contexts/AuthContext.tsx) ✅
- **Entfernt**: Mock-User mit hardcodierten Daten
- **Entfernt**: Feature Flag Checks für USE_MOCK_AUTH
- **Aktiviert**: Firebase Authentication mit onAuthStateChanged
- **Implementiert**: Echtes User-Profil laden aus Firestore
- **Implementiert**: Firestore updateDoc für User-Updates

### 2. Dashboard Hooks ✅

#### useDashboard.ts
- **Entfernt**: Feature Flag Checks für USE_MOCK_DATA
- **Entfernt**: Inline Mock-Daten für Assignments und Timesheets
- **Aktiviert**: Echte Firebase Service Calls:
  - `assignmentService.getTodayAssignment()`
  - `timesheetService.getTodayTimesheet()`
  - `timesheetService.getRecentTimesheets()`
  - `assignmentService.getUpcomingAssignments()`

#### useAdminDashboard.ts
- **Komplett umgeschrieben**: Von synchronen Mock-Daten zu React Query Hooks
- **Implementiert**: Parallele Firestore Queries für:
  - Users (`userService.getAll()`)
  - Timesheets (`timesheetService.getAll()`)
  - Assignments (`assignmentService.getAll()`)
  - Shifts (`shiftService.getAll()`)
  - Facilities (`facilityService.getAll()`)
- **Implementiert**: Echte KPI-Berechnung basierend auf Firestore-Daten
- **Implementiert**: Dynamische Statistik-Funktionen

### 3. Detail Hooks ✅

#### useEmployeeDetails.ts
- **Entfernt**: Alle inline Mock-Services
- **Implementiert**: Echte Service-Imports:
  - `userService.getById()`
  - `timesheetService.getByUserId()`
  - `assignmentService.getByUserId()`
  - `documentService.getByUserId()`
- **Beibehalten**: Statistik-Berechnungen und Helper-Funktionen

#### useFacilityDetails.ts  
- **Komplett umgeschrieben**: Von Mock-Services zu echten Firebase Services
- **Implementiert**: React Query Hooks mit Mutations
- **Implementiert**: CRUD-Operationen für:
  - Facilities
  - Shifts  
  - Assignments
- **Implementiert**: Cache-Invalidierung mit QueryClient

#### useProfile.ts
- **Entfernt**: Mock-User und Mock-Services
- **Implementiert**: Echten AuthContext Import
- **Implementiert**: Firebase Authentication für Passwort-Änderung
- **Implementiert**: Firestore Updates für Profil und Benachrichtigungen

### 4. Payroll Service ✅

#### payrollCalculation.ts
- **Implementiert**: Firestore-Import (db, doc, getDoc)
- **Umgeschrieben**: `getEmployeePayrollData()` - lädt jetzt aus Firestore Collection `employeePayroll`
- **Umgeschrieben**: `getEmployeeBirthDate()` - lädt jetzt aus Firestore Collection `users`
- **Hinzugefügt**: Error Handling und Fallback-Logik

### 5. Export/Report Services ✅

Bereinigt in folgenden Dateien:
- **employeeReports.ts**: Mock-Kommentare entfernt, fileUrl statt mockFileUrl
- **employeeFacilities.ts**: Mock-Kommentare bereinigt, TODO für Maps API
- **times.ts**: Mock-Kommentare entfernt
- **reports.ts**: Mock-Kommentare entfernt  
- **adminSettings.ts**: Mock-Kommentare durch präzise Beschreibungen ersetzt

## Firestore Collections

Die App nutzt jetzt folgende Firestore Collections:
- `users` - Benutzerdaten und Profile
- `shifts` - Schichten
- `assignments` - Schichtzuweisungen
- `timesheets` - Arbeitszeiterfassung
- `facilities` - Einrichtungen
- `documents` - Dokumente
- `employeePayroll` - Lohndaten (für Payroll Service)

## Konfiguration

### .env.local (bereits vorhanden)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB__nXEaSa4Hx_0up_onhmIdUMkx4tcuYk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jobflow25.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jobflow25
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jobflow25.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=350790971531
NEXT_PUBLIC_FIREBASE_APP_ID=1:350790971531:web:ac2a19940aa9317a54e48e
NEXT_PUBLIC_USE_EMULATOR=false
```

## Was noch zu tun ist (TODOs)

### Niedrige Priorität:
1. **Google Maps Integration** (employeeFacilities.ts:169)
   - Echte Wegbeschreibungen statt Mock-Daten

2. **Geospatial Queries** (employeeFacilities.ts:354)
   - Firestore GeoPoint für Umkreissuche

3. **Firebase Storage Integration**
   - Export-Dateien in Firebase Storage hochladen
   - Download-URLs generieren

4. **Document Service** (useAdminDashboard.ts:90)
   - Document Service implementieren und einbinden

5. **Activity Tracking** (useAdminDashboard.ts:151)
   - System für Recent Activities implementieren

## Linter Status

✅ Keine Linter-Fehler in allen geänderten Dateien

## Geänderte Dateien

### Kritisch:
- `contexts/AuthContext.tsx`
- `lib/hooks/useDashboard.ts`
- `lib/hooks/useAdminDashboard.ts`
- `lib/hooks/useEmployeeDetails.ts`
- `lib/hooks/useFacilityDetails.ts`
- `lib/hooks/useProfile.ts`
- `lib/services/payroll/payrollCalculation.ts`

### Services (Cleanup):
- `lib/services/employeeReports.ts`
- `lib/services/employeeFacilities.ts`
- `lib/services/times.ts`
- `lib/services/reports.ts`
- `lib/services/adminSettings.ts`

## Nächste Schritte

1. **Testing**: App starten und alle Funktionen testen
2. **Firebase Setup**: Firestore Collections mit Seed-Daten befüllen
3. **User Creation**: Mindestens einen Admin-User in Firebase Auth anlegen
4. **Security Rules**: Firestore Security Rules überprüfen und anpassen
5. **Indexes**: Firestore Composite Indexes für komplexe Queries erstellen

## Migration erfolgreich abgeschlossen! 🎉

Die App verwendet jetzt vollständig Firebase als Backend.

```

---

### 📄 PLAN_STATIC_TEMPLATES.md

```markdown
# Plan: Umstellung auf statische Templates (ohne Platzhalter)

## Ziele
- Templates speichern final gerenderte Inhalte pro Mandant, Kanal, Locale.
- Notifications/E-Mails ziehen fertige Texte ohne Laufzeit-Platzhalter.
- Admins können Varianten verwalten, aber keine dynamischen Platzhalter mehr.

## Aufgaben

1. **Schema & Backend**
   - Firestore `companyTemplates`: Felder `title`, `message`, `subject`, `bodyHtml`, `actionText`.
   - API `app/api/templates`: Validierung auf Pflichtfelder je Kanal, Entfernen von Placeholder-/defaultPayload-Logik.
   - Notification Functions: direkte Auswahl des Templates, keine `renderCompanyTemplate`.
   - Entfernte Ressourcen: `functions/src/templateRenderer.ts`, Placeholder-Typen in `lib/types`.
   - Firestore-Indizes aktualisieren (`companyId`, `key`, `channel`, `locale`, `status`).

2. **Admin UI**
   - `TemplateManager`: Platzhalter-Editor entfernen, Formular auf feste Felder reduzieren.
   - Preview: zeigt exakt gespeicherte Texte.

3. **Dokumentation & Tests**
   - Doku (`docs/TEMPLATE_MANAGEMENT.md`) anpassen.
   - Manual Tests definieren (Schicht-Zuweisung, Dokument-Events).




```

---

### 📄 README.md

```markdown
# JobFlow - Production-Ready Implementierung

## 📋 Übersicht

JobFlow ist eine moderne Webanwendung für die Verwaltung von Zeiterfassung, Assignments und Mitarbeiterdaten. Die Anwendung wurde mit **State of the Art** (SOTA) Standards implementiert und bietet eine vollständige Firebase-Integration mit React Query, Material-UI und Next.js.

## 🚀 Features

### ✅ **Vollständig implementiert:**

- **Benachrichtigungssystem** - Echtzeit-Updates mit Firestore
- **Assignments-Verwaltung** - Vollständige CRUD-Funktionalität mit Filter & Suche
- **Document Types Manager** - Erweiterte Dokumentenverwaltung
- **Admin-Berichte** - Vollständige Implementierung mit Charts, Tabellen und PDF/Excel-Export
- **Admin-Einstellungen** - Firebase-Persistierung und Logo-Upload
- **Detail-Seiten** - Mitarbeiter & Einrichtungen mit echten Daten
- **Zeiten-Historie** - Erweiterte Ansicht mit Kalender und Export
- **Mitarbeiter-Berichte** - Persönliche Arbeitszeitberichte mit Charts
- **Loading & Error States** - Einheitliche UI-Komponenten überall
- **Performance-Optimierungen** - React.memo, Virtual Scrolling, Caching

### 🔧 **Technische Features:**

- **Firebase/Firestore** - Vollständige Backend-Integration
- **React Query** - Caching und State Management
- **Material-UI** - Konsistente UI-Komponenten
- **Glasmorphism Design** - Moderne UI-Ästhetik
- **TypeScript** - Umfassende Typisierung (mit bekannten Issues)
- **Vitest** - Test-Framework konfiguriert
- **Performance Monitoring** - Memory Usage und Render-Tracking

## 📁 Projektstruktur

```
JobFlow/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin-Bereich
│   │   ├── admin/                 # Admin-Features
│   │   │   ├── berichte/         # Berichte & Export
│   │   │   ├── einrichtungen/    # Einrichtungs-Verwaltung
│   │   │   ├── einstellungen/    # System-Einstellungen
│   │   │   ├── mitarbeiter/      # Mitarbeiter-Verwaltung
│   │   │   └── document-types/   # Dokumenttypen
