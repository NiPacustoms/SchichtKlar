# Go-Live-Checkliste

Stand: Oktober 2026. Reihenfolge einhalten; alles aus dem Projektordner auf dem Mac (`~/Desktop/Apps/SchichtKlar`) nach `git pull`.

## 1. Einmalig vorbereiten

- [ ] **Firmen-Dokument** in der Firebase-Konsole (Firestore → `companies/<eure companyId>`): `holidayState: "NW"` setzen (Feiertage NRW für die Zuschlagsstunden).
- [ ] **Impressums-/Firmendaten** (`NEXT_PUBLIC_COMPANY_*`, inkl. Steuernummer und Bank) im Hosting setzen. Sie erscheinen in der Fußzeile von Einsatzmitteilung und Stundennachweis.
- [ ] **E-Mail:** `RESEND_API_KEY` (und `RESEND_FROM` mit eurer Domain) für Einladungen setzen; SMTP-Zugang für die Benachrichtigungen der Cloud Functions.
- [ ] **AVV mit Google Cloud** abschließen (alle Daten und Functions liegen in `europe-west1`).

## 2. Deploy

```bash
cd ~/Desktop/Apps/SchichtKlar
git pull
npm ci && (cd functions && npm ci)
firebase deploy --only functions,firestore:rules,firestore:indexes,hosting
```

- [ ] Die CLI fragt, ob Functions in **`us-central1`** gelöscht werden sollen → **mit „y“ bestätigen**. Alle Functions laufen jetzt in Europa. Die alten US-Kopien würden sonst parallel weiterlaufen: doppelte Benachrichtigungen und Datenverarbeitung in den USA.
- [ ] Falls noch vorhanden: `firebase functions:delete deleteAllAssignments --region us-central1`.
- [ ] Am besten außerhalb der Dienstzeiten deployen: In den wenigen Minuten zwischen Functions- und Hosting-Deploy können ältere offene App-Fenster Funktionen nicht aufrufen. Danach die Seite neu laden.

## 3. Nach dem Deploy prüfen (10 Minuten)

- [ ] `/api/health` liefert 200, `/systemstatus` ist grün.
- [ ] Als Disposition: Personal → Stundennachweise und Prüfprotokolle öffnen – ohne Fehlermeldung.
- [ ] Test-Pflegekraft einladen → Link öffnen → Passwort setzen → landet im Arbeitsplatz.
- [ ] Testschicht zuweisen → Einsatzmitteilung erscheint bei der Pflegekraft; Unterschrift → PDF.
- [ ] Zeiten erfassen → einreichen → freigeben → im Prüfprotokoll steht „Zeiten vom … freigegeben“ mit Namen.
- [ ] Stundennachweis eines Testmonats als PDF erzeugen und mit dem Lohnbüro abstimmen.

## 4. Vor dem zweiten Kunden (Mandant)

- [ ] Einmal `/api/admin/backfill-company-ids?confirm=BACKFILL` als Admin ausführen, danach die `null`-Toleranz in `belongsToSameCompany` (firestore.rules) entfernen (siehe KNOWN_LIMITATIONS D1).

## Bereits erledigt (Stand dieser Version)

- Mandantentrennung in Rules und Functions, mit Tests (Rules: 8 Suites, Functions-Emulator: 5 Suites inkl. Szenario-Simulation).
- Debug-Seiten und -APIs sind in Produktion gesperrt; ungenutzte Proxy-Routen sind entfernt.
- DSGVO-Auskunft/-Löschung nur für eigene Daten bzw. durch die Disposition; Aufbewahrungspflichten werden eingehalten.
- Prüfprotokoll serverseitig und unveränderlich.
