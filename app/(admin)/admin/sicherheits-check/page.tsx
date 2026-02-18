'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Typography, Alert } from '@mui/material';

export default function AdminSecureSetupPage() {
  const { firebaseUser } = useAuth();
  const hasMfa = !!(
    firebaseUser &&
    'multiFactor' in firebaseUser &&
    (firebaseUser as { multiFactor?: { enrolledFactors?: unknown[] } }).multiFactor?.enrolledFactors
      ?.length
  );

  const goToAccountSecurity = () => {
    // Weiterleitung zum Profil (Sicherheit), wo 2FA eingerichtet werden kann.
    window.location.href = '/employee/profil';
  };

  return (
    <PageContainer maxWidth="narrow">
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Sicherheitseinrichtung erforderlich
      </Typography>
      {!hasMfa ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Für Administratoren ist die Zwei-Faktor-Authentifizierung (2FA) erforderlich.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 2 }}>
          2FA ist bereits aktiviert. Du kannst zum Admin-Bereich zurückkehren.
        </Alert>
      )}
      <Typography variant="body1" sx={{ mb: 3 }}>
        Bitte aktiviere 2FA in deinen Kontoeinstellungen. Du wirst danach automatisch zum
        Admin-Bereich weitergeleitet.
      </Typography>
      <Button variant="contained" onClick={goToAccountSecurity}>
        2FA jetzt einrichten
      </Button>
    </PageContainer>
  );
}
