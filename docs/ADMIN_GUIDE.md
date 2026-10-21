# Handbuch Disposition (Admin)

Stand: Oktober 2026 · Schichtklar für AufAbruf GmbH

Kurzanleitung für die täglichen Abläufe. Alle Daten und Cloud Functions liegen in der EU (Belgien, `europe-west1`).

## Rollen

- **Disposition (admin):** plant, gibt frei, rechnet ab, verwaltet Personal und Einrichtungen.
- **Pflegekraft (nurse):** sieht eigene Einsätze, erfasst Zeiten, beantragt Urlaub, meldet sich krank, unterschreibt den Stundennachweis.
- Jede Firma sieht nur ihre eigenen Daten (Mandantentrennung über `companyId`, durch Firestore-Regeln und Cloud Functions erzwungen).

## Personal aufnehmen

1. **Personal → Mitarbeiter → Einladen**, E-Mail-Adresse eingeben.
2. Die Person bekommt einen Link (7 Tage gültig) und legt damit ihr Passwort fest. Erneutes Einladen erzeugt einen neuen Link.
3. Für Adressen, zu denen es schon ein Konto gibt, lehnt die App die Einladung ab; die Person meldet sich direkt an.
4. Im Personalstamm (**Bearbeiten**) eintragen: **Personalnummer** (wie in DATEV, für den Lohnexport), **Urlaubsanspruch (Tage/Jahr)**, Stundenlohn und Qualifikationen.

## Planen

- **Dienstplan / Schichten:** Schichten anlegen und Personen zuweisen.
- **Regel „1 Einsatz pro Tag“:** Eine zweite Zuweisung am selben Kalendertag geht nur mit Begründung; die Begründung wird gespeichert.
- **Abwesenheit:** Wer genehmigten Urlaub hat oder krank gemeldet ist, kann an diesem Tag weder zugewiesen werden noch Schichten anfragen oder Angebote annehmen.
- **Einsatzmitteilung (§ 11 AÜG):** Die Pflegekraft bestätigt oder lehnt jeden Einsatz digital mit Unterschrift ab; das PDF entspricht der AufAbruf-Vorlage.

## Urlaub & Krankheit (Personal → Abwesenheiten)

- **Offene Anträge:** genehmigen oder mit Begründung ablehnen. Zu jedem Antrag zeigt die App den Resturlaub danach, wer gleichzeitig fehlt und welche Einsätze betroffen sind.
- **Krankmeldungen** gelten sofort, ohne Genehmigung, und enthalten keine Diagnose (Art. 9 DSGVO). Ab Tag 4 die eAU bei der Krankenkasse abrufen.
- Die Glocke meldet neue Anträge und Krankmeldungen (Krankmeldungen als wichtig).
- Für die Urlaubstage zählen die Feiertage des Bundeslands aus dem Firmen-Dokument (`companies/{id}.holidayState`, z. B. `NW`).

## Zeiten prüfen (Personal → Zeitnachweise)

- Eingereichte Zeiten **freigeben** (einzeln oder mehrere) oder **mit Grund ablehnen** – die Pflegekraft korrigiert und reicht neu ein.
- Hinweise nach ArbZG (Pause zu kurz, über 10 h) erscheinen in der Liste; Freigeben mit Hinweis erfordert eine Bestätigung.
- **Freigabe anfragen:** erzeugt einen Link für die Einrichtung (ohne Konto, 14 Tage gültig). Die PDL bestätigt oder beanstandet die Dienste dort.
- Freigegebene Zeiten sind unveränderlich (GoBD); Zuschläge (Nacht, Sonntag, Feiertag) berechnet der Server.

## Stundennachweis (Personal → Stundennachweise)

Digitaler Ersatz für den Papierbogen „Arbeitszeiterfassung / Stunden-Nachweis“.

1. Die Pflegekraft unterschreibt ihren Monat in der App („erfasst“).
2. Die Disposition **erkennt an** („Unterschrift Arbeitgeber“). Das geht erst, wenn alle Zeiten des Monats freigegeben sind. Die Unterschrift wird für weitere Anerkennungen in derselben Sitzung übernommen.
3. Ändern sich Zeiten nach der Unterschrift, steht der Nachweis auf „Geändert“, und die Pflegekraft muss neu unterschreiben.
4. **Alle als PDF:** ein Sammel-PDF aller Nachweise für das Lohnbüro.

## Lohnexport DATEV (Personal → Stunden → „Lohnexport DATEV“)

- Einmalig Beraternummer, Mandantennummer, Bearbeitungsschlüssel und Lohnarten vom Steuerbüro eintragen.
- Exportiert werden nur freigegebene Stunden; Personen ohne Personalnummer werden gemeldet, nicht still übergangen.
- Vor dem ersten Echtlauf eine Testdatei mit dem Steuerbüro abstimmen.

## Prüfprotokolle (Auswertung → Prüfprotokolle)

- Der Server schreibt automatisch mit, wer wann was getan hat: Zeiten (erfasst, eingereicht, freigegeben, abgelehnt, geändert, von der Einrichtung bestätigt), Stundennachweise (unterschrieben, anerkannt, zurückgenommen), Abwesenheiten, Einsätze, Lohnexport-Einstellungen und Stammdaten (Rolle, Stundenlohn, Personalnummer, Urlaubsanspruch).
- Filter nach Bereich, Suche nach Person oder Vorgang, **CSV-Export** für Prüfungen.
- Einträge kann niemand ändern oder löschen, auch kein Admin.

## DSGVO

- **Auskunft:** Die Pflegekraft lädt ihre Daten unter Profil → Datenschutz herunter; die Disposition kann das für jede Person der eigenen Firma tun.
- **Löschung:** Kontaktdaten werden entfernt und das Konto gesperrt. Aufbewahrungspflichtige Nachweise (eingereichte/freigegebene Zeiten, Einsätze, Stundennachweise, Abwesenheiten) bleiben gesperrt erhalten (`legalHold`, MiLoG § 17, AO § 147, Art. 17 Abs. 3 b DSGVO).
- Prozesse im Detail: `docs/DSGVO_PROZESSE.md`.

## Betrieb

- Health-Check: `/api/health`, Status-Seite: `/systemstatus`.
- Backups: `scripts/firestore-backup.sh`, `scripts/storage-backup.sh`; Wiederherstellung: `docs/DISASTER_RECOVERY.md`.
- Deploy und Go-Live: `docs/GO_LIVE_CHECKLIST.md`.
