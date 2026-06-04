'use client';

import { useEffect, useState } from 'react';
import { Alert, Collapse } from '@mui/material';
import { WifiOff } from '@mui/icons-material';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <Collapse in={offline} unmountOnExit>
      <Alert
        severity="warning"
        icon={<WifiOff fontSize="inherit" />}
        sx={{
          borderRadius: 0,
          py: 0.5,
          fontSize: '0.8rem',
          '& .MuiAlert-message': { py: 0.25 },
        }}
      >
        Offline – Änderungen werden gespeichert und beim nächsten Verbindungsaufbau synchronisiert.
      </Alert>
    </Collapse>
  );
}
