import { Box, Typography } from '@mui/material';
import { PageContainer } from '@/components/layout/PageContainer';

export default function MaintenancePage() {
  return (
    <PageContainer maxWidth="narrow">
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          Wartungsmodus aktiv
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
          Wir führen gerade ein geplantes Update durch. Bitte versuchen Sie es in ein paar Minuten
          erneut.
        </Typography>
      </Box>
    </PageContainer>
  );
}
