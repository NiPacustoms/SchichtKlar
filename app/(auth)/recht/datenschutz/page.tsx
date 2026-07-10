'use client';

import { Box, Typography, Paper, Container, Alert, Link, Divider } from '@mui/material';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logging';
import { getLegalInfo } from '@/lib/config/legal';

export default function PrivacyPage() {
  const [legalInfo, setLegalInfo] = useState<{
    companyName?: string;
    address?: {
      street?: string;
      zipCode?: string;
      city?: string;
      country?: string;
    };
    contact?: {
      email?: string;
      phone?: string;
    };
  } | null>(null);

  useEffect(() => {
    try {
      const info = getLegalInfo();
      setLegalInfo(info);
    } catch (error) {
      logger.error(
        'Fehler beim Laden der Legal-Info',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }, []);

  const companyName = legalInfo?.companyName || 'Schichtklar';
  const companyEmail = legalInfo?.contact?.email || 'info@jobflow.de';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper className="glass" sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
          Datenschutzerklärung
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Stand:</strong> {new Date().toLocaleDateString('de-DE')}
          <br />
          Diese Datenschutzerklärung informiert Sie über die Verarbeitung personenbezogener Daten
          bei der Nutzung unserer Anwendung.
        </Alert>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            1. Verantwortlicher
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Verantwortlich für die Datenverarbeitung ist:
          </Typography>
          <Typography variant="body1" component="div" sx={{ pl: 2, mb: 2 }}>
            {companyName}
            <br />
            {legalInfo?.address?.street && (
              <>
                {legalInfo.address.street}
                <br />
              </>
            )}
            {legalInfo?.address?.zipCode && legalInfo?.address?.city && (
              <>
                {legalInfo.address.zipCode} {legalInfo.address.city}
                <br />
              </>
            )}
            {legalInfo?.address?.country && <>{legalInfo.address.country}</>}
          </Typography>
          <Typography variant="body1">
            E-Mail: <Link href={`mailto:${companyEmail}`}>{companyEmail}</Link>
            {legalInfo?.contact?.phone && <> | Telefon: {legalInfo.contact.phone}</>}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            2. Erhebung und Speicherung personenbezogener Daten
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
            2.1 Bei der Registrierung und Nutzung der Anwendung
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Bei der Registrierung und Nutzung unserer Anwendung erheben und speichern wir folgende
            Daten:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">
                E-Mail-Adresse (für Authentifizierung und Kommunikation)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">Name/Anzeigename</Typography>
            </li>
            <li>
              <Typography variant="body2">Rolle (Admin, Mitarbeiter)</Typography>
            </li>
            <li>
              <Typography variant="body2">Firmenzugehörigkeit (companyId)</Typography>
            </li>
            <li>
              <Typography variant="body2">Telefonnummer (optional)</Typography>
            </li>
            <li>
              <Typography variant="body2">
                Qualifikationen und Dokumente (für Mitarbeiter)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Zeiterfassungsdaten (Arbeitszeiten, Pausen)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">Schichtzuweisungen und Einsatzdaten</Typography>
            </li>
            <li>
              <Typography variant="body2">
                Unterschriften (für Zeiterfassung und Einsatzbestätigungen)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">Abrechnungsrelevante Daten (für Mitarbeiter)</Typography>
            </li>
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
            2.2 Automatisch erfasste Daten
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Bei jedem Besuch unserer Anwendung werden automatisch folgende Daten erfasst:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">IP-Adresse</Typography>
            </li>
            <li>
              <Typography variant="body2">Browsertyp und -version</Typography>
            </li>
            <li>
              <Typography variant="body2">Betriebssystem</Typography>
            </li>
            <li>
              <Typography variant="body2">Datum und Uhrzeit des Zugriffs</Typography>
            </li>
            <li>
              <Typography variant="body2">Referrer-URL (die zuvor besuchte Seite)</Typography>
            </li>
            <li>
              <Typography variant="body2">Geräteinformationen (bei mobilen Geräten)</Typography>
            </li>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            3. Zweck der Datenverarbeitung
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Wir verarbeiten Ihre personenbezogenen Daten zu folgenden Zwecken:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">Bereitstellung und Verwaltung der Anwendung</Typography>
            </li>
            <li>
              <Typography variant="body2">
                Authentifizierung und Autorisierung von Benutzern
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Verwaltung von Mitarbeitern, Einrichtungen und Schichten
              </Typography>
            </li>
            <li>
              <Typography variant="body2">Zeiterfassung und Abrechnungsgrundlagen</Typography>
            </li>
            <li>
              <Typography variant="body2">Erstellung von Berichten und Dokumenten</Typography>
            </li>
            <li>
              <Typography variant="body2">
                Erfüllung gesetzlicher Aufbewahrungspflichten (z.B. GoBD)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Gewährleistung der Sicherheit und Verhinderung von Missbrauch
              </Typography>
            </li>
            <li>
              <Typography variant="body2">Versand von Benachrichtigungen (E-Mail, Push)</Typography>
            </li>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            4. Rechtsgrundlage der Datenverarbeitung
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Die Verarbeitung Ihrer personenbezogenen Daten erfolgt auf Grundlage folgender
            Rechtsgrundlagen:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>Art. 6 Abs. 1 lit. b DSGVO:</strong> Erfüllung eines Vertrags (Nutzung der
                Anwendung)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Art. 6 Abs. 1 lit. c DSGVO:</strong> Erfüllung rechtlicher Verpflichtungen
                (z.B. Aufbewahrungspflichten nach GoBD)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> Berechtigtes Interesse (Sicherheit,
                Betrugsprävention, Verbesserung der Anwendung)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Art. 6 Abs. 1 lit. a DSGVO:</strong> Einwilligung (bei optionalen Features
                wie Push-Benachrichtigungen)
              </Typography>
            </li>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            5. Verwendung von Firebase (Google Cloud)
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Diese Anwendung nutzt Firebase, einen Service von Google Ireland Limited (Gordon House,
            Barrow Street, Dublin 4, Irland), für folgende Zwecke:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>Firebase Authentication:</strong> Benutzerauthentifizierung und -verwaltung
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Cloud Firestore:</strong> Speicherung von Daten (Mitarbeiter, Schichten,
                Zeiterfassung, etc.)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Firebase Storage:</strong> Speicherung von Dateien (Dokumente,
                Unterschriften)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Firebase Cloud Messaging:</strong> Push-Benachrichtigungen
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Firebase Analytics:</strong> Analyse der Nutzung (optional, nur bei
                Einwilligung)
              </Typography>
            </li>
          </Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Die Daten werden in Rechenzentren der Google Cloud Platform gespeichert, die sich
            innerhalb der EU befinden (Standard-Region: europe-west3, Frankfurt am Main,
            Deutschland).
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Weitere Informationen zur Datenverarbeitung durch Firebase finden Sie in der
            <Link
              href="https://firebase.google.com/support/privacy"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ ml: 0.5 }}
            >
              Firebase Datenschutzerklärung
            </Link>{' '}
            und der
            <Link
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ ml: 0.5 }}
            >
              Google Datenschutzerklärung
            </Link>
            .
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            6. Weitergabe von Daten
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Wir geben Ihre personenbezogenen Daten nur in folgenden Fällen weiter:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">An Firebase/Google (siehe Abschnitt 5)</Typography>
            </li>
            <li>
              <Typography variant="body2">
                An autorisierte Mitarbeiter Ihrer Firma (innerhalb derselben companyId)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                An externe Dienstleister (z.B. E-Mail-Versand, Hosting), die als Auftragsverarbeiter
                tätig sind
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Wenn dies gesetzlich vorgeschrieben ist (z.B. an Behörden, Gerichte)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Bei Exporten an Drittdienste (z. B. Buchhaltung), wenn Sie diese nutzen
              </Typography>
            </li>
          </Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Eine Weitergabe an Dritte zu kommerziellen Zwecken erfolgt nicht.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            7. Speicherdauer
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies für die genannten
            Zwecke erforderlich ist:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>Account-Daten:</strong> Solange Ihr Account aktiv ist, danach 30 Tage
                (Löschung auf Anfrage möglich)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Zeiterfassungsdaten:</strong> Mindestens 10 Jahre (gesetzliche
                Aufbewahrungspflicht nach GoBD)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>GoBD-pflichtige Daten:</strong> Mindestens 10 Jahre (gesetzliche
                Aufbewahrungspflicht)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Dokumente:</strong> Bis zum Ablaufdatum oder bis zur Löschung durch den
                Benutzer
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Log-Daten:</strong> 90 Tage
              </Typography>
            </li>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            8. Ihre Rechte
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre
                gespeicherten Daten verlangen
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Sie können die Berichtigung
                unrichtiger Daten verlangen
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Löschungsrecht (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten
                verlangen (soweit gesetzlich zulässig)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Einschränkungsrecht (Art. 18 DSGVO):</strong> Sie können die Einschränkung
                der Verarbeitung verlangen
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in
                einem strukturierten Format erhalten
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung
                widersprechen (bei berechtigtem Interesse)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Sie können
                erteilte Einwilligungen jederzeit widerrufen
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Beschwerderecht (Art. 77 DSGVO):</strong> Sie können sich bei einer
                Aufsichtsbehörde beschweren
              </Typography>
            </li>
          </Box>
          <Typography variant="body2" sx={{ mb: 2, mt: 2 }}>
            Um Ihre Rechte auszuüben, kontaktieren Sie uns bitte unter:{' '}
            <Link href={`mailto:${companyEmail}`}>{companyEmail}</Link>
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            9. Datensicherheit
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten zu schützen:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">
                Verschlüsselung der Datenübertragung (HTTPS/TLS)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Verschlüsselung sensibler Daten (z.B. Bankdaten) in der Datenbank
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Authentifizierung und Autorisierung (Firebase Auth mit Rollen)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Firestore Security Rules (Zugriff nur für autorisierte Benutzer)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">Regelmäßige Sicherheitsupdates</Typography>
            </li>
            <li>
              <Typography variant="body2">
                Zugriffskontrollen (nur autorisierte Mitarbeiter)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">Backup-Systeme für Datenwiederherstellung</Typography>
            </li>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            10. Cookies und Tracking
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Diese Anwendung verwendet:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>Notwendige Cookies:</strong> Für die Funktionalität der Anwendung
                (Authentifizierung, Session-Management)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Firebase Analytics:</strong> Nur bei ausdrücklicher Einwilligung (optional)
              </Typography>
            </li>
          </Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Sie können Cookies in Ihren Browser-Einstellungen deaktivieren, dies kann jedoch die
            Funktionalität der Anwendung beeinträchtigen.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            11. Änderungen dieser Datenschutzerklärung
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
            Rechtslagen oder Änderungen unserer Dienste anzupassen. Die aktuelle Version ist
            jederzeit unter dieser URL abrufbar.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            12. Kontakt
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Bei Fragen zum Datenschutz können Sie uns jederzeit kontaktieren:
          </Typography>
          <Typography variant="body2">
            E-Mail: <Link href={`mailto:${companyEmail}`}>{companyEmail}</Link>
            {legalInfo?.contact?.phone && <> | Telefon: {legalInfo.contact.phone}</>}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
