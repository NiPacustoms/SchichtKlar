# JobFlow – Dokumentation Teil 137

*Zeichen 2702153–2722011 von 2862906*

---

## 📋 Übersicht aller möglichen Varianten

### 1. **Layout-Kontexte** (Wo wird die Glocke angezeigt?)

#### ✅ Aktuell implementiert:
- **GlobalHeader** (in AppLayout)
  - Wird in Admin-Layout verwendet (`hideHeader={false}`)
  - Wird in Employee-Layout verwendet (`hideHeader={false}`)
  - Wird in ConditionalHeader verwendet (für öffentliche Routen)

#### ⚠️ Potenzielle Probleme:
- **ConditionalHeader**: Wird nur für bestimmte Routen gerendert (nicht `/admin`, `/employee`)
- **Root Layout**: Kein Header, daher keine Glocke
- **Auth Layout**: Kein Header während Login/Register

#### 🔄 Empfohlene Varianten:
1. **Immer sichtbar** (wenn User eingeloggt)
   - GlobalHeader in allen Layouts
   - ConditionalHeader für öffentliche Seiten
   
2. **Nur in App-Bereichen**
   - Admin/Employee Layouts
   - Nicht auf Login/Register

3. **Zusätzlich in BottomNav** (Mobile)
   - Als separater Tab für schnellen Zugriff
   - Badge auf Tab-Icon

---

### 2. **User-Rollen & Notification-Services**

#### ✅ Aktuell implementiert:
- **Nurse (Employee)**: `useEmployeeNotifications`
- **Admin/Dispatcher**: `useNotifications`

#### ⚠️ Unterschiede zwischen Services:

**Employee Notifications:**
- Types: `'info' | 'warning' | 'error' | 'success' | 'shift' | 'vacation' | 'sick' | 'message' | 'email' | 'sms'`
- Priority: `'low' | 'medium' | 'high'`
- Features: `starred`, `archived`
- Settings: Quiet Hours, Email Frequency

**Admin Notifications:**
- Types: `'info' | 'warning' | 'error' | 'success' | 'schedule' | 'email' | 'phone' | 'message'`
- Priority: Nicht vorhanden
- Features: `important` Flag
- Settings: Channel-basiert (app/email/sms)

#### 🔄 Empfohlene Varianten:
1. **Einheitliche Darstellung** mit Rollen-spezifischen Features
2. **Type-Icons** basierend auf Notification-Type
3. **Priority-Badges** für Employee (high/medium/low)
4. **Important-Badge** für Admin

---

### 3. **Zustände & Edge Cases**

#### ✅ Aktuell implementiert:
- ✅ Kein User → `return null`
- ✅ Loading → CircularProgress
- ✅ Leer → Empty State
- ✅ Ungelesene Count → Badge

#### ⚠️ Fehlende Varianten:

**A. Error-Zustand:**
```tsx
// Wenn Hook einen Error wirft
if (error) {
  return (
    <IconButton disabled>
      <ErrorIcon />
    </IconButton>
  );
}
```

**B. Offline-Zustand:**
```tsx
// Wenn User offline ist
const isOnline = useOnlineStatus();
if (!isOnline) {
  // Zeige Offline-Indikator
}
```

**C. Viele Benachrichtigungen (99+):**
```tsx
// Aktuell: max={99}, zeigt "99+"
// Besser: Zeige tatsächliche Anzahl im Tooltip
```

**D. SSR/Hydration:**
```tsx
// Aktuell: Keine SSR-Behandlung
// Problem: Badge könnte falsch angezeigt werden
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <IconButton disabled><NotificationsIcon /></IconButton>;
```

**E. Feature Flags:**
```tsx
// Wenn Feature deaktiviert ist
const { canAccessEmployeeNotifications } = useFeatureFlags();
if (!canAccessEmployeeNotifications && isEmployee) {
  return null;
}
```

---

### 4. **Mobile vs. Desktop**

#### ✅ Aktuell:
- Gleiche Darstellung für alle Breakpoints
- Menu öffnet sich rechts oben

#### 🔄 Empfohlene Varianten:

**A. Mobile (< 600px):**
- Menu: Full-width Drawer von rechts
- Badge: Größer, besser sichtbar
- Touch-optimiert: Größere Hit-Area

**B. Desktop (> 1280px):**
- Menu: Dropdown rechts oben (aktuell)
- Hover-Effekte
- Keyboard-Navigation

**C. Tablet (600px - 1280px):**
- Hybrid: Drawer oder Dropdown je nach Platz

---

### 5. **Notification-Typen & Visualisierung**

#### ⚠️ Aktuell: Nur generischer Punkt-Indikator

#### 🔄 Empfohlene Varianten:

**A. Type-Icons:**
```tsx
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'shift': return <Work />;
    case 'vacation': return <Event />;
    case 'sick': return <Sick />;
    case 'error': return <Error />;
    case 'warning': return <Warning />;
    case 'success': return <CheckCircle />;
    case 'message': return <Message />;
    default: return <Info />;
  }
};
```

**B. Priority-Badges:**
```tsx
// Für Employee Notifications
{notification.priority === 'high' && (
  <Chip size="small" color="error" label="Wichtig" />
)}
```

**C. Color-Coding:**
```tsx
const getTypeColor = (type: string) => {
  switch (type) {
    case 'error': return 'error.main';
    case 'warning': return 'warning.main';
    case 'success': return 'success.main';
    case 'shift': return 'primary.main';
    default: return 'text.secondary';
  }
};
```

---

### 6. **Interaktionen & Aktionen**

#### ✅ Aktuell implementiert:
- ✅ Klick öffnet Menu
- ✅ Klick auf Notification → markiert als gelesen + Navigation
- ✅ "Alle als gelesen" Button
- ✅ "Alle anzeigen" Link

#### ⚠️ Fehlende Varianten:

**A. Quick Actions:**
```tsx
// Direkt im Menu-Item
<MenuItem>
  <ListItemText primary={notification.title} />
  <IconButton onClick={(e) => {
    e.stopPropagation();
    handleStar(notification.id);
  }}>
    <Star />
  </IconButton>
</MenuItem>
```

**B. Batch-Actions:**
```tsx
// Mehrere auswählen und gemeinsam markieren/löschen
const [selected, setSelected] = useState<string[]>([]);
```

**C. Keyboard-Shortcuts:**
```tsx
// 'N' öffnet Notifications
// 'Escape' schließt Menu
// Arrow Keys navigieren
```

**D. Swipe-Actions (Mobile):**
```tsx
// Swipe links: Als gelesen markieren
// Swipe rechts: Löschen
```

---

### 7. **Performance & Real-time**

#### ⚠️ Aktuell: Nur Polling via React Query

#### 🔄 Empfohlene Varianten:

**A. Real-time Updates:**
```tsx
// Firestore onSnapshot für Live-Updates
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'notifications'), ...),
    (snapshot) => {
      // Update notifications
    }
  );
  return unsubscribe;
}, [userId]);
```

**B. Optimistic Updates:**
```tsx
// Sofort UI updaten, dann Server-Sync
const markAsReadOptimistic = (id: string) => {
  setNotifications(prev => 
    prev.map(n => n.id === id ? {...n, read: true} : n)
  );
  markAsRead(id); // Server-Call
};
```

**C. Virtualisierung:**
```tsx
// Für viele Notifications (> 50)
import { FixedSizeList } from 'react-window';
```

**D. Debouncing:**
```tsx
// Verhindere zu häufige Updates
const debouncedRefetch = useMemo(
  () => debounce(() => refetch(), 500),
  [refetch]
);
```

---

### 8. **Accessibility (A11y)**

#### ✅ Aktuell:
- ✅ `aria-label="Benachrichtigungen"`
- ✅ `aria-controls`, `aria-haspopup`, `aria-expanded`

#### ⚠️ Fehlende Varianten:

**A. Screen Reader Announcements:**
```tsx
// Wenn neue Notification kommt
useEffect(() => {
  if (unreadCount > prevUnreadCount) {
    announce(`Neue Benachrichtigung: ${latestNotification.title}`);
  }
}, [unreadCount]);
```

**B. Keyboard Navigation:**
```tsx
// Tab-Navigation durch Menu-Items
// Enter/Space zum Öffnen
// Escape zum Schließen
```

**C. Focus Management:**
```tsx
// Focus zurück zum Button nach Schließen
const handleClose = () => {
  setAnchorEl(null);
  buttonRef.current?.focus();
};
```

**D. High Contrast Mode:**
```tsx
// Bessere Kontraste für Accessibility
sx={{
  '@media (prefers-contrast: high)': {
    border: '2px solid',
  }
}}
```

---

### 9. **Routen & Navigation**

#### ⚠️ Aktuell:
- Employee: `/employee/benachrichtigungen` ✅
- Admin: `/admin/einstellungen` ⚠️ (keine dedizierte Seite)

#### 🔄 Empfohlene Varianten:

**A. Admin Benachrichtigungsseite:**
```tsx
// Erstelle: /admin/benachrichtigungen
const notificationsPath = isEmployee 
  ? '/employee/benachrichtigungen'
  : '/admin/benachrichtigungen';
```

**B. Deep Linking:**
```tsx
// Direkt zu spezifischer Notification
router.push(`/employee/benachrichtigungen?id=${notificationId}`);
```

**C. Breadcrumb-Integration:**
```tsx
// Wenn von NotificationBell navigiert, zeige Breadcrumb
```

---

### 10. **Edge Cases & Sonderfälle**

#### ⚠️ Fehlende Varianten:

**A. Sehr lange Notification-Texte:**
```tsx
// Aktuell: WebkitLineClamp: 2
// Problem: Könnte abgeschnitten werden
// Lösung: Tooltip mit vollständigem Text
<Tooltip title={notification.message}>
  <Typography>...</Typography>
</Tooltip>
```

**B. Viele gleichzeitige Notifications:**
```tsx
// Rate Limiting: Max 10 neue pro Minute
// Grouping: Ähnliche Notifications gruppieren
```

**C. Notification-Settings deaktiviert:**
```tsx
// Wenn User Benachrichtigungen deaktiviert hat
if (!settings.emailNotifications && !settings.pushNotifications) {
  // Zeige Hinweis oder verstecke Glocke
}
```

**D. Company-Isolation:**
```tsx
// Multi-Tenant: Nur Notifications der eigenen Company
// Aktuell: Wird in Service gehandhabt, aber nicht in UI sichtbar
```

**E. Expired Notifications:**
```tsx
// Alte Notifications (> 30 Tage) automatisch archivieren
const isExpired = (createdAt: Date) => {
  const daysDiff = differenceInDays(new Date(), createdAt);
  return daysDiff > 30;
};
```

---

## 🎯 Priorisierte Verbesserungsvorschläge

### 🔴 Hoch (Kritisch):
1. **SSR/Hydration Fix** - Verhindere Hydration-Mismatch
2. **Error Handling** - Zeige Error-State wenn Hook fehlschlägt
3. **Admin Benachrichtigungsseite** - Dedizierte Route statt Einstellungen
4. **Type-Icons** - Visuelle Unterscheidung der Notification-Types

### 🟡 Mittel (Wichtig):
5. **Mobile Optimierung** - Drawer statt Dropdown auf Mobile
6. **Real-time Updates** - Firestore onSnapshot für Live-Updates
7. **Priority-Badges** - Für Employee Notifications
8. **Keyboard Navigation** - Vollständige Keyboard-Unterstützung

### 🟢 Niedrig (Nice-to-have):
9. **Swipe Actions** - Mobile Gestures
10. **Batch Actions** - Mehrere auswählen
11. **Virtualisierung** - Für > 50 Notifications
12. **Offline-Modus** - Offline-Indikator

---

## 📝 Implementierungs-Checkliste

- [ ] SSR/Hydration Fix
- [ ] Error-State Handling
- [ ] Admin Benachrichtigungsseite erstellen
- [ ] Type-Icons implementieren
- [ ] Mobile Drawer-Variante
- [ ] Real-time Updates
- [ ] Priority-Badges
- [ ] Keyboard Navigation
- [ ] Feature Flag Check
- [ ] Offline-Indikator
- [ ] Tooltips für lange Texte
- [ ] Screen Reader Announcements
- [ ] Focus Management
- [ ] High Contrast Support




---

## Quelle: docs/NOTIFICATION_COVERAGE_ANALYSIS.md

# 🔔 NotificationBell - Abdeckungs-Analyse

## ❌ KRITISCHES PROBLEM: Unvollständige Abdeckung

Die NotificationBell deckt **NICHT alle Benachrichtigungen** ab!

---

## 📊 Benachrichtigungs-Quellen & Collections

### 1. **Collections in der App:**

#### A. `notifications` Collection
- **Service:** `notificationService` (lib/services/notifications.ts)
- **Hook:** `useNotifications()` (für Admin/Dispatcher)
- **Wird verwendet von:** NotificationBell für Admin/Dispatcher

#### B. `employeeNotifications` Collection  
- **Service:** `employeeNotificationsService` (lib/services/employeeNotifications.ts)
- **Hook:** `useEmployeeNotifications()` (für Employees/Nurses)
- **Wird verwendet von:** NotificationBell für Employees

---

## 🔍 Benachrichtigungs-Quellen in Firebase Functions

### ✅ **Werden in `notifications` gespeichert (Admin/Dispatcher):**

1. **notificationTriggers.ts:**
   - ✅ `shift_assigned` → `notifications` Collection
   - ✅ `assignment_confirmed` → `notifications` Collection
   - ✅ `assignment_rejected` → `notifications` Collection
   - ✅ `document_verified` → `notifications` Collection
   - ✅ `document_rejected` → `notifications` Collection
   - ✅ `document_expiry_warning` → `notifications` Collection
   - ✅ `new_message` → `notifications` Collection
   - ✅ `shift_requested_admin` → `notifications` Collection
   - ✅ `assignment_accepted_admin` → `notifications` Collection
   - ✅ `shift_full_admin` → `notifications` Collection

2. **shiftNotifications.ts:**
   - ✅ Neue Schichten erstellt → `notifications` Collection
   - ✅ Schichten aktualisiert → `notifications` Collection
   - ⚠️ **PROBLEM:** Diese werden für **ALLE** User (auch Employees) in `notifications` gespeichert!

3. **assignShift.ts, unassignShift.ts, declineAssignment.ts, requestShift.ts:**
   - ✅ Schicht-Zuweisungen → `notifications` Collection

4. **documentExpiryCheck.ts:**
   - ✅ Dokument-Ablauf-Warnungen → `notifications` Collection

5. **timesheetValidation.ts:**
   - ✅ Zeiterfassungs-Validierungen → `notifications` Collection

### ⚠️ **Chat-System entfernt:**
- Chat wurde aus der UI entfernt (siehe CHANGELOG.md)
- Chat-Functions existieren noch im Code, sind aber nicht mehr aktiv
- **→ Keine Chat-Notifications mehr relevant**

---

## 🚨 **KRITISCHE PROBLEME:**

### Problem 1: **Schicht-Benachrichtigungen für Employees**

**Was passiert:**
- `shiftNotifications.ts` speichert Schicht-Benachrichtigungen in `notifications` Collection
- Diese werden für **ALLE** User erstellt (auch Employees/Nurses)
- Aber: NotificationBell für Employees verwendet `useEmployeeNotifications()`
- `useEmployeeNotifications()` liest nur aus `employeeNotifications` Collection
- **→ Employees sehen Schicht-Benachrichtigungen NICHT in der Glocke!**

**Betroffene Funktionen:**
- Neue Schichten verfügbar
- Schicht-Updates
- Schicht-Änderungen

### Problem 2: **Zwei parallele Notification-Systeme**

**Was passiert:**
- Admin/Dispatcher: `notifications` Collection
- Employees: `employeeNotifications` Collection
- Firebase Functions schreiben teilweise in `notifications` (auch für Employees!)
- **→ Inkonsistenz: Manche Notifications für Employees sind in der falschen Collection**

---

## 📋 **Vollständige Liste aller Notification-Typen:**

### ✅ **Werden von Glocke abgedeckt:**

#### Admin/Dispatcher (`notifications` Collection):
1. ✅ Shift Assigned
2. ✅ Assignment Confirmed
3. ✅ Assignment Rejected
4. ✅ Document Verified
5. ✅ Document Rejected
6. ✅ Document Expiry Warning
7. ✅ New Message (altes System)
8. ✅ Shift Requested (Admin)
9. ✅ Assignment Accepted (Admin)
10. ✅ Shift Full (Admin)
11. ✅ New Shift Created
12. ✅ Shift Updated
13. ✅ Timesheet Validation

#### Employee (`employeeNotifications` Collection):
1. ✅ Manuell erstellte Employee-Notifications
2. ❌ **FEHLT:** Schicht-Benachrichtigungen (werden in `notifications` gespeichert!)

### ❌ **Werden NICHT von Glocke abgedeckt:**

1. ❌ **Schicht-Benachrichtigungen für Employees** (falsche Collection) - **KRITISCH!**
2. ❌ **Real-time Updates** (optional, aber empfohlen)

---

## 🔧 **LÖSUNGSVORSCHLÄGE:**

### Lösung 1: **Schicht-Notifications für Employees in richtige Collection** (KRITISCH!)

**In `shiftNotifications.ts`:**

```typescript
// Prüfe User-Rolle und speichere in richtige Collection
const userDoc = await db.collection('users').doc(userId).get();
const userRole = userDoc.data()?.role;

if (userRole === 'nurse') {
  // Speichere in employeeNotifications
  await db.collection('employeeNotifications').add({...});
} else {
  // Speichere in notifications
  await db.collection('notifications').add({...});
}
```

### Lösung 2: **Unified Notification Service** (Sofort-Fix für NotificationBell)

**Erstelle einen Service, der beide Collections liest:**

```typescript
// In NotificationBell
const adminNotifications = useNotifications();
const employeeNotifications = useEmployeeNotifications();

// Kombiniere beide für Employees
const allNotifications = isEmployee 
  ? [
      ...employeeNotifications.notifications,
      ...adminNotifications.notifications.filter(n => n.userId === user?.id)
    ]
  : adminNotifications.notifications;
```


---

## ✅ **EMPFEHLUNG: Sofortige Fixes**

### Priorität 1 (Kritisch - SOFORT beheben):
1. ✅ **Schicht-Notifications für Employees in richtige Collection** (Firebase Functions)
2. ✅ **NotificationBell erweitern: Beide Collections für Employees lesen** (Sofort-Fix)

### Priorität 2 (Wichtig):
3. ✅ **Real-time Updates für beide Collections**
4. ✅ **Notification-Deduplizierung** (falls beide Collections gelesen werden)

---

## 📝 **Checkliste für vollständige Abdeckung:**

- [ ] **Schicht-Notifications für Employees in `employeeNotifications`** (Firebase Functions)
- [ ] **NotificationBell liest beide Collections für Employees** (Sofort-Fix)
- [ ] Alle Notification-Typen werden getestet
- [ ] Real-time Updates funktionieren für beide Collections
- [ ] Notification-Deduplizierung implementiert (falls beide Collections gelesen werden)




---

## Quelle: docs/PAYROLL_API_KONFIGURATION.md

# Payroll - Betrieb ohne externe APIs

## Übersicht

Die JobFlow-Lohnabrechnung funktioniert **vollständig ohne externe APIs** und verwendet BMF-konforme Berechnungsformeln nach PAP 2025.

✅ **Keine BMF-API erforderlich** - Die Lohnsteuerberechnung verwendet die offiziellen BMF-Formeln direkt  
✅ **Keine ELSTER-API erforderlich** - Steuerdaten werden manuell gepflegt  
✅ **Vollständig rechtskonform** - Alle gesetzlichen Vorgaben werden eingehalten  
✅ **Keine Abhängigkeiten** - Funktioniert komplett offline

## Betrieb ohne APIs (Standard)

✅ **Die App funktioniert vollständig ohne APIs!**

### Manuelle Steuerdaten-Pflege

Die Steuerdaten werden manuell in den Employee-Daten (Firestore `users` Collection) gepflegt:

- **taxClass** (1-6): Lohnsteuerklasse
- **childAllowance** (number): Anzahl Kinder
- **churchTax** (boolean): Kirchensteuerpflichtig
- **state** (string): Bundesland (für Kirchensteuer: 'BW', 'BY', etc.)

### BMF-konforme Berechnung

Die Lohnsteuerberechnung verwendet die offiziellen BMF-Formeln nach Programmablaufplan (PAP) 2025:
- ✅ Implementiert in `lib/services/payroll/taxCalculation.ts`
- ✅ Rechtskonform ohne externe API
- ✅ Verwendet offizielle BMF-Formeln

### Vorteile ohne API

- ✅ Keine Registrierung erforderlich
- ✅ Keine API-Kosten
- ✅ Keine Abhängigkeit von externen Services
- ✅ Volle Kontrolle über die Daten
- ✅ Funktioniert offline

## Steuerdaten-Pflege

Die Steuerdaten werden manuell in der UI gepflegt:

**Pfad:** `/admin/mitarbeiter/[uid]/gehalt` → Schritt 3: Steuerdaten

**Pflegbare Felder:**
- **Steuer-ID**: 11-stellige Steuer-ID des Mitarbeiters
- **Steuerklasse**: 1-6 (Dropdown-Auswahl)
- **Kinderfreibetrag**: Anzahl Kinder (Zahl)
- **Kirchensteuer**: Ja/Nein (Switch)

Diese Daten werden direkt für die BMF-konforme Lohnsteuerberechnung verwendet.

## Technische Details

### Lohnsteuerberechnung

Die Lohnsteuerberechnung verwendet die offiziellen BMF-Formeln nach Programmablaufplan (PAP) 2025:
- Implementiert in: `lib/services/payroll/taxCalculation.ts`
- Verwendet offizielle BMF-Formeln
- Rechtskonform ohne externe API
- Berechnet: Lohnsteuer, Solidaritätszuschlag, Kirchensteuer

### Datenfluss

1. **Steuerdaten eingeben** → UI: `/admin/mitarbeiter/[uid]/gehalt`
2. **Daten speichern** → Firestore `users` Collection
3. **Lohnabrechnung berechnen** → Verwendet gespeicherte Steuerdaten
4. **BMF-konforme Berechnung** → Nach PAP 2025 Formeln

---

## Historische API-Information (Nicht mehr verwendet)

> **Hinweis:** Die folgenden Abschnitte beschreiben APIs, die nicht mehr verwendet werden.
> Die App funktioniert vollständig ohne externe APIs.

## ELStAM-API (ELSTER) - Nicht mehr verwendet

### Registrierung

Für die produktive Nutzung der ELStAM-API ist eine Registrierung bei ELSTER erforderlich:

1. **Registrierung bei ELSTER**
   - Website: https://www.elster.de
   - Registrierung als Unternehmen/Steuerberater
   - Beantragung des API-Zugangs für ELStAM

2. **API-Key erhalten**
   - Nach erfolgreicher Registrierung erhalten Sie einen API-Key
   - Dieser wird in den Umgebungsvariablen konfiguriert

### Konfiguration

Fügen Sie folgende Umgebungsvariablen zu Ihrer `.env.local` oder `.env` Datei hinzu:

```bash
# ELStAM-API (ELSTER)
ELSTAM_API_KEY=ihr-api-key-hier
NEXT_PUBLIC_ELSTAM_API_URL=https://www.elster.de/elstam/api/v1

# Mock-Modus (für Entwicklung ohne API-Key)
# NEXT_PUBLIC_ELSTAM_USE_MOCK=true
```

### Verwendung

Die ELStAM-API wird automatisch vor jeder Lohnabrechnung aufgerufen, wenn:
- Ein API-Key konfiguriert ist
- Der Mock-Modus nicht aktiviert ist
- Der Mitarbeiter eine gültige Steuer-ID hat

**Fallback-Verhalten:**
- Wenn kein API-Key vorhanden ist → Mock-Daten werden verwendet
- Bei API-Fehlern → Fallback auf Mock-Daten mit Warnung

