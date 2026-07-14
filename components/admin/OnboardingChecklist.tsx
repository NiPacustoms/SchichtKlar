'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Close,
  Business,
  People,
  EventAvailable,
} from '@mui/icons-material';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { facilityService } from '@/lib/services/facilities';
import { userService } from '@/lib/services/users';

const DISMISS_KEY = 'schichtklar_onboarding_dismissed';

type Step = {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  done: boolean;
};

/**
 * „Erste Schritte" für frisch registrierte Firmen. Prüft live, ob eine
 * Einrichtung angelegt und Team eingeladen wurde, und führt durch die
 * Einrichtung. Blendet sich automatisch aus, sobald die Kern-Schritte erledigt
 * sind – oder wenn der Admin sie schließt.
 */
export function OnboardingChecklist() {
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  });

  const { data: facilities } = useQuery({
    queryKey: ['facilities', companyId],
    queryFn: () => facilityService.getAll(companyId),
    enabled: !!companyId,
  });

  const { data: staffResponse } = useQuery({
    queryKey: ['users', 'onboarding'],
    queryFn: () => userService.getAll(),
    enabled: !!companyId,
  });

  const facilityCount = facilities?.length ?? 0;
  const staffCount = staffResponse?.data?.length ?? 0;

  const steps: Step[] = useMemo(
    () => [
      {
        label: 'Firma angelegt',
        description: 'Ihr Unternehmen ist eingerichtet.',
        href: '/admin/einstellungen',
        icon: <CheckCircle color="success" />,
        done: true,
      },
      {
        label: 'Erste Einrichtung anlegen',
        description: 'Legen Sie Ihren ersten Standort / Ihre erste Einrichtung an.',
        href: '/admin/einrichtungen',
        icon: <Business />,
        done: facilityCount > 0,
      },
      {
        label: 'Team einladen',
        description: 'Laden Sie Ihre Mitarbeiterinnen und Mitarbeiter per E-Mail ein.',
        href: '/admin/mitarbeiter',
        icon: <People />,
        done: staffCount > 1,
      },
      {
        label: 'Ersten Einsatz planen',
        description: 'Erstellen Sie Ihren ersten Dienst / Einsatz.',
        href: '/admin/einsaetze/new',
        icon: <EventAvailable />,
        done: false,
      },
    ],
    [facilityCount, staffCount]
  );

  // Kern-Setup gilt als abgeschlossen, wenn Einrichtung + Team stehen.
  const coreComplete = facilityCount > 0 && staffCount > 1;
  const completedCount = steps.filter(s => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') window.localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  if (!companyId || dismissed || coreComplete) return null;

  // Nächster offener Schritt (für den Haupt-CTA)
  const nextStep = steps.find(s => !s.done);

  return (
    <GlassCard sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Erste Schritte
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Richten Sie Ihr Konto in wenigen Minuten vollständig ein.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" label={`${completedCount}/${steps.length}`} color="primary" variant="outlined" />
          <IconButton size="small" onClick={handleDismiss} aria-label="Erste Schritte ausblenden">
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ my: 2, height: 8, borderRadius: 999 }}
      />

      <Stack spacing={1}>
        {steps.map(step => (
          <Box
            key={step.label}
            component={step.done ? 'div' : Link}
            href={step.done ? undefined : step.href}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.25,
              borderRadius: 2,
              textDecoration: 'none',
              color: 'text.primary',
              bgcolor: step.done ? 'transparent' : 'action.hover',
              opacity: step.done ? 0.6 : 1,
              transition: 'background-color .15s',
              '&:hover': step.done ? {} : { bgcolor: 'action.selected' },
            }}
          >
            {step.done ? <CheckCircle color="success" /> : <RadioButtonUnchecked color="disabled" />}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, textDecoration: step.done ? 'line-through' : 'none' }}
              >
                {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {step.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>

      {nextStep && (
        <Button
          component={Link}
          href={nextStep.href}
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
        >
          Weiter: {nextStep.label}
        </Button>
      )}
    </GlassCard>
  );
}
