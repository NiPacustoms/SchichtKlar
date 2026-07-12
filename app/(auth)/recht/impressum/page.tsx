'use client';

import { Box, Typography, Paper, Container, Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logging';
import { getLegalInfo, type LegalInfo } from '@/lib/config/legal';

export default function ImprintPage() {
  const [legalInfo, setLegalInfo] = useState<LegalInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const info = getLegalInfo();
      setLegalInfo(info);
    } catch (error) {
      logger.error(
        'Fehler beim Laden der Impressum-Daten',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper className="glass" sx={{ p: 4 }}>
          <Typography>Lade Impressum...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!legalInfo) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper className="glass" sx={{ p: 4 }}>
          <Alert severity="error">Fehler beim Laden der Impressum-Daten.</Alert>
        </Paper>
      </Container>
    );
  }

  // Warnung anzeigen, wenn noch Mock-Daten verwendet werden
  const isMockData =
    legalInfo.companyName === 'Musterfirma GmbH' && legalInfo.address.street === 'Musterstraße 123';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper className="glass" sx={{ p: 4 }}>
        {isMockData && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Hinweis:</strong> Diese Seite enthält noch Platzhalter-Daten. Bitte ersetzen Sie
            diese vor dem Produktions-Release durch echte Firmendaten (siehe{' '}
            <code>lib/config/legal.ts</code> oder ENV-Variablen).
          </Alert>
        )}

        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
          Impressum
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Anbieter
          </Typography>
          <Typography variant="body1">
            {legalInfo.companyName} {legalInfo.legalForm && `(${legalInfo.legalForm})`}
            <br />
            {legalInfo.address.street}
            <br />
            {legalInfo.address.zipCode} {legalInfo.address.city}
            <br />
            {legalInfo.address.country}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Kontakt
          </Typography>
          <Typography variant="body1">
            E-Mail: <a href={`mailto:${legalInfo.contact.email}`}>{legalInfo.contact.email}</a>
            <br />
            {legalInfo.contact.phone && (
              <>
                Telefon: {legalInfo.contact.phone}
                <br />
              </>
            )}
            {legalInfo.contact.fax && (
              <>
                Fax: {legalInfo.contact.fax}
                <br />
              </>
            )}
            {legalInfo.contact.website && (
              <>
                Website:{' '}
                <a href={legalInfo.contact.website} target="_blank" rel="noopener noreferrer">
                  {legalInfo.contact.website}
                </a>
              </>
            )}
          </Typography>
        </Box>

        {legalInfo.registration && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Registereintrag
            </Typography>
            <Typography variant="body1">
              {legalInfo.registration.registerType}: {legalInfo.registration.registerNumber}
              <br />
              Registergericht: {legalInfo.registration.registerCourt}
              <br />
              {legalInfo.registration.vatId && <>USt-IdNr.: {legalInfo.registration.vatId}</>}
            </Typography>
          </Box>
        )}

        {legalInfo.responsiblePerson && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Verantwortlich für den Inhalt
            </Typography>
            <Typography variant="body1">
              {legalInfo.responsiblePerson.name}
              <br />
              {legalInfo.responsiblePerson.position}
            </Typography>
          </Box>
        )}

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Haftungsausschluss
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Die Inhalte dieser Website werden mit größtmöglicher Sorgfalt erstellt. Der Anbieter
            kann jedoch keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der
            bereitgestellten Inhalte übernehmen.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
