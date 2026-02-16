# 🎯 **JobFlow Cursor Rules - Optimiert & Umnummeriert**

## **📋 Regel-Struktur (Logisch nummeriert 00-08)**

### **🚀 Always Applied (Immer aktiv)**

- **`00-project.mdc`** - Projekt-Kontext, Tech-Stack, Ziele
- **`01-design-system.mdc`** - Design-Standards, MUI 5, Glasmorphism
- **`02-frontend.mdc`** - React/MUI, Performance, Error-Handling, Testing
- **`05-prompt-optimization.mdc`** - Prompt-Optimierung, Tool-Einsatz
- **`08-worktree-coordination.mdc`** - Worktree-Koordination, Multi-Agenten-Aufgabenverteilung

### **⚡ Auto-Attached (Bei relevanten Dateien)**

- **`03-services.mdc`** - Firebase, Auth, Storage, Backend-Integration

### **🔒 On-Demand (Bei Bedarf aktivieren)**

- **`04-security.mdc`** - DSGVO, Firestore Rules, Rollen-Management
- **`06-testing.mdc`** - Testing-Strategien, CI/CD (nur bei Test-Implementierung)

### **📝 Dokumentation**

- **`07-todo-implementation.mdc`** - Projekt-Status, To-Do Liste
- **`README.md`** - Diese Übersicht

## **✅ Was wurde optimiert?**

### **Eliminiert (Redundant/Überflüssig):**

- ❌ `01-style-ux-desktop-first.mdc` → Identisch mit design-system.mdc
- ❌ `02-theme-enforcement.mdc` → Redundant mit design-system.mdc
- ❌ `05-error-handling.mdc` → In frontend.mdc integriert
- ❌ `06-performance.mdc` → In frontend.mdc integriert
- ❌ `08-docs-ci.mdc` → Nur bei CI/CD-Arbeit relevant

### **Hinzugefügt & Umnummeriert:**

- ✅ `05-prompt-optimization.mdc` → Wieder hinzugefügt für bessere AI-Interaktion
- ✅ `08-worktree-coordination.mdc` → Neu hinzugefügt für Multi-Agenten-Koordination
- 🔄 `07-testing.mdc` → Von 07 auf 06 umnummeriert
- 🔄 `09-todo-implementation.mdc` → Von 09 auf 07 umnummeriert

### **Konsolidiert:**

- 🔄 Performance + Error-Handling → `02-frontend.mdc`
- 🔄 Testing-Grundlagen → `02-frontend.mdc`

## **🎯 Ergebnis:**

- **Vorher:** 13 Rules, 18.5KB, unlogische Nummerierung
- **Nachher:** 9 Rules, ~15KB, logische Struktur 00-08
- **Effizienz:** +31% weniger Rules, -19% Dateigröße, verbesserte Prompt-Qualität

## **🚀 Verwendung:**

1. **Neue Features:** Rules 00-02, 05, 08 sind automatisch aktiv
2. **Backend-Integration:** Rule 03 wird bei Service-Dateien automatisch angehängt
3. **Security-Fragen:** Rule 04 bei Bedarf aktivieren
4. **Testing:** Rule 06 nur bei Test-Implementierung
5. **Todo-Tracking:** Rule 07 für Projekt-Status
6. **Worktree-Nutzung:** Rule 08 koordiniert automatisch Multi-Agenten-Aufgabenverteilung

---

_Optimiert & Umnummeriert am: $(date)_
_Regel-Anzahl: 9 (vorher 13)_
_Nummerierung: Logisch 00-08_
_Dateigröße: ~15KB (vorher 18.5KB)_
