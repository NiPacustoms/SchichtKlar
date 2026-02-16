'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppLogo } from '@/components/ui/AppLogo';
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  useScrollTrigger,
  Zoom,
  Fab,
} from '@mui/material';
import { LoadingSpinner, InlineSpinner } from '@/components/ui/LoadingSpinner';
import {
  ArrowForward,
  KeyboardArrowUp,
  People,
  Assessment,
  Security,
  PhoneAndroid,
  Support,
} from '@mui/icons-material';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';

function ScrollToTop() {
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 120 });

  return (
    <Zoom in={trigger}>
      <Fab
        color="primary"
        size="medium"
        aria-label="scroll back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000 }}
      >
        <KeyboardArrowUp />
      </Fab>
    </Zoom>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const { branding, isLoading: brandingLoading } = useBrandingSettings();
  const router = useRouter();

  // Fallback für branding, falls es undefined ist
  const brandingData = branding || {
    companyName: 'JobFlow',
    companyLogo: undefined,
    showLogo: false,
  };

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin' || user.role === 'dispatcher') router.push('/admin/uebersicht');
      else if (user.role === 'nurse') router.push('/employee/arbeitsplatz');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner message="Lade..." variant="fullscreen" />;
  }

  if (user) {
    return <LoadingSpinner message="Weiterleitung..." variant="fullscreen" />;
  }

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 10, md: 16 },
          pb: 0,
        }}
      >
        {/* zentriertes, großes Logo ohne Layout-Verschiebung */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 8, md: 12 },
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
          }}
        >
          <AppLogo
            branding={brandingData}
            showLogo={brandingData?.showLogo !== false}
            width={320}
            height={320}
            sx={{ width: { xs: 240, md: 320 }, height: { xs: 240, md: 320 } }}
            showSkeleton={false}
            fallbackBgColor="transparent"
          />
        </Box>

        <Container maxWidth="xl" sx={{ maxWidth: '1280px', position: 'relative', zIndex: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 6,
              alignItems: 'center',
              justifyItems: 'center',
            }}
          >
            <Box sx={{ mt: { xs: 16, md: 24 }, textAlign: 'center', maxWidth: 760 }}>
              <Typography
                variant="h2"
                sx={{ fontWeight: 800, lineHeight: 1.1, mb: 2, textAlign: 'center' }}
              >
                Personalplanung im Gesundheitswesen - einfach. sicher. schnell.
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ mb: 4, textAlign: 'center' }}
              >
                Von Schichtplanung bis Auswertung - alles in einer modernen App, die zu Ihrem
                Workflow passt.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  component={Link}
                  href="/admin-registrieren"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                >
                  Firma registrieren
                </Button>
                <Button component={Link} href="/anmelden" size="large" variant="outlined">
                  Login
                </Button>
              </Stack>
            </Box>
            {/* rechte Spalte entfernt, um weißen Balken zu vermeiden */}
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Container
        maxWidth="xl"
        sx={{ maxWidth: '1280px', pt: { xs: 16, md: 24 }, pb: { xs: 8, md: 12 } }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
          }}
        >
          {[
            {
              icon: <People />,
              title: 'Mitarbeiterverwaltung',
              desc: 'Profile, Qualifikationen und Nachweise sicher und zentral verwalten.',
            },
            {
              icon: <Assessment />,
              title: 'Berichte & KPIs',
              desc: 'Transparente Leistungskennzahlen und Exportfunktionen für Controlling.',
            },
            {
              icon: <Security />,
              title: 'Sicherheit & DSGVO',
              desc: 'Verschlüsselung, Rollen & Rechte, DSGVO-konforme Datenhaltung.',
            },
            {
              icon: <PhoneAndroid />,
              title: 'Mobile ready',
              desc: 'Auf allen Geräten nutzbar - von der Station bis unterwegs.',
            },
            {
              icon: <Support />,
              title: 'Support, wenn er gebraucht wird',
              desc: 'Begleitung bei Einführung, Migration und laufendem Betrieb.',
            },
          ].map((f, i) => (
            <GlassCard
              sx={{
                p: 3,
                height: '100%',
                transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.02)',
                  boxShadow: theme => theme.shadows[6],
                  borderColor: theme =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                },
              }}
              key={i}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box color="primary.main">{f.icon}</Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {f.desc}
                  </Typography>
                </Box>
              </Stack>
            </GlassCard>
          ))}
        </Box>
      </Container>
      {/* Footer */}
      <Container maxWidth="xl" sx={{ maxWidth: '1280px', py: 6 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} JobFlow
          </Typography>
          <Stack direction="row" spacing={3}>
            <Button component={Link} href="/recht/impressum" color="inherit" size="small">
              Impressum
            </Button>
            <Button component={Link} href="/recht/datenschutz" color="inherit" size="small">
              Datenschutz
            </Button>
          </Stack>
        </Box>
      </Container>

      <ScrollToTop />
    </Box>
  );
}
