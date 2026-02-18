'use client';

import { Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface BackButtonProps {
  /** Ziel-Route für den Zurück-Link. Wenn nicht gesetzt, wird router.back() verwendet. */
  href?: string;
  /** Button-Label (Standard: "Zurück") */
  label?: string;
  /** Nur Icon, ohne Text (z. B. für Header) */
  iconOnly?: boolean;
  /** Größe: small | medium */
  size?: 'small' | 'medium';
  /** Für use in PageHeader/Inline: variant "text", im Header oft "outlined" */
  variant?: 'text' | 'outlined';
}

/**
 * Einheitlicher Zurück-Button für die App.
 * – Mit href: Link zu einer bestimmten Seite (z. B. Liste).
 * – Ohne href: Browser-History zurück (router.back()).
 * Link umhüllt Button (component="span"), um removeChild/Hydration-Fehler mit Next.js App Router zu vermeiden.
 */
export function BackButton({
  href,
  label = 'Zurück',
  iconOnly = false,
  size = 'medium',
  variant = 'outlined',
}: BackButtonProps) {
  const router = useRouter();

  const startIcon = <ArrowBackIcon />;
  const sx = {
    color: 'text.secondary',
    borderColor: 'divider',
    '&:hover': {
      borderColor: 'text.secondary',
      backgroundColor: 'action.hover',
    },
  };

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }} aria-label={iconOnly ? label : undefined}>
        <Button
          component="span"
          startIcon={iconOnly ? undefined : startIcon}
          variant={variant}
          size={size}
          sx={variant === 'outlined' ? sx : undefined}
          aria-label={iconOnly ? label : undefined}
        >
          {iconOnly ? <ArrowBackIcon /> : label}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      onClick={() => router.back()}
      startIcon={iconOnly ? undefined : startIcon}
      variant={variant}
      size={size}
      sx={variant === 'outlined' ? sx : undefined}
      aria-label={iconOnly ? label : undefined}
    >
      {iconOnly ? <ArrowBackIcon /> : label}
    </Button>
  );
}
