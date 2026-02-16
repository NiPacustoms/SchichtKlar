<!-- 97f79f44-36cf-47f4-8e48-debb7d45e751 9b4a7c6c-e180-4651-84cd-5568f0db4a3f -->

# Analyseplan Lohnabrechnung

1. Erfasse SOTA-Funktionsumfang

- Quellen: `tasks/payroll.todo.md`, `docs/LOHNABRECHNUNG_ANALYSE.md`, `docs/PAYROLL_REQUIREMENTS.md`
- Ergebnis: strukturierte Liste rechtlicher & funktionaler Anforderungen

2. Prüfe vorhandene Admin-Implementierung

- Dateien: `app/(admin)/admin/lohnabrechnung/page.tsx`, `lib/hooks/usePayroll.ts`, `lib/services/payroll.ts`, `components/admin/*`
- Ergebnis: Überblick über verfügbare Features & technische Basis

3. Vergleiche Soll/Ist & identifiziere Lücken

- Verdichtung zu Kernpunkten (Pflicht vs. Nice-to-have)
- Hinweise zu fehlender Integration vorhandener Komponenten
