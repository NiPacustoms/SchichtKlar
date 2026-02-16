# JobFlow – Dokumentation Teil 23

*Zeichen 437115–457000 von 2862906*

---

            2. Datenerfassung auf dieser Website
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            [Beschreibung der automatischen Datenerfassung]
          </Typography>
        </Box>

        {/* 3. Firebase/Firestore Datenverarbeitung */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            3. Firebase/Firestore Datenverarbeitung
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Diese App verwendet Google Firebase/Firestore zur Datenspeicherung.
            Anbieter: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            Datenübertragung: Daten werden in der EU gespeichert (europe-west1).
            Weitere Informationen: https://firebase.google.com/support/privacy
          </Typography>
        </Box>

        {/* 4. Push-Notifications */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            4. Push-Notifications
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Diese App sendet Push-Benachrichtigungen über Firebase Cloud Messaging (FCM).
            Anbieter: Google Ireland Limited.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
            Sie können Push-Notifications in den App-Einstellungen deaktivieren.
          </Typography>
        </Box>

        {/* 5. Chat-Daten */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            5. Chat-Daten
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Chat-Nachrichten werden in Firebase Firestore gespeichert.
            Zugriff: Nur Teilnehmer des jeweiligen Chat-Kanals.
            Speicherdauer: Bis zur Löschung durch Nutzer oder Admin.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          </Typography>
        </Box>

        {/* 6. Zeiterfassungsdaten */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            6. Zeiterfassungsdaten
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Zeiterfassungsdaten werden zur Lohnabrechnung gespeichert.
            Speicherdauer: 10 Jahre (GoBD-Konformität).
            Rechtsgrundlage: Art. 6 Abs. 1 lit. c DSGVO (Rechtliche Verpflichtung).
          </Typography>
        </Box>

        {/* 7. Payroll-Daten */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            7. Lohnabrechnungsdaten
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Lohnabrechnungsdaten enthalten sensible Informationen (IBAN, SV-Nr., Steuer-ID).
            Zugriff: Nur Administratoren.
            Speicherdauer: 10 Jahre (GoBD-Konformität).
            Rechtsgrundlage: Art. 6 Abs. 1 lit. c DSGVO (Rechtliche Verpflichtung).
          </Typography>
        </Box>

        {/* 8. Cookies/Tracking */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            8. Cookies und Tracking
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Diese App verwendet technisch notwendige Cookies für die Funktionalität.
            [Falls Analytics verwendet wird: Beschreibung]
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse).
          </Typography>
        </Box>

        {/* 9. Datenweitergabe */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            9. Datenweitergabe
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Daten werden an folgende Dritte weitergegeben:
            - Google Firebase (Datenverarbeitung)
            - [Weitere Dritte, falls vorhanden]
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          </Typography>
        </Box>

        {/* 10. Betroffenenrechte (Art. 15-22 DSGVO) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            10. Ihre Rechte
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Sie haben folgende Rechte:
            - Art. 15 DSGVO: Auskunftsrecht
            - Art. 16 DSGVO: Recht auf Berichtigung
            - Art. 17 DSGVO: Recht auf Löschung
            - Art. 18 DSGVO: Recht auf Einschränkung der Verarbeitung
            - Art. 20 DSGVO: Recht auf Datenübertragbarkeit
            - Art. 21 DSGVO: Widerspruchsrecht
            - Art. 22 DSGVO: Recht auf Beschwerde bei Aufsichtsbehörde
            
            Kontakt: [E-Mail-Adresse]
          </Typography>
        </Box>

        {/* 11. Speicherdauer */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            11. Speicherdauer
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Personenbezogene Daten werden gelöscht, sobald der Zweck der Speicherung entfällt.
            Ausnahmen: Rechtliche Aufbewahrungspflichten (z.B. GoBD: 10 Jahre für Lohnabrechnungen).
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
```

**Hinweis:** Rechtsprüfung durch Datenschutzbeauftragten empfohlen.

**Verifikation:**
- Manuelle Prüfung der Seite: `/legal/privacy`
- Vollständigkeit der DSGVO-Artikel prüfen

---

### Schritt 2.3: Cookie-Banner implementieren

**Problem:** Kein Cookie-Banner vorhanden

**Aktion:**

1. Neue Komponente erstellen: `components/legal/CookieBanner.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, Stack, Link } from '@mui/material';
import { Cookie } from '@mui/icons-material';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
    // Optional: Analytics initialisieren
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 3,
        zIndex: 9999,
        boxShadow: 3,
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <Cookie sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung zu bieten.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Durch die Nutzung unserer Website stimmen Sie unserer{' '}
            <Link href="/legal/privacy" underline="hover">
              Datenschutzerklärung
            </Link>{' '}
            zu.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={handleReject}>
            Ablehnen
          </Button>
          <Button variant="contained" onClick={handleAccept}>
            Akzeptieren
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
```

2. In Root-Layout einbinden: `app/layout.tsx`

```typescript
import { CookieBanner } from '@/components/legal/CookieBanner';

// Im return-Statement hinzufügen:
<CookieBanner />
```

**Verifikation:**
- Cookie-Banner erscheint beim ersten Besuch
- Consent wird in localStorage gespeichert
- Banner verschwindet nach Akzeptieren/Ablehnen

---

### Schritt 2.4: Datenexport-Funktion implementieren (DSGVO Art. 15)

**Problem:** Keine Möglichkeit für User, ihre Daten zu exportieren

**Aktion:**

1. API-Route erstellen: `app/api/user/data-export/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, adminDb } from '@/lib/server/firebaseAdmin';
import { checkRateLimit } from '@/lib/middleware/rateLimit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const decoded = await verifyIdToken(authHeader);
    if (!decoded || !adminDb) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.uid;

    // Rate Limiting
    const rateLimitResponse = checkRateLimit(req, userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Alle User-Daten sammeln
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Timesheets
    const timesheetsSnapshot = await adminDb
      .collection('timesheets')
      .where('userId', '==', userId)
      .get();
    const timesheets = timesheetsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Assignments
    const assignmentsSnapshot = await adminDb
      .collection('assignments')
      .where('userId', '==', userId)
      .get();
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Messages (nur eigene)
    const messagesSnapshot = await adminDb
      .collection('messages')
      .where('userId', '==', userId)
      .get();
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Zusammenfassen
    const exportData = {
      user: userData,
      timesheets,
      assignments,
      messages,
      exportedAt: new Date().toISOString(),
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="jobflow-data-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { message: 'Error exporting data' },
      { status: 500 }
    );
  }
}
```

2. UI-Button hinzufügen: `app/(employee)/employee/profil/page.tsx`

```typescript
import { Download } from '@mui/icons-material';

// Im return-Statement hinzufügen:
<Button
  variant="outlined"
  startIcon={<Download />}
  onClick={async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/user/data-export', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jobflow-data-export-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Datenexport erfolgreich');
    } catch (error) {
      toast.error('Fehler beim Datenexport');
    }
  }}
>
  Meine Daten exportieren (DSGVO)
</Button>
```

**Verifikation:**
- Button funktioniert
- JSON-Datei wird heruntergeladen
- Alle User-Daten sind enthalten

---

### Schritt 2.5: Datenlöschung-Funktion implementieren (DSGVO Art. 17)

**Problem:** Keine Möglichkeit für User, ihre Daten zu löschen

**Aktion:**

1. API-Route erstellen: `app/api/user/data-deletion/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, adminDb, adminAuth } from '@/lib/server/firebaseAdmin';
import { checkRateLimit } from '@/lib/middleware/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const decoded = await verifyIdToken(authHeader);
    if (!decoded || !adminDb) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.uid;
    const body = await req.json();
    const { confirmDeletion } = body;

    if (!confirmDeletion) {
      return NextResponse.json(
        { message: 'Bestätigung erforderlich' },
        { status: 400 }
      );
    }

    // Rate Limiting
    const rateLimitResponse = checkRateLimit(req, userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // WICHTIG: GoBD-Konformität - Lohnabrechnungsdaten NICHT löschen
    // Stattdessen: User-Daten anonymisieren

    // User-Dokument anonymisieren
    await adminDb.collection('users').doc(userId).update({
      email: `deleted-${userId}@deleted.local`,
      displayName: 'Gelöschter Benutzer',
      phone: '',
      active: false,
      deletedAt: new Date(),
    });

    // Timesheets: Nur nicht-approved löschen/anonymisieren
    const timesheetsSnapshot = await adminDb
      .collection('timesheets')
      .where('userId', '==', userId)
      .get();
    
    for (const doc of timesheetsSnapshot.docs) {
      const data = doc.data();
      if (data.status !== 'approved' && data.status !== 'submitted') {
        await doc.ref.delete();
      } else {
        // Anonymisieren statt löschen (GoBD)
        await doc.ref.update({
          userId: `deleted-${userId}`,
        });
      }
    }

    // Messages löschen
    const messagesSnapshot = await adminDb
      .collection('messages')
      .where('userId', '==', userId)
      .get();
    
    for (const doc of messagesSnapshot.docs) {
      await doc.ref.delete();
    }

    // Firebase Auth User löschen
    if (adminAuth) {
      await adminAuth.deleteUser(userId);
    }

    return NextResponse.json({ message: 'Daten erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json(
      { message: 'Error deleting data' },
      { status: 500 }
    );
  }
}
```

2. UI-Dialog hinzufügen: `app/(employee)/employee/profil/page.tsx`

```typescript
import { Delete } from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField } from '@mui/material';

// State hinzufügen:
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [deleteConfirm, setDeleteConfirm] = useState('');

// Im return-Statement hinzufügen:
<Button
  variant="outlined"
  color="error"
  startIcon={<Delete />}
  onClick={() => setDeleteDialogOpen(true)}
>
  Konto löschen (DSGVO)
</Button>

<Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
  <DialogTitle>Konto löschen</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Möchten Sie Ihr Konto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
      <br /><br />
      Hinweis: Lohnabrechnungsdaten werden aus rechtlichen Gründen (GoBD) nicht gelöscht, sondern anonymisiert.
      <br /><br />
      Geben Sie "LÖSCHEN" ein, um zu bestätigen:
    </DialogContentText>
    <TextField
      autoFocus
      margin="dense"
      label="Bestätigung"
      fullWidth
      value={deleteConfirm}
      onChange={(e) => setDeleteConfirm(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
    <Button
      color="error"
      onClick={async () => {
        if (deleteConfirm === 'LÖSCHEN') {
          try {
            const token = await auth.currentUser?.getIdToken();
            await fetch('/api/user/data-deletion', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ confirmDeletion: true }),
            });
            toast.success('Konto erfolgreich gelöscht');
            // Redirect to login
            router.push('/login');
          } catch (error) {
            toast.error('Fehler beim Löschen des Kontos');
          }
        }
      }}
      disabled={deleteConfirm !== 'LÖSCHEN'}
    >
      Löschen
    </Button>
  </DialogActions>
</Dialog>
```

**Verifikation:**
- Dialog funktioniert
- Daten werden gelöscht/anonymisiert
- GoBD-konforme Daten bleiben erhalten

---

## Phase 3: Security-Fixes

**Ziel:** Alle Security-Probleme beheben  
**Aufwand:** 1-2 Tage  
**Priorität:** P0/P1 - BLOCKER/MUSS

### Schritt 3.1: `eval()` entfernen

**Problem:** `eval()` ist extrem gefährlich

**Betroffene Dateien:**
- `app/debug-env/page.tsx` (Zeile 58)

**Aktion:**

1. Datei öffnen: `app/debug-env/page.tsx`

2. `eval()` entfernen oder ersetzen:

**VORHER:**
```typescript
const evalResult = eval(evalStr);
```

**NACHHER (Option 1 - Entfernen):**
```typescript
// eval() entfernt - zu gefährlich für Production
const evalResult = 'eval() wurde aus Sicherheitsgründen deaktiviert';
```

**NACHHER (Option 2 - Sichere Alternative):**
```typescript
// Nur JSON.parse für sichere JSON-Evaluation
let evalResult;
try {
  if (evalStr.trim().startsWith('{') || evalStr.trim().startsWith('[')) {
    evalResult = JSON.parse(evalStr);
  } else {
    evalResult = 'Nur JSON wird unterstützt';
  }
} catch (error) {
  evalResult = `Fehler: ${error.message}`;
}
```

**Oder:** Debug-Route komplett entfernen, wenn nicht benötigt

**Verifikation:**
```bash
grep -r "eval(" app/
```

**Erwartetes Ergebnis:** Keine `eval()` Aufrufe mehr (außer in Kommentaren)

---

### Schritt 3.2: Chat-Content Sanitization

**Problem:** `dangerouslySetInnerHTML` ohne Sanitization (XSS-Risiko)

**Betroffene Dateien:**
- `app/(employee)/employee/chat/components/MessageBubble.tsx` (Zeile 435)

**Aktion:**

1. Datei öffnen: `app/(employee)/employee/chat/components/MessageBubble.tsx`

2. DOMPurify importieren (bereits in package.json vorhanden):
```typescript
import DOMPurify from 'isomorphic-dompurify';
```

3. Content sanitizen:

**VORHER:**
```typescript
dangerouslySetInnerHTML={{ __html: formatChatText(message.content) }}
```

**NACHHER:**
```typescript
dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(formatChatText(message.content), {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  })
}}
```

**Verifikation:**
- Chat-Nachrichten werden korrekt angezeigt
- XSS-Angriffe werden blockiert (Test mit `<script>alert('XSS')</script>`)

---

### Schritt 3.3: Chat-Uploads Storage Rules

**Problem:** Chat-Uploads können von allen authentifizierten Usern gelesen werden

**Betroffene Dateien:**
- `storage.rules`

**Aktion:**

1. Datei öffnen: `storage.rules`

2. Chat-Uploads Rules erweitern:

**VORHER (Zeile 35-46):**
```javascript
match /chatUploads/{channelId}/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null &&
    request.resource.size < 10 * 1024 * 1024 &&
    request.resource.contentType.matches('image/.*|application/pdf');
  allow delete: if request.auth != null;
}
```

**NACHHER:**
```javascript
match /chatUploads/{channelId}/{fileName} {
  // Helper: Prüft ob User Channel-Teilnehmer ist
  function isChannelParticipant() {
    // Firestore-Dokument lesen (kostet 1 Read pro Request)
    let channel = firestore.get(/databases/$(database)/documents/chatChannels/$(channelId));
    return channel != null && 
           channel.data != null &&
           request.auth.uid in channel.data.participants;
  }
  
  // Read: Nur Channel-Teilnehmer
