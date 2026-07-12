'use client';

import { Box } from '@mui/material';
import { AppLogo } from '@/components/ui/AppLogo';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';
import { BackButton } from '@/components/layout/BackButton';

export function AuthLayoutHeader({ isLoginPage }: { isLoginPage: boolean }) {
  const { branding } = useBrandingSettings();
  const brandingData = branding || {
    companyName: 'Schichtklar',
    companyLogo: undefined,
    showLogo: true,
  };

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        position: 'relative',
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <BackButton
          href="/"
          label="Zurück zur Startseite"
          size="small"
          variant="outlined"
        />
      </Box>
      {!isLoginPage && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <AppLogo
            branding={brandingData}
            showLogo={brandingData?.showLogo !== false}
            width={120}
            height={40}
            sx={{ height: '40px', width: 'auto' }}
            showSkeleton={false}
            fallbackBgColor="transparent"
          />
        </Box>
      )}
      <Box sx={{ width: 160, flexShrink: 0 }} aria-hidden />
    </Box>
  );
}
