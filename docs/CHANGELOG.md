# Änderungsprotokoll

## Oktober 2026 – Fertigstellung

**Neu**
- Freigabe-Link für Einrichtungen: Die PDL bestätigt oder beanstandet eine Woche ohne eigenes Konto (#48).
- Stundennachweis: der Papierbogen „Arbeitszeiterfassung / Stunden-Nachweis“ digital, mit Unterschrift „erfasst“ und „anerkannt“, PDF und Sammel-PDF (#51).
- Prüfprotokoll: serverseitig, unveränderlich, mit Filter und CSV-Export.

**Entfernt**
- Lohnsteuer-Reste und der DATEV-LODAS-Export (#53, #54) – die Lohnabrechnung macht das Steuerbüro, die App liefert Stundennachweise.
- Urlaubsverwaltung (Anträge, Genehmigung, Resturlaub, Urlaubsanspruch) (#55).
- Krankmeldungen (Meldung, Postfach, Sperre in der Planung, „K“ im Stundennachweis) – Krankmeldungen laufen außerhalb der App. Altdaten bleiben gesperrt in der Datenbank (#56).
- Automatische Kandidatenvorschläge (Matching), Schichtanfragen durch Pflegekräfte, Datei-Import für Personal/Einrichtungen, Sicherheits-Check-Seite samt 2FA-Pflichtschalter und die Berichte-Seite für Pflegekräfte (#57). Ausschreiben geht weiter – an selbst ausgewählte Kräfte.

**Sicherheit & Datenschutz**
- Alle Cloud Functions laufen in der EU (`europe-west1`), auch die geplanten Jobs (Formular-Erinnerungen, Kennzahlen).
- Feiertage: Standard-Bundesland NRW, wenn bei der Firma keins gesetzt ist.
- firebase-functions 7.4.
- DSGVO-Auskunft/-Löschung nur für eigene Daten bzw. durch die Disposition; Aufbewahrungspflichten (MiLoG, AO) werden eingehalten.
- Pflegekräfte können Stundenlohn und Personalnummer nicht selbst ändern.
- Ungenutzte Proxy-Routen und Demo-Seiten entfernt.

**Fehlerbehebungen**
- Einladung: Vorschau-Fehler behoben, neuer Link bei erneutem Senden, 7 Tage gültig, klare Meldung bei bestehendem Konto.
- Kurz-URLs führen je nach Rolle in den richtigen Bereich.
- Mobile Darstellung der Seite „Zeiten“ ohne Querscrollen.
