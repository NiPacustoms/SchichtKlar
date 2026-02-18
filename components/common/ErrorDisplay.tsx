'use client';
import { Alert, AlertTitle, Button, Stack, Typography } from '@mui/material';
export default function ErrorDisplay({ title = 'Fehler', message = 'Etwas ist schiefgelaufen.', onRetry }:
  { title?: string; message?: string; onRetry?: () => void; }) {
  return (
    <Alert 
      severity="error" 
      sx={{ 
        my: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'error.main',
      }}
    >
      <AlertTitle sx={{ fontWeight: 700, fontSize: '15px' }}>{title}</AlertTitle>
      <Typography variant="body2" sx={{ fontSize: '14px', lineHeight: 1.6 }}>
        {message}
      </Typography>
      {onRetry && (
        <Stack direction="row" sx={{ mt: 2 }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={onRetry}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              borderWidth: 1.5,
            }}
          >
            Erneut versuchen
          </Button>
        </Stack>
      )}
    </Alert>
  );
}


