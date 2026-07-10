'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
import {
  ArrowForward,
  KeyboardArrowUp,
  People,
  Assessment,
  Security,
  PhoneAndroid,
  Schedule,
} from '@mui/icons-material';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';

function ScrollToTop() {
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 120 });

  return (
    <Zoom in={trigger}>
      <Fab
        color="primary"
        size="medium"
        aria-label="Nach oben scrollen"
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
  const { canAccessAdminArea } = usePermissions();
  const { branding, isLoading: _brandingLoading } = useBrandingSettings();
  const router = useRouter();
  const featuresRef = useRef<HTMLDivElement>(null);
  const [featuresInView, setFeaturesInView] = useState(false);

  // Fallback für branding, falls es undefined ist
  const brandingData = branding || {
    companyName: 'Schichtklar',
    companyLogo: undefined,
    showLogo: false,
  };

  useEffect(() => {
    if (!loading && user) {
      if (canAccessAdminArea) router.push('/admin/uebersicht');
      else if (user.role === 'nurse') router.push('/employee/arbeitsplatz');
    }
  }, [user, loading, router, canAccessAdminArea]);

  useEffect(() => {
    const el = featuresRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setFeaturesInView(true);
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Minimales Loading/Weiterleitung ohne LoadingSpinner (vermeidet Absturz durch Branding/Theme)
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          gap: 2,
        }}
      >
        <Typography variant="h6">Schichtklar wird geladen…</Typography>
        <Button component={Link} href="/anmelden" variant="outlined">
          Zur Anmeldung
        </Button>
      </Box>
    );
  }

  if (user) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          gap: 2,
        }}
      >
        <Typography variant="h6">Weiterleitung…</Typography>
        <Button
          component={Link}
          href={canAccessAdminArea ? '/admin/uebersicht' : '/employee/arbeitsplatz'}
          variant="contained"
        >
          Zum Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero mit Motion Graphics */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 10, md: 16 },
          pb: 0,
        }}
      >
        {/* Animierter Hintergrund: schwebende Formen (Brand-Farben) */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <Box
            className="landing-blob"
            sx={{
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: (t) =>
                `radial-gradient(circle, ${t.palette.primary.main}08 0%, transparent 70%)`,
              top: '10%',
              left: '5%',
              animationDelay: '0s',
            }}
          />
          <Box
            className="landing-blob-slow"
            sx={{
              position: 'absolute',
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: (t) =>
                `radial-gradient(circle, ${t.palette.secondary?.main || '#e8aa42'}0c 0%, transparent 65%)`,
              top: '50%',
              right: '8%',
              animationDelay: '-4s',
            }}
          />
          <Box
            className="landing-blob"
            sx={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: (t) =>
                `radial-gradient(circle, ${t.palette.primary.main}0a 0%, transparent 60%)`,
              bottom: '15%',
              left: '25%',
              animationDelay: '-8s',
            }}
          />
          <Box
            className="landing-blob-slow"
            sx={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: (t) =>
                `radial-gradient(circle, ${t.palette.secondary?.main || '#e8aa42'}08 0%, transparent 55%)`,
              top: '25%',
              right: '25%',
              animationDelay: '-2s',
            }}
          />
        </Box>

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
                  key="admin-registrieren"
                  component={Link}
                  href="/admin-registrieren"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                >
                  Firma registrieren
                </Button>
                <Button key="login" component={Link} href="/anmelden" size="large" variant="outlined">
                  Login
                </Button>
              </Stack>
            </Box>
            {/* rechte Spalte entfernt, um weißen Balken zu vermeiden */}
          </Box>
        </Container>
      </Box>

      {/* Features mit Scroll-Animation */}
      <Container
        maxWidth="xl"
        sx={{ maxWidth: '1280px', pt: { xs: 16, md: 24 }, pb: { xs: 8, md: 12 } }}
      >
        <Box
          ref={featuresRef}
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
              desc: 'Profile, Qualifikationen und Nachweise zentral verwalten.',
            },
            {
              icon: <Schedule />,
              title: 'Schichtplanung & Einsätze',
              desc: 'Dienstplan erstellen, Schichten anlegen und Einsätze zuweisen.',
            },
            {
              icon: <Assessment />,
              title: 'Berichte & Auswertungen',
              desc: 'KPIs, Berichte und Export für Stunden und Auslastung.',
            },
            {
              icon: <Security />,
              title: 'Sicherheit & DSGVO',
              desc: 'Rollen & Rechte, Datenexport und -löschung, Datenschutz-Seiten.',
            },
            {
              icon: <PhoneAndroid />,
              title: 'Mobil nutzbar',
              desc: 'Responsive Web-App – auf allen Geräten nutzbar.',
            },
          ].map((f, index) => (
            <GlassCard
              key={f.title}
              sx={{
                p: 3,
                height: '100%',
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? 'translateY(0)' : 'translateY(24px)',
                ...(featuresInView && {
                  animation: 'landing-fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  animationDelay: `${index * 80}ms`,
                }),
                transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.02)',
                  boxShadow: theme => theme.shadows[6],
                  borderColor: theme =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                },
              }}
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
            © {new Date().getFullYear()} Schichtklar
          </Typography>
          <Stack direction="row" spacing={3}>
            <Button key="impressum" component={Link} href="/recht/impressum" color="inherit" size="small">
              Impressum
            </Button>
            <Button key="datenschutz" component={Link} href="/recht/datenschutz" color="inherit" size="small">
              Datenschutz
            </Button>
          </Stack>
        </Box>
      </Container>

      <ScrollToTop />
    </Box>
  );
}
