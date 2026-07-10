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

**Ergebnis:** `npm run test:unit` → **62 passed, 3 skipped, 0 failed**. In CI aufgenommen (`quality.yml`).

**Bewusst übersprungen (3):** Tests für `useEmployeeReports` (workTimeReport/surchargesReport/Export) — diese Funktionen sind aktuell **Stubs** (Nullwerte / nur Toast). Mit `it.skip` und klarer Begründung markiert statt fake-grün gemacht; als Produktlücke F1 in `KNOWN_LIMITATIONS.md` dokumentiert.

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

Der **produktive Code** ist statisch verifiziert (Typecheck, Lint, Build) und in den sicherheitskritischen Pfaden (Firestore-Rules) sowie den arbeitsrechtlichen Kernberechnungen durch neue, grüne Tests abgesichert. Die Legacy-Unit-Suite ist saniert und CI-gebunden (62 passed / 3 dokumentiert übersprungen). Offen bleiben: die Implementierung der Mitarbeiter-Berichts-Aggregation (Produktlücke F1) und zwei fachliche Entscheidungen (B1, B2) beim Eigentümer.
