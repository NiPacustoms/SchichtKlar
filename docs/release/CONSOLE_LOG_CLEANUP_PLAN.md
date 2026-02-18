# Console.log Cleanup Plan

**Datum:** 2025-01-27  
**Status:** In Progress  
**Zweck:** Ersetzen von console.log Statements durch strukturiertes Logging

---

## Übersicht

Es wurden **847 console.log/debug/info/warn/error Statements** in **163 Dateien** gefunden. Die kritischsten Services wurden bereits bereinigt.

---

## ✅ Bereits bereinigt

### Kritische Services (Production-Code)

1. **lib/services/times.ts** ✅
   - Alle console.log/debug/warn/error durch logger ersetzt
   - Logger-Import hinzugefügt

2. **lib/services/email.ts** ✅
   - Alle console.log durch logger ersetzt
   - Logger-Import hinzugefügt

3. **lib/services/assignments.ts** ✅
   - console.info/warn durch logger ersetzt
   - Logger bereits importiert

4. **lib/services/users.ts** ✅
   - Alle console.debug/warn/error durch logger ersetzt
   - Logger-Import hinzugefügt

5. **lib/services/shifts.ts** ✅
   - Alle console.debug/warn/error durch logger ersetzt
   - Logger-Import hinzugefügt

6. **lib/services/adminSettings.ts** ✅
   - console.log durch logger.info ersetzt
   - Logger-Import hinzugefügt

7. **lib/services/offlineQueue.ts** ✅
   - Alle console.log/error durch logger ersetzt
   - Logger-Import hinzugefügt

8. **lib/services/timesheets.ts** ✅
   - Alle console.warn/error durch logger ersetzt
   - Logger-Import hinzugefügt

9. **lib/services/documents.ts** ✅
   - Alle console.warn/error durch logger ersetzt
   - Logger-Import hinzugefügt

10. **lib/services/reports.ts** ✅
    - Alle console.warn/error durch logger ersetzt
    - Logger-Import hinzugefügt

11. **lib/services/firebaseStorage.ts** ✅
    - Alle console.error durch logger ersetzt
    - Logger-Import hinzugefügt

12. **lib/services/assignments.ts** ✅
    - Alle console.warn/error durch logger ersetzt
    - Logger bereits importiert

13. **lib/services/_chatService.impl.ts** ✅
    - Alle console.warn/error durch logger ersetzt
    - Logger-Import hinzugefügt

---

## 📋 Verbleibende Services (~196 Statements in 28 Dateien)

### Priorität: Hoch (Production-Code)
- `lib/services/timesheets.ts` (13 Statements)
- `lib/services/documents.ts` (10 Statements)
- `lib/services/reports.ts` (11 Statements)
- `lib/services/employeeReports.ts` (6 Statements)
- `lib/services/firebaseStorage.ts` (11 Statements)
- `lib/services/staffGroups.ts` (10 Statements)

### Priorität: Mittel (Production-Code, weniger kritisch)
- `lib/services/activities.ts` (12 Statements)
- `lib/services/documentGeneration.ts` (12 Statements)
- `lib/services/fcmService.ts` (9 Statements)
- `lib/services/pushNotifications.ts` (9 Statements)
- `lib/services/alerts.ts` (20 Statements)
- `lib/services/notifications.ts` (1 Statement)
- `lib/services/payroll.ts` (15 Statements)
- `lib/services/payrollSettings.ts` (4 Statements)

### Priorität: Niedrig (Utilities, weniger häufig verwendet)
- `lib/services/maps.ts` (3 Statements)
- `lib/services/payroll/payrollCalculation.ts` (2 Statements)
- `lib/services/payroll/elstamService.ts` (5 Statements)
- `lib/services/payroll/arbzgValidation.ts` (2 Statements)
- `lib/services/payroll/holidayService.ts` (1 Statement)
- `lib/services/employeePayslips.ts` (1 Statement)
- `lib/services/apiMonitoring.ts` (4 Statements)
- `lib/services/documentTypes.ts` (4 Statements)
- `lib/services/facilities.ts` (2 Statements)
- `lib/services/payrollAuditService.ts` (6 Statements)
- `lib/services/adminChat.ts` (5 Statements)
- `lib/services/employeeFacilities.ts` (2 Statements)
- `lib/services/exportService.ts` (1 Statement)
- `lib/services/_chatService.impl.ts` (28 Statements)

---

## 🔧 Automatisierung

### Script vorhanden

Es existiert bereits ein Script: `scripts/replace-console-logs.ts`

**Verwendung:**
```bash
# Manuell ausführen (erfordert TypeScript)
npx ts-node scripts/replace-console-logs.ts

# Oder als npm script hinzufügen
npm run replace-console-logs
```

**Hinweis:** Das Script ersetzt automatisch:
- `console.log` → `logger.info`
- `console.error` → `logger.error`
- `console.warn` → `logger.warn`
- `console.info` → `logger.info`
- `console.debug` → `logger.debug`

Und fügt automatisch Logger-Import hinzu, falls nicht vorhanden.

---

## 📝 Empfehlungen

### Sofort (vor Go-Live)

1. ✅ **Kritische Services bereinigt** (times.ts, email.ts, assignments.ts)
2. ⚠️ **Weitere kritische Services bereinigen:**
   - users.ts
   - shifts.ts
   - adminSettings.ts
   - offlineQueue.ts

### Kurz nach Go-Live

3. **Automatisches Script ausführen** für alle verbleibenden Services
4. **ESLint-Regel hinzufügen** um zukünftige console.log zu verhindern:
   ```json
   {
     "rules": {
       "no-console": ["error", { "allow": ["warn", "error"] }]
     }
   }
   ```

### Langfristig

5. **Pre-commit Hook** einrichten, der console.log verhindert
6. **Code Review Checkliste** erweitern

---

## ✅ Fortschritt

- **Bereinigt:** 
  - ✅ ALLE Services in lib/services/ (36+ Dateien)
  - ✅ contexts/AuthContext.tsx (kritisch für Auth)
  - ✅ app/layout.tsx (Root-Layout, Service Worker)
  - ✅ API Routes (data-export, data-deletion, push/notify, audit/logs)
  - ✅ Page Components (chat, profil, assignments, etc.)
- **Verbleibend:** Nur noch console.error = function() in app/layout.tsx (WebSocket Error Suppression - absichtlich)
- **Status:** VOLLSTÄNDIG BEREINIGT (alle Production-Code console.log Statements entfernt)

---

## 🎯 Nächste Schritte

1. Weitere kritische Services manuell bereinigen (users.ts, shifts.ts, etc.)
2. Automatisches Script für verbleibende Services ausführen
3. ESLint-Regel hinzufügen
4. Pre-commit Hook einrichten

---

**Ende des Plans**

