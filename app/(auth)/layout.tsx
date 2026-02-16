'use client';

import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import { AppLogo } from '@/components/ui/AppLogo';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader = pathname === '/anmelden';
  const { branding } = useBrandingSettings();

  // Fallback für branding, falls es undefined ist
  // showLogo defaults to true so logo is shown by default
  const brandingData = branding || {
    companyName: 'JobFlow',
    companyLogo: undefined,
    showLogo: true,
  };

  return (
    <Box className="gradient-background">
      {/* Minimal Header für Auth-Seiten (auf /login ausgeblendet) */}
      {!hideHeader && (
        <Box
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
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
      {children}
    </Box>
  );
}
