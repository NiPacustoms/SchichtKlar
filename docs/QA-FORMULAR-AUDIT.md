# JobFlow – Formular-QA-Audit (Principal QA Engineer L6)

**Datum:** 2025-02-18  
**Scope:** Alle Formulare in Komponenten/Admin, Zuweisung, Stundenzettel, Auth, Profil

---

## 1. Statistik

| Metrik | Wert |
|--------|------|
| `grep -r "form\|input\|button" src/ components/ app/` | **1095** Treffer |
| Formulare mit Zod-Validierung | TimesheetForm, ProfileForm, Login, NewAssignmentForm, Auth-Forms |
| Komponenten mit `data-testid` | Anmelden, GlobalHeader (logout), MessageInput, ProfileForm (erwartet, war fehlend) |

---

## 2. Formular-Prüfliste (pro Formular)

### 2.1 `components/time/TimesheetForm.tsx`

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Schaltfläche sichtbar + Hover + Klickbar | ✅ | Submit + "Jetzt"-Buttons nutzen MUI Button |
| Eingabefokus + Tippen + Clear | ✅ | TextField/Select mit fullWidth, nicht disabled (außer wenn `disabled` prop) |
| Absenden → Laden → Erfolg/Fehler → Reset | ✅ | `isLoading` → "Speichern...", Toast in Page |
| Validierung (Zod) → Inline-Fehler + Rahmen | ✅ | `errors.*`, `helperText`, `error={!!errors.*}` |
| Mobil: Touch-Ziele ≥ 44px | ⚠️ | MUI Default; "Jetzt" minWidth 70px – prüfen |
| Barrierefreiheit: Label + Aria | ✅ | Labels an TextField/Select, LinearProgress aria-label |
| Sonderfälle: Leer, Ungültig | ✅ | Zod + required Fields |

**Rote Flags:**

- ❌ **Submit-Button-Text:** Immer "Aktualisieren" – bei Neuanlage sollte "Speichern" stehen.  
  **FIX:** `{isEdit ? 'Aktualisieren' : 'Speichern'}` (und Loading: "Speichern..." / "Aktualisieren...").
- ❌ **Keine `data-testid`** für E2E: Submit-Button, optionale Keys für Datum/Start/Ende/Einrichtung.  
  **FIX:** `data-testid="timesheet-submit"` am Submit-Button.

---

### 2.2 Zeiterfassung Page `app/(employee)/employee/zeiterfassung/page.tsx`

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Pause-Button klickbar | ✅ | Klickbar, zeigt Toast "Pause wird in einer zukünftigen Version unterstützt" |
| Schicht beenden-Button | ✅ | Klickbar, `updateTimesheet.mutateAsync`, Loading via `disabled={updateTimesheet.isPending}` |
| Success/Error Feedback | ✅ | toast.success / toast.error |

**Rote Flags:**

- ❌ **Pause:** Kein echter Callback (nur Info-Toast). Kein `data-testid="pause-button"`.  
  **FIX:** `data-testid="pause-button"` setzen; fachlich: Pause später integrieren.
- ❌ **Schicht beenden:** Kein `data-testid="end-shift-button"`.  
  **FIX:** `data-testid="end-shift-button"` am "Schicht beenden"-Button.
- ⚠️ **Kein 1-Tap-Start:** Es gibt keinen einzelnen "Schicht starten"-Button; Start erfolgt über Formular-Ausfüllen + Absenden. E2E-Tests sollten das Formular-Submit als "Start" abdecken.

---

### 2.3 `components/ui/SignatureDialog.tsx`

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Name-Input fokussierbar, typbar | ✅ | TextField mit label, required/error/helperText |
| Canvas: Zeichen (Mouse + Touch) | ✅ | startDraw/draw/endDraw, touch handlers |
| Clear-Button | ✅ | "Zurücksetzen" |
| Speichern disabled ohne Strokes / ohne Name | ✅ | `disabled={!hasStrokes \|\| (requireName && !signerName?.trim())}` |
| Responsive | ✅ | `fullScreen={isMobile}`, `maxWidth="sm"` |

**Rote Flags:**

- ❌ Keine `data-testid` für E2E (z. B. `signature-canvas`, `signature-save`, `signature-clear`).  
  **FIX:** Optionale data-testids ergänzen.

---

### 2.4 `components/assignments/RelievingPersonnelSignatureDialog.tsx`

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Name-TextField + Rolle-Select | ✅ | Label, error/helperText, required |
| Signieren-Button disabled ohne Name | ✅ | `disabled={isSubmitting \|\| !signerName.trim()}` |
| Loading-State | ✅ | `isSubmitting`, Dialog "Lade Daten..." |

**Rote Flags:**

- ❌ Keine `data-testid` (z. B. `relieving-signature-submit`).  
  **FIX:** data-testids für Submit und ggf. Name-Feld.

---

### 2.5 `components/admin/DailySignatureDialog.tsx`

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Name, Leistungsstatus (Radio), Checkbox, Notiz | ✅ | Alle mit Label/FormLabel |
| Signieren disabled bis Status + Name + Bestätigung | ✅ | `!confirmReviewed \|\| !status \|\| !signerName.trim()` |

**Rote Flags:**

- ❌ Kein `data-testid` für "Signieren"-Button.  
  **FIX:** `data-testid="daily-signature-submit"` (oder einheitliches Schema).

---

### 2.6 `components/time/PauseDialog.tsx`

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Buttons 15/30/45/60/90/120 Min klickbar | ✅ | `onClick={() => handleAddPause(minutes)}` |
| Abbrechen | ✅ | onClose |

**Hinweis:** Wird auf der Zeiterfassungs-Seite aktuell **nicht** verwendet (Pause zeigt nur Toast).  
**Rote Flags:**

- ❌ Keine `data-testid` (z. B. `pause-15`, `pause-30`).  
  **FIX:** data-testids wenn Pause-Dialog später eingebunden wird.

---

### 2.7 `app/(auth)/anmelden/page.tsx`

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| E-Mail/Passwort-Inputs | ✅ | aria-label + data-testid (email-input, password-input) |
| Login-Button | ✅ | data-testid="login-button", isSubmitting |
| Zod-Validierung | ✅ | loginSchema, Inline-Fehler |

✅ **Keine roten Flags** für Klickbarkeit/Inputs; E2E nutzt bereits data-testids.

---

### 2.8 `components/profile/ProfileForm.tsx`

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Alle TextFields mit Label, error, helperText | ✅ | register + errors |
| Speichern/Abbrechen/Bearbeiten | ✅ | Loading "Speichern...", reset bei Abbrechen |
| Zod + IBAN-Validierung | ✅ | profileSchema, validateIBAN |

**Rote Flags:**

- ❌ **E2E erwartet `data-testid="profile-form-submit-button"`** – im Code **nicht** gesetzt.  
  **FIX:** Am Speichern-Button `data-testid="profile-form-submit-button"` ergänzen.

---

### 2.9 `components/admin/AdminKpiGrid.tsx` + `AdminKPICard.tsx`

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Karten klickbar | ✅ | `onClick={onKpiClick ? () => onKpiClick(kpi) : undefined}` |
| Keyboard + Aria | ✅ | AdminKPICard: `aria-label`, `role="button"`, `tabIndex={0}` bei onClick |

✅ Kein Formular; nur Klickziel. Optional: `data-testid="kpi-card-{kpi.id}"` für E2E.

---

### 2.10 `components/assignments/AssignmentStatusBadge.tsx`

| Kriterium | Status | Anmerkung |
|-----------|--------|-----------|
| Nur Anzeige (Chip) | ✅ | `aria-label={`Status: ${displayLabel}`}` |

✅ Keine Änderung nötig.

---

### 2.11 Weitere Formulare (kurz)

- **ShiftEditDialog / FacilityCreateDialog / AssignShiftDialog / NewAssignmentForm:** Alle mit MUI Inputs, Labels, Buttons; **keine data-testids** – bei Bedarf für Admin-E2E ergänzen.
- **VacationRequestForm, ExportReportDialog, TemplateManager:** Gleich bewertet; E2E-relevant bei Ausweitung der Tests.

---

## 3. E2E-Test-Skripte (Playwright) – Top-5 Workflows

Die folgenden Tests sind in `tests/e2e/` abgelegt bzw. ergänzt:

1. **Login (Auth)** – bereits in `shared/auth-flow.spec.ts` + Fixture mit `email-input`, `password-input`, `login-button`.
2. **Zeiterfassung: Formular sichtbar + Submit** – Zeiterfassungs-Seite, Prüfung auf Datum/Zeit-Inputs und Submit-Button (mit data-testid `timesheet-submit`).
3. **Zeiterfassung: Pause-Button klickbar** – Button mit `data-testid="pause-button"` klicken, Toast oder UI-Reaktion prüfbar.
4. **Zeiterfassung: Schicht beenden** – Nur wenn laufende Schicht (draft); Klick auf `data-testid="end-shift-button"`, Erfolg/Toast.
5. **Kunden-Signatur-Flow (Daily/Relieving)** – Nach Zeiterfassung mit Endzeit öffnet sich Signatur-Dialog; Name + Signatur (oder Placeholder) + Submit; Tests nutzen data-testids wo gesetzt.

Hinweis: Ein reiner "1-Tap-Start" existiert im Produkt nicht; "Start" = Formular ausfüllen + Submit. Die E2E-Tests sind daran angepasst.

---

## 4. Durchgeführte FIXES (Code)

1. **TimesheetForm.tsx:** Submit-Button-Text abhängig von `isEdit`: "Speichern" / "Aktualisieren" (+ Loading).
2. **TimesheetForm.tsx:** `data-testid="timesheet-submit"` am Submit-Button.
3. **zeiterfassung/page.tsx:** `data-testid="pause-button"` am Pause-Button, `data-testid="end-shift-button"` am "Schicht beenden"-Button.
4. **ProfileForm.tsx:** `data-testid="profile-form-submit-button"` am Speichern-Button.
5. **SignatureDialog.tsx:** Optionale data-testids für canvas, clear, save (für Signatur-E2E).
6. **RelievingPersonnelSignatureDialog.tsx / DailySignatureDialog.tsx:** data-testid für Signieren-Button.

---

## 5. ACTIONS (ausführen)

1. `npm run typecheck` – *Hinweis: Es gibt bestehende TS-Fehler in anderen Dateien (z. B. admin/urlaubsantraege, payroll, vitest); die geänderten Formulare sind fehlerfrei.*
2. `npm run storybook` → manuell alle Formulare durchklicken (falls Stories vorhanden).
3. **E2E:** Standard-Config nutzt `testDir: './e2e'`. Für die neuen Formular-Workflows in `tests/e2e/`:
   - `npx playwright test tests/e2e/critical-form-workflows.spec.ts --config="playwright.config 2.ts"`
   - oder `npm run test:e2e` wenn die Projekt-Config auf `tests/e2e` zeigt.

---

## 6. Zusammenfassung rote Flags

| Formular/Komponente | Rot | Fix |
|---------------------|-----|-----|
| TimesheetForm | Submit-Text immer "Aktualisieren"; keine data-testid | isEdit-bedingter Text; timesheet-submit |
| Zeiterfassung Page | Pause/End-Shift ohne data-testid | pause-button, end-shift-button |
| ProfileForm | Speichern-Button ohne data-testid | profile-form-submit-button |
| SignatureDialog / Daily / Relieving | Keine data-testids | Optionale testids für E2E |
| PauseDialog | Nicht angebunden; keine testids | testids wenn Integration kommt |

Alle genannten Fixes sind im Code umgesetzt (siehe folgende Änderungen).
