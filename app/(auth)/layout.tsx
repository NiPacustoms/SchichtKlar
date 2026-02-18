'use client';

import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import { AppLogo } from '@/components/ui/AppLogo';
import { BackButton } from '@/components/layout/BackButton';
import dynamic from 'next/dynamic';

// useBrandingSettings nutzt useQuery – dynamischer Import verhindert SSR-Probleme im Layout
const AuthLayoutHeader = dynamic(
  () =>
    import('@/components/auth/AuthLayoutHeader').then((m) => m.AuthLayoutHeader),
  { ssr: false }
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/anmelden';

  return (
    <Box className="gradient-background">
      <AuthLayoutHeader isLoginPage={isLoginPage} />
      {children}
    </Box>
  );
}
