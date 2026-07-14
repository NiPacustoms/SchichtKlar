'use client';

import { Box, Typography, Paper, Container, Alert, Divider } from '@mui/material';
import { useEffect, useState } from 'react';
import { getLegalInfo, type LegalInfo } from '@/lib/config/legal';

/**
 * AGB – ENTWURFS-GERÜST.
 * Bewusst KEIN verbindlicher Rechtstext: nur Struktur + Platzhalter, die durch
 * eine Rechtsberatung zu füllen/prüfen sind. Der Warnhinweis oben ist Pflicht,
 * solange die Inhalte nicht juristisch freigegeben sind.
 */
export default function AgbPage() {
  const [legal, setLegal] = useState<LegalInfo | null>(null);
  useEffect(() => {
    try {
      setLegal(getLegalInfo());
    } catch {
      /* ignore */
    }
  }, []);

  const sections: { title: string; body: string }[] = [
    { title: '1. Geltungsbereich', body: '[Platzhalter] Für welche Leistungen/Verträge gelten diese Bedingungen, gegenüber wem (Unternehmer/Verbraucher).' },
    { title: '2. Vertragsgegenstand & Leistungen', body: '[Platzhalter] Beschreibung der bereitgestellten Software/Dienstleistung (Dienstplanung, Zeiterfassung) und des Leistungsumfangs.' },
    { title: '3. Vertragsschluss', body: '[Platzhalter] Zustandekommen des Vertrags, Registrierung, Angebot/Annahme.' },
    { title: '4. Pflichten der Nutzer', body: '[Platzhalter] Zulässige Nutzung, Zugangsdaten, Verantwortung für eingegebene Daten.' },
    { title: '5. Verfügbarkeit & Wartung', body: '[Platzhalter] Verfügbarkeitszusagen, Wartungsfenster, Support.' },
    { title: '6. Vergütung & Zahlungsbedingungen', body: '[Platzhalter] Preise, Abrechnung, Fälligkeit, Verzug (sofern zutreffend).' },
    { title: '7. Laufzeit & Kündigung', body: '[Platzhalter] Vertragslaufzeit, Kündigungsfristen, außerordentliche Kündigung.' },
    { title: '8. Haftung', body: '[Platzhalter] Haftungsumfang und -beschränkungen nach geltendem Recht.' },
    { title: '9. Datenschutz', body: '[Platzhalter] Verweis auf die Datenschutzerklärung und ggf. den Auftragsverarbeitungsvertrag (AVV).' },
    { title: '10. Schlussbestimmungen', body: '[Platzhalter] Anwendbares Recht, Gerichtsstand, Salvatorische Klausel, Änderungen der AGB.' },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper className="glass" sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Allgemeine Geschäftsbedingungen (AGB)
        </Typography>
        <Alert severity="warning" sx={{ my: 2 }}>
          <strong>Entwurf – noch nicht rechtsverbindlich.</strong> Dieses Dokument ist ein
          Struktur-Gerüst mit Platzhaltern und muss vor Veröffentlichung durch eine
          Rechtsberatung erstellt bzw. geprüft werden.
        </Alert>
        {legal?.companyName && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Anbieter: {legal.companyName}
            {legal.address?.street ? `, ${legal.address.street}` : ''}
            {legal.address?.zipCode || legal.address?.city
              ? `, ${legal.address?.zipCode ?? ''} ${legal.address?.city ?? ''}`
              : ''}
          </Typography>
        )}
        <Divider sx={{ mb: 2 }} />
        {sections.map(s => (
          <Box key={s.title} sx={{ mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {s.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {s.body}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Container>
  );
}
