# Rollen und Einladungen – Betriebsmodell

Diese Logik gilt für den späteren Betrieb: **Ein Admin registriert seine Firma und lädt Mitarbeiter ein. Der Admin hat die Rolle Admin, die eingeladenen Mitarbeiter die Rolle Nurse.**

---

## Ablauf im Betrieb

1. **Admin registriert Firma**
   - Weg: **„Als Administrator registrieren“** (`/admin-registrieren`)
   - API: `POST /api/auth/register-admin`
   - Ergebnis: Firma (Company) wird angelegt, der Nutzer erhält **Rolle `admin`** und ist dieser Firma zugeordnet (`companyId`).

2. **Admin lädt Mitarbeiter ein**
   - Weg: Admin-Bereich → Mitarbeiter → Einladung versenden (E-Mail)
   - Einladung enthält einen Link mit Token.

3. **Mitarbeiter nimmt Einladung an**
   - Weg: Link aus der E-Mail → Passwort setzen, Konto anlegen
   - API: `POST /api/auth/accept-invite`
   - Ergebnis: Nutzer wird angelegt mit **Rolle `nurse`** und `companyId` der einladenden Firma.

---

## Rollen

| Rolle   | Bedeutung                    | Wie entstanden?                    |
|---------|-----------------------------|-------------------------------------|
| **admin** | Administrator der Firma     | Registrierung über „Als Administrator registrieren“ |
| **nurse** | Mitarbeiter (Pflegekraft)   | Einladung annehmen (accept-invite)  |

- **Admin**: Verwalten von Schichten, Mitarbeitern, Einrichtungen, Einstellungen, Einladungen. Sieht alle Daten der Firma.
- **Nurse**: Einsätze sehen, Dienstplan, Zeiterfassung, eigene Daten – kein Zugang zum Admin-Bereich.

---

## Datenisolation: Mitarbeiter sehen nur eigene Daten

Jede Mitarbeiter-Rolle ist von anderen getrennt. **Nur der Admin hat volle Kontrolle**; Mitarbeiter können **keine Daten anderer Mitarbeiter** einsehen.

| Datenart        | Nurse (Mitarbeiter)              | Admin                          |
|-----------------|-----------------------------------|--------------------------------|
| User/Profile    | Nur eigenes Profil               | Alle User der Firma            |
| Einsätze        | Nur eigene Assignments            | Alle Einsätze der Firma        |
| Zeiterfassung   | Nur eigene Timesheets/Times      | Alle der Firma                 |
| Berichte        | Nur eigene Berichte              | Alle der Firma                 |
| Dokumente       | Nur eigene Dokumente             | Alle (mit Rechten)             |
| Benachrichtigungen | Nur eigene                    | Alle der Firma                 |

Die Trennung wird durch **Firestore Rules** und clientseitige Nutzung der aktuellen User-ID (bzw. Admin-Check) umgesetzt. Mitarbeiter können andere User-Profile weder lesen noch auflisten.

---

## Technik

- **Rolle** wird serverseitig gesetzt:
  - `register-admin`: `role: 'admin'` im Firestore-User-Dokument + Custom Claims.
  - `accept-invite`: `role: 'nurse'` im Firestore-User-Dokument.
- Die Anmeldeseite leitet nach Login anhand der Rolle weiter (Admin → Admin-Bereich, Nurse → Mitarbeiterbereich).
- Optional können **benutzerdefinierte Rollen** mit Berechtigung „Admin-Bereich betreten“ genutzt werden (Einstellungen → Rollen).

---

## Erste Registrierung (Produktion)

Für die **erste** Admin-Registrierung (noch kein Admin im System) muss die Bootstrap-Option aktiv sein:

- `ENABLE_ADMIN_BOOTSTRAP=true` (optional: `ADMIN_BOOTSTRAP_EMAIL` für ensure-admin-role / Dev)
- Danach kann der erste Nutzer „Als Administrator registrieren“ nutzen und erhält `admin` + Firma.

Nach dem ersten Admin können weitere Admins nur von bestehenden Admins angelegt oder über eine entsprechende Konfiguration hinzugefügt werden; alle weiteren Nutzer kommen normalerweise per **Einladung** und werden **nurse**.
