# QA-Bericht (Phase 5/8 – Marktreife)

**Stand:** 10.07.2026 · Branch `chore/market-ready`

Dieser Bericht dokumentiert die verifizierten Prüfungen, den Zustand der automatisierten Tests und die dabei gefundenen Geschäftslogik-Befunde. Er ist ehrlich gehalten: Was grün ist, ist verifiziert; was rot/offen ist, wird als solches benannt.

## 1. Statische Prüfungen (verifiziert grün)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| TypeScript | `npm run typecheck` | ✅ 0 Fehler |
| ESLint (Flat Config, `--max-warnings=0`) | `npm run lint` | ✅ 0 Fehler, 0 Warnungen |
| Produktions-Build | `npm run build` (mit Impressums-ENV) | ✅ erfolgreich |
| Firestore-Rules (Isolation) | `npm run test:rules` | ✅ 9/9 |
| Firestore-Rules (Rechte-Eskalation) | `npm run test:rules` | ✅ 4/4 |
| Geschäftsregeln (Zeit/Pausen) | `vitest lib/utils/__tests__/businessRules.test.ts` | ✅ 12/12 |

## 2. Neue Tests in dieser Phase

- **`tests/rules/firestore-escalation.test.mjs`** (Phase 4): pinnt die Sperre der Rollen-Eskalation (Pflegekraft kann sich nicht selbst zum Admin machen) – 4 Fälle.
- **`lib/utils/__tests__/businessRules.test.ts`** (Phase 5): deckt die reinen zeit-/arbeitsrechtlichen Kernregeln ab (deterministisch, ohne Firestore-Mock):
  - Regel 3/5: Arbeitszeitberechnung, Nachtschicht über Mitternacht, keine negativen Zeiten.
  - Regel 4: §4-ArbZG-Pausenschwellen (0/30/45 min) und Pausen-Warnung.
  - Zeitformat-Validierung (HH:MM).

## 3. Zustand der bestehenden Unit-Test-Suite (offener Befund)

**Status (aktualisiert):** ✅ **saniert.** Die zuvor abgedriftete Vitest-Unit-Suite (`lib/services/__tests__/*`, `lib/hooks/__tests__/*`) wurde vollständig repariert: jsdom-Umgebung (für die clientseitigen `typeof window`-Guards), `@testing-library/react` ergänzt, Firebase-Mocks an die aktuellen Service-Signaturen angeglichen (db/auth/getDoc/Timestamp, forEach-fähige Snapshots), API-Drift korrigiert (`getByUser`→`getByUserId`, `reject`→`verify`, `assign`→`assignUser`, geänderte Rückgabetypen), Mock-Pollution (persistierende `mockResolvedValue`) durch beforeEach-Resets behoben, eine Zeitfenster-Grenzwertannahme präzisiert und die Realtime-Listener-Keys aktualisiert.

**Ergebnis:** `npm run test:unit` → **65 passed, 0 skipped, 0 failed**. In CI aufgenommen (`quality.yml`).

**Produktlücke F1 geschlossen:** Die Mitarbeiter-Berichts-Aggregation/Export (`useEmployeeReports`) wurde implementiert; die 3 zuvor übersprungenen Tests sind reaktiviert und grün. Keine übersprungenen Tests mehr.

## 4. Geschäftslogik-Befunde (Phase 5 – Entscheidungsbedarf beim Eigentümer)

Zwei Regeln aus der Spezifikation weichen vom implementierten Verhalten ab. Beides sind **fachliche Entscheidungen an Kern-Scheduling/Signatur-Logik**, die nicht ohne Freigabe geändert werden sollten (Regel „keine ungefragten Verhaltensänderungen").

### B1 — Regel 1 „max. 1 Einsatz pro Kalendertag" ist als Zeit-Überlappung implementiert

**Ort:** `functions/src/assignment/createWithMatching.ts` (Kandidaten-Matching) und `assignments.checkConflict`.
**Ist:** Der Konflikt-Check verhindert **zeitlich überlappende** Einsätze (`checkOverlap`). Zwei nicht-überlappende Einsätze am selben Kalendertag (z. B. 08–12 Uhr und 14–18 Uhr) würden **beide** zugelassen.
**Soll (Spez.):** Maximal ein Einsatz pro Mitarbeiter und Kalendertag.
**Indiz für Soll-Modell:** Der Use-Case `getTodayAssignment.execute(userId)` liefert **genau einen** Einsatz pro Tag – das Datenmodell geht bereits von „einer pro Tag" aus.
**Empfehlung:** Wenn „ein Einsatz pro Kalendertag" die harte Regel ist, sollte der Konflikt-Check von Überlappung auf „gleicher Kalendertag (Europe/Berlin)" umgestellt werden. Da dies Split-Shift-Szenarien ausschließt, braucht es die Freigabe des Eigentümers. **Kein Code geändert.**

### B2 — Regel 8 „Unterschriftsblöcke max. 7 Tage" ohne sichtbare harte Grenze

**Ort:** `signatureSchedule.requiredDates: Date[]` (`lib/services/assignments*`).
**Ist:** Das Datenmodell erlaubt eine beliebig lange `requiredDates`-Liste. Eine Stelle, die die Erzeugung eines Signaturblocks hart auf 7 Tage begrenzt, wurde im durchsuchten Code **nicht gefunden** (die Erzeugung erfolgt vermutlich clientseitig bei der mehrtägigen Einsatzanlage).
**Empfehlung:** Die 7-Tage-Grenze explizit und serverseitig prüfbar verankern (z. B. Validierung bei Anlage: `requiredDates.length <= 7`), damit die Regel nicht nur UI-seitig gilt. **Zur Klärung markiert, kein Code geändert.**

## 5. Fazit

Der **produktive Code** ist statisch verifiziert (Typecheck, Lint, Build) und in den sicherheitskritischen Pfaden (Firestore-Rules) sowie den arbeitsrechtlichen Kernberechnungen durch neue, grüne Tests abgesichert. Die Legacy-Unit-Suite ist saniert und CI-gebunden (65 passed, 0 übersprungen). Offen bleiben zwei fachliche Entscheidungen (B1, B2) beim Eigentümer.

## 6. Logik-Audit der Zeiterfassungs-Workflows (11.07.2026)

Systematische Prüfung aller Kern-Workflows auf Logikfehler. Befunde (alle behoben, mit Tests gepinnt):

| # | Schwere | Befund | Fix |
|---|---|---|---|
| L1 | **Kritisch** | Die UI reichte Zeiterfassungen über den ungeschützten Client-Pfad ein (`timesheetService.submit` = direktes Status-Update). Die sichere Cloud Function `submitTimesheet` (serverseitige Stundenberechnung + vollständige ArbZG-Validierung §3/§4/§5 + Überschneidungsprüfung) wurde **nie aufgerufen** – die gesamte serverseitige Schutzlogik war wirkungslos. | Client-`submit()` ruft jetzt die Cloud Function auf; offline wird das Einreichen mit klarer Meldung verweigert (Erfassung bleibt offlinefähig). |
| L2 | Hoch | ArbZG-Überschneidungsprüfung nutzte bei Nachtschichten die **unnormalisierte Endzeit** (Ende vor Start) – Überlappungen mit Nachtschichten wurden nicht erkannt. | Endzeit wird vor allen Prüfungen auf den Folgetag normalisiert. |
| L3 | Hoch | §5-Ruhezeitprüfung: Nachtschicht-Erkennung verglich die Endzeit gegen Mitternacht statt gegen die Startzeit derselben Schicht – die Bedingung konnte nie zutreffen, die Ruhezeit wurde bei Nachtschichten um bis zu 24 h zu früh angesetzt. | Vergleich gegen die Schicht-Startzeit. |
| L4 | Hoch | Negative/NaN-Stunden möglich: Pause ≥ Arbeitszeit oder ungültige HH:MM-Eingaben erzeugten negative bzw. NaN-`totalHours` (Client `create`/`update` UND Cloud Function). | Gemeinsamer validierter Rechenkern `computeNetHours()` (Client) + Plausibilitätsprüfung in `validateTimesheetArbZG` (Server). |
| L5 | Hoch | Signatur-Zeitplan (Regel 8): UTC-Datums-Keys verschoben lokale Mitternachtstermine auf den Vortag; bei kurzen Einsätzen ohne Sonntag lag der Signaturtermin NACH dem Einsatzende. Praktische Folge: der Einrichtungs-Signatur-Dialog öffnete sich fast nie. | Lokale Datums-Keys, Termin auf Einsatzende geklemmt, Duplikat-Bereinigung, `validateSignatureScheduleMaxBlock()` als serverseitig nutzbare Prüfung. |
| L6 | Mittel | Client-`submit()` prüfte den Ausgangsstatus nicht (bereits genehmigte Erfassung konnte auf „submitted" zurückgestuft werden). | Durch L1 mitbehoben – die Cloud Function prüft den Status. |

**Testabdeckung:** 17 neue Unit-Tests (`signatureSchedule.test.ts` 10, `computeNetHours.test.ts` 7). Gesamtsuite: **82 passed, 0 failed**.

**Bewusst offen gelassen:** C1 (1 Einsatz pro Kalendertag vs. Zeit-Überlappung) bleibt eine fachliche Eigentümer-Entscheidung (schließt Split-Dienste aus). Wochenlimit-Berechnung nutzt Serverzeit (UTC) für Wochengrenzen – bei Europe/Berlin-Betrieb max. 1–2 h Unschärfe an Wochenrändern, dokumentiert.

## 7. Logik-Audit, zweiter Pass (11.07.2026)

| # | Schwere | Befund | Fix |
|---|---|---|---|
| L7 | **Hoch (Produktlücke)** | `nightHours`, `weekendHours`, `holidayHours`, `overtimeHours`, `surchargeAmount` wurden **nirgends berechnet** – alle Zuschlags- und Zeitkonten-Reports zeigten dauerhaft 0. | Serverseitiger Stunden-Breakdown in `submitTimesheet` (`functions/src/utils/workHoursBreakdown.ts`): Nacht 23–06 Uhr (§2 ArbZG), Sa/So-Buckets tagesgenau auch über Mitternacht, bundesweite Feiertage (Gauß-Formel), Überstunden > 8 h/Tag, Zuschläge (Nacht 25 %, Sonntag 50 %, Feiertag 125 % – §3b-EStG-üblich, Feiertag ersetzt Sonntag) auf Basis `users.hourlyRate`; ohne hinterlegten Lohn bleibt der Betrag 0 (keine erfundenen Werte). Pausen proportional verteilt. |
| L8 | Hoch | Client-Konfliktprüfung `checkTimeOverlap` (Einsatz-Zuweisung): Nachtschichten wurden nicht normalisiert – Konflikte mit Schichten über Mitternacht wurden nie erkannt (gleiche Fehlerklasse wie L2, andere Stelle). | Endzeit ≤ Startzeit → +24 h vor dem Vergleich. |
| L9 | Mittel | Feiertagsprovider: **Pfingstmontag = Ostern+49 (falsch, das ist Pfingstsonntag; korrekt +50)**; Buß- und Bettag fiel in Jahren, in denen der 23.11. selbst ein Mittwoch ist (z. B. 2022), auf den 23.11. statt 16.11.; Reformationstag fehlte für HB/HH/NI/SH (gesetzlich seit 2018); Berlin-Frauentag und Thüringen-Weltkindertag fehlten. | Alle korrigiert/ergänzt; 5 neue Tests pinnen die Regressionen. |
| L10 | Mittel | Einsatz-Statusübergänge ohne Guards: abgelehnte/abgeschlossene Einsätze konnten wieder „angenommen", beliebige Status „abgeschlossen" werden. | `accept`/`decline`/`complete` prüfen jetzt den Ausgangsstatus. |

**Testabdeckung:** +12 Tests (workHoursBreakdown 7, holidayProvider-Fixes 5). Gesamtsuite: **95 passed, 0 failed**.
