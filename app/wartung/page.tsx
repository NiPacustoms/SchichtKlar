import { Box, Typography } from '@mui/material';

export default function MaintenancePage() {
  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        px: 3,
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
  );
}
