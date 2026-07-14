'use client';

import { Box, Typography, Paper, Container, Alert, Divider } from '@mui/material';
import { useEffect, useState } from 'react';
import { getLegalInfo, type LegalInfo } from '@/lib/config/legal';

/**
 * AVV (Auftragsverarbeitungsvertrag, Art. 28 DSGVO) – ENTWURFS-GERÜST.
 * Verbindlicher Vertrag zwischen Verantwortlichem (Kunde/Einrichtung) und
 * Auftragsverarbeiter (Betreiber). Hier nur Struktur + Platzhalter; Inhalte
 * durch Rechtsberatung erstellen/prüfen. Warnhinweis ist Pflicht.
 */
export default function AvvPage() {
  const [legal, setLegal] = useState<LegalInfo | null>(null);
  useEffect(() => {
    try {
      setLegal(getLegalInfo());
    } catch {
      /* ignore */
    }
  }, []);

  const sections: { title: string; body: string }[] = [
    { title: '1. Gegenstand & Dauer der Verarbeitung', body: '[Platzhalter] Umfang, Art und Zweck der Verarbeitung im Auftrag; Laufzeit entsprechend dem Hauptvertrag.' },
    { title: '2. Art der personenbezogenen Daten', body: '[Platzhalter] z. B. Stammdaten der Mitarbeitenden, Arbeitszeiten, Einsatzdaten, Kontaktdaten.' },
    { title: '3. Kategorien betroffener Personen', body: '[Platzhalter] z. B. Mitarbeitende/Pflegekräfte des Verantwortlichen.' },
    { title: '4. Pflichten des Auftragsverarbeiters', body: '[Platzhalter] Weisungsgebundenheit, Vertraulichkeit, Unterstützung des Verantwortlichen, Meldepflichten.' },
    { title: '5. Technisch-organisatorische Maßnahmen (TOM)', body: '[Platzhalter] Zugriffskontrolle, Verschlüsselung, Mandantentrennung, Protokollierung, Backup – konkret beschreiben (Art. 32 DSGVO).' },
    { title: '6. Unterauftragsverarbeiter', body: '[Platzhalter] Liste eingesetzter Dienstleister (z. B. Hosting/Firebase), Genehmigungsverfahren.' },
    { title: '7. Betroffenenrechte', body: '[Platzhalter] Unterstützung bei Auskunft, Berichtigung, Löschung, Datenübertragbarkeit.' },
    { title: '8. Löschung & Rückgabe', body: '[Platzhalter] Vorgehen nach Vertragsende, Aufbewahrungsfristen (z. B. GoBD).' },
    { title: '9. Nachweise & Kontrollrechte', body: '[Platzhalter] Auditrechte des Verantwortlichen, Nachweise der Einhaltung.' },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper className="glass" sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Auftragsverarbeitungsvertrag (AVV)
        </Typography>
        <Alert severity="warning" sx={{ my: 2 }}>
          <strong>Entwurf – noch nicht rechtsverbindlich.</strong> Struktur-Gerüst nach Art. 28
          DSGVO mit Platzhaltern. Vor Abschluss mit Kunden durch eine Rechtsberatung erstellen bzw.
          prüfen und die tatsächlichen technisch-organisatorischen Maßnahmen eintragen.
        </Alert>
        {legal?.companyName && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Auftragsverarbeiter: {legal.companyName}
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
