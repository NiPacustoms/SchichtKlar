import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';

export default function NotFound() {
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
        Seite nicht gefunden
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
        Die angeforderte Seite existiert nicht oder wurde verschoben. Bitte prüfen Sie die URL oder
        kehren Sie zur Startseite zurück.
      </Typography>
      <Button component={Link} href="/" variant="contained" sx={{ mt: 2 }}>
        Zur Startseite
      </Button>
    </Box>
  );
}
