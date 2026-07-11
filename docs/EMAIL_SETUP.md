# E-Mail-Versand mit Firebase

SchichtKlar verschickt E-Mails über Cloud Functions nach dem Firebase-Muster
**„Trigger Email from Firestore"**: Server-Code legt ein Dokument in der
Firestore-Collection `mail` ab, der Trigger `processMailQueue` versendet die
Mail und schreibt den Zustellstatus zurück in das Dokument.

## Architektur

```
Next.js / Callable CFs / Scheduled Jobs
        │  (Admin SDK bzw. enqueueMail())
        ▼
Firestore Collection `mail`  ──►  processMailQueue (Firestore-Trigger)
                                        │
                                        ▼
                          Provider-Kette in functions/src/email.ts
                          1. Resend   (falls RESEND_API_KEY gesetzt)
                          2. SMTP     (nodemailer, z. B. Gmail)
                                        │
                                        ▼
                          delivery.state = SUCCESS | ERROR
```

Beteiligte Bausteine:

| Baustein | Datei | Zweck |
| --- | --- | --- |
| `processMailQueue` / `retryMailQueue` | `functions/src/mailQueue.ts` | Firestore-Trigger auf `mail/{mailId}` |
| `sendTemplatedEmail` | `functions/src/email.ts` | Zentrale Provider-Kette (Resend → SMTP) |
| `sendInvitationEmailCF` / `sendAssignmentSignatureEmailCF` | `functions/src/index.ts` | Callable Functions für den Client |
| `scheduledFormReminders` | `functions-scheduled/src/formReminders.ts` | Legt Erinnerungs-Mails in die Queue |

Die Collection `mail` ist per Firestore Rules komplett gesperrt — nur das
Admin SDK (Cloud Functions, Next.js-Server) kann Dokumente anlegen.

## Voraussetzung

Cloud Functions brauchen für ausgehende Netzwerk-Verbindungen (SMTP/Resend)
den **Blaze-Plan** (Pay-as-you-go). Ohne konfigurierten Provider werfen die
Functions keinen Fehler, sondern loggen die Mail nur
(`delivery.state = ERROR`, `[Email:FALLBACK]` im Log).

## Option A: Gmail / Google Workspace SMTP (schnellster Weg im Google-Ökosystem)

1. Google-Konto (z. B. `noreply@ihredomain.de` in Google Workspace oder ein
   Gmail-Konto) mit **2-Faktor-Authentifizierung** aktivieren.
2. **App-Passwort** erstellen: <https://myaccount.google.com/apppasswords>
3. In `functions/.env` (wird von `firebase deploy` automatisch geladen,
   **nicht** ins Git einchecken):

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=noreply@ihredomain.de
   SMTP_PASS=<16-stelliges App-Passwort>
   SMTP_FROM=SchichtKlar <noreply@ihredomain.de>
   ```

4. Deploy:

   ```bash
   firebase deploy --only functions
   ```

Hinweis: Gmail limitiert auf ~500 Mails/Tag (Workspace: 2.000/Tag). Für
höheres Volumen und bessere Zustellbarkeit → Option B.

## Option B: Resend (empfohlen für Produktion)

1. Konto auf <https://resend.com> anlegen, eigene Domain verifizieren
   (SPF/DKIM-Einträge setzen).
2. API-Key erstellen und in `functions/.env` hinterlegen:

   ```env
   RESEND_API_KEY=re_xxxxxxxx
   RESEND_FROM=SchichtKlar <noreply@ihredomain.de>
   ```

3. Deploy wie oben. Ist `RESEND_API_KEY` gesetzt, wird Resend bevorzugt;
   SMTP dient als Fallback.

Statt `.env` können sensible Werte auch als Secret gesetzt werden
(`firebase functions:secrets:set SMTP_PASS`); dafür muss die jeweilige
Function zusätzlich mit `runWith({ secrets: [...] })` gebunden werden.

## Mail programmatisch verschicken

**In der default-Functions-Codebase** (hat Zugriff auf die Helper):

```ts
import { enqueueMail } from './mailQueue';

await enqueueMail({
  to: 'user@example.com',
  subject: 'Betreff',
  html: '<p>Inhalt</p>',
  text: 'Inhalt',
});
```

**Aus jedem anderen Server-Kontext** (scheduled-Codebase, Next.js mit Admin
SDK): einfach ein Dokument in `mail` anlegen:

```ts
await admin.firestore().collection('mail').add({
  to: 'user@example.com',
  subject: 'Betreff',
  html: '<p>Inhalt</p>',
  delivery: { state: 'PENDING', attempts: 0, error: null },
});
```

## Zustellstatus & Retry

Der Trigger schreibt in das Mail-Dokument:

```
delivery: {
  state: 'SUCCESS' | 'ERROR' | 'PROCESSING' | 'PENDING' | 'RETRY',
  attempts: number,
  provider: 'resend' | 'smtp' | null,
  error: string | null,
  startTime / endTime: Timestamp,
}
```

Fehlgeschlagene Mail erneut senden: in der Firebase Console (oder per Admin
SDK) `delivery.state` auf `'RETRY'` setzen — `retryMailQueue` versendet dann
erneut.

## Testen

1. Provider konfigurieren und deployen (oder Emulator mit `functions/.env`).
2. In der Firebase Console ein Dokument in `mail` anlegen:
   `{ to: "ihre@mail.de", subject: "Test", html: "<p>Test</p>" }`
3. Nach wenigen Sekunden sollte `delivery.state = "SUCCESS"` im Dokument
   stehen und die Mail im Postfach liegen. Bei `ERROR` steht die Ursache in
   `delivery.error`.
