'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppLogo } from '@/components/ui/AppLogo';
import { HeroWorkflowPreview } from '@/components/marketing/HeroWorkflowPreview';
import {
  alpha,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import {
  AccessTime,
  ArrowForward,
  CalendarMonth,
  CheckCircleOutline,
  Description,
  Draw,
  VerifiedUser,
  PhoneAndroid,
  ReceiptLong,
} from '@mui/icons-material';
import { useBrandingSettings } from '@/lib/hooks/useBrandingSettings';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '@/lib/theme';
import { colors, gradients, heroGradient } from '@/lib/design-tokens';

/** Getönter Icon-Kreis – dasselbe Muster wie im App-Inneren */
function TintedIcon({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: alpha(colors.brand, 0.1),
        color: 'primary.main',
      }}
    >
      {children}
    </Box>
  );
}

const FEATURES = [
  {
    icon: <CalendarMonth fontSize="small" />,
    title: 'Dienstplan & Einsätze',
    desc: 'Schichten anlegen, Pflegekräfte zuweisen oder einen Einsatz an ausgewählte Kräfte ausschreiben – wer zuerst annimmt, bekommt ihn. Regel „1 Einsatz pro Tag“ inklusive.',
  },
  {
    icon: <Description fontSize="small" />,
    title: 'Einsatzmitteilung nach § 11 AÜG',
    desc: 'Die Pflegekraft bestätigt oder lehnt jeden Einsatz digital mit Unterschrift ab; die Einsatzmitteilung wird als PDF abgelegt.',
  },
  {
    icon: <AccessTime fontSize="small" />,
    title: 'Zeiterfassung mit Arbeitszeitgesetz',
    desc: 'Beginn, Ende und Pause je Dienst erfassen. Pausen, 10-Stunden-Grenze und Ruhezeit werden bei Erfassung und Planung geprüft.',
  },
  {
    icon: <Draw fontSize="small" />,
    title: 'Bestätigung durch die Einrichtung',
    desc: 'Unterschrift der Einrichtung direkt vor Ort auf dem Gerät – oder Freigabe der Woche per Link, ganz ohne eigenes Konto.',
  },
  {
    icon: <ReceiptLong fontSize="small" />,
    title: 'Monatlicher Stundennachweis',
    desc: 'Der Papierbogen digital: Stunden, Pausen sowie Nacht-, Sonn- und Feiertagsstunden – unterschrieben als „erfasst“ und „anerkannt“, als PDF fürs Lohnbüro.',
  },
  {
    icon: <VerifiedUser fontSize="small" />,
    title: 'Prüfprotokoll & Datenschutz',
    desc: 'Jede Änderung an Zeiten, Nachweisen, Einsätzen und Stammdaten wird serverseitig protokolliert. Daten in der EU, Auskunft und Löschung nach DSGVO.',
  },
];

const STEPS = [
  {
    step: '1',
    title: 'Firma registrieren',
    desc: 'Firmenkonto anlegen und Einrichtungen mit Stationen und Ansprechpartnern hinterlegen.',
  },
  {
    step: '2',
    title: 'Team einladen',
    desc: 'Pflegekräfte per Einladungslink aufnehmen. Qualifikationen und Nachweise mit Ablaufdatum zentral pflegen.',
  },
  {
    step: '3',
    title: 'Planen, erfassen, nachweisen',
    desc: 'Einsätze planen, Zeiten erfassen und bestätigen lassen, Stundennachweis zum Monatsende unterschreiben.',
  },
];

const AUDIENCE = [
  {
    title: 'Für die Disposition',
    points: [
      'Offene Schichten und Besetzung auf einen Blick',
      'Zeiten freigeben oder mit Grund zurückgeben',
      'Nachweise der Pflegekräfte mit Ablaufdaten im Blick',
    ],
  },
  {
    title: 'Für Pflegekräfte',
    points: [
      'Dienstplan und Einsätze mobil auf dem eigenen Gerät',
      'Einsätze annehmen oder ablehnen – mit Unterschrift',
      'Zeiten erfassen und den Stundennachweis digital unterschreiben',
    ],
  },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const { canAccessAdminArea } = usePermissions();
  const { branding, isLoading: _brandingLoading } = useBrandingSettings();
  const router = useRouter();
  // Marketing-Seite ist immer hell – unabhängig von System-/App-Theme
  const lightTheme = useMemo(() => createAppTheme('light'), []);

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

  // Marketing-Seite ist immer hell: data-theme für die Dauer der Landing auf 'light'
  // pinnen (sonst scheint der dunkle Body-Hintergrund durch); beim Verlassen zurücksetzen.
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
    return () => {
      if (prev) root.setAttribute('data-theme', prev);
    };
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
    <ThemeProvider theme={lightTheme}>
      <Box
        sx={{
          minHeight: '100dvh',
          backgroundColor: '#fafaf9',
          backgroundImage: gradients.light.brandLight,
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100vh',
          color: 'text.primary',
        }}
      >
      {/* Kopfzeile: Logo links, Login rechts – ruhig und klein */}
      <Container maxWidth="lg">
        <Box
          component="header"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', height: 48 }}>
            <AppLogo
              branding={brandingData}
              showLogo={brandingData?.showLogo !== false}
              width={160}
              height={48}
              sx={{ width: 160, height: 48 }}
              showSkeleton={false}
              fallbackBgColor="transparent"
              priority
            />
          </Box>
          <Button component={Link} href="/anmelden" variant="text" size="small">
            Anmelden
          </Button>
        </Box>
      </Container>

      {/* Hero: Botschaft links, Produkt rechts */}
      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 6, md: 6 },
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 5fr) minmax(0, 7fr)' },
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: 34, md: 46 },
                lineHeight: 1.06,
                letterSpacing: '-0.035em',
                fontWeight: 700,
                mb: 2.5,
                maxWidth: 520,
              }}
            >
              Jede Schicht besetzt.
              <br />
              Jede Stunde belegt.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: 17.5, lineHeight: 1.6, maxWidth: 480, mb: 4 }}
            >
              Schichtklar plant Einsätze in Pflegeeinrichtungen, erfasst die Arbeitszeit vor Ort
              und lässt sie von der Einrichtung bestätigen – mit Einsatzmitteilung nach § 11 AÜG,
              Arbeitszeitgesetz-Prüfung und digitalem Stundennachweis.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 4 }}>
              <Button component={Link} href="/admin-registrieren" variant="contained" size="large">
                Firma registrieren
              </Button>
              <Button component={Link} href="/anmelden" size="large" variant="outlined">
                Anmelden
              </Button>
            </Stack>
            <Stack spacing={1} sx={{ color: 'text.secondary' }}>
              {['Daten und Server in der EU (Belgien)', 'Läuft im Browser – Smartphone, Tablet, Desktop'].map(item => (
                <Stack key={item} direction="row" spacing={1} alignItems="center">
                  <CheckCircleOutline sx={{ fontSize: 17, color: 'primary.main' }} />
                  <Typography sx={{ fontSize: 14 }}>{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <HeroWorkflowPreview />
          </Box>
        </Box>
      </Container>

      {/* Funktionen: ruhige Liste statt Kachelraster */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Typography variant="h2" sx={{ fontSize: { xs: 26, md: 32 }, letterSpacing: '-0.02em', mb: { xs: 3, md: 5 }, maxWidth: 560 }}>
          Von der offenen Schicht bis zum Stundennachweis
        </Typography>
        <Box
          sx={{
            display: 'grid',
            columnGap: 6,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {FEATURES.map(f => (
            <Box
              key={f.title}
              sx={{ display: 'flex', gap: 2, py: 3, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <TintedIcon>{f.icon}</TintedIcon>
              <Box>
                <Typography variant="h5" component="h3" sx={{ fontSize: 17, mb: 0.5 }}>
                  {f.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {f.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      {/* So funktioniert es */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Typography variant="h2" sx={{ textAlign: 'center', mb: 6 }}>
          In drei Schritten startklar
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          }}
        >
          {STEPS.map(s => (
            <Box key={s.step} sx={{ textAlign: 'center', px: 2 }}>
              <Box
                aria-hidden
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  backgroundColor: alpha(colors.brand, 0.1),
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: 17,
                }}
                className="tabular-nums"
              >
                {s.step}
              </Box>
              <Typography variant="h5" component="h3" sx={{ mb: 1 }}>
                {s.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {s.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Zielgruppen */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          {AUDIENCE.map(a => (
            <GlassCard key={a.title} hover={false} sx={{ p: 4, height: '100%' }}>
              <Typography variant="h4" component="h3" sx={{ mb: 3 }}>
                {a.title}
              </Typography>
              <Stack spacing={1.5}>
                {a.points.map(p => (
                  <Stack key={p} direction="row" spacing={1.5} alignItems="flex-start">
                    <CheckCircleOutline
                      sx={{ fontSize: 20, color: 'success.main', mt: '2px', flexShrink: 0 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {p}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </GlassCard>
          ))}
        </Box>
      </Container>

      {/* Abschluss-CTA */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            textAlign: 'center',
            borderRadius: 6,
            px: { xs: 3, md: 8 },
            py: { xs: 6, md: 9 },
            background: heroGradient,
            color: '#ffffff',
            boxShadow: '0 20px 44px -18px rgba(11,88,80,0.6)',
          }}
        >
          <Typography variant="h2" sx={{ mb: 2, color: '#ffffff' }}>
            Bereit für klare Schichten?
          </Typography>
          <Typography
            variant="body1"
            sx={{ maxWidth: 560, mx: 'auto', mb: 4, color: 'rgba(255,255,255,0.9)' }}
          >
            Registrieren Sie Ihre Firma und planen Sie den ersten Einsatz noch heute.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/admin-registrieren"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                backgroundColor: '#ffffff',
                color: colors.brandDark,
                boxShadow: '0 10px 22px -10px rgba(0,0,0,0.4)',
                '&:hover': { backgroundColor: '#f5f5f4' },
              }}
            >
              Firma registrieren
            </Button>
            <Button
              component={Link}
              href="/anmelden"
              size="large"
              variant="text"
              sx={{ color: '#ffffff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' } }}
            >
              Ich habe bereits ein Konto
            </Button>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{ mt: 3, color: 'rgba(255,255,255,0.85)' }}
          >
            <PhoneAndroid sx={{ fontSize: 16 }} />
            <Typography variant="caption">
              Läuft im Browser – auf Smartphone, Tablet und Desktop
            </Typography>
          </Stack>
        </Box>
      </Container>

      {/* Footer */}
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: 3,
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

      </Box>
    </ThemeProvider>
  );
}
