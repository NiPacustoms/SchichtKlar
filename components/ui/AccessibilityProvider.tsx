'use client';

import React, { memo, useEffect, useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { VolumeUp } from '@mui/icons-material';

interface AccessibilityFeaturesProps {
  children: React.ReactNode;
  skipToContent?: boolean;
  announceChanges?: boolean;
  highContrast?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  reducedMotion?: boolean;
}

export const AccessibilityProvider = memo<AccessibilityFeaturesProps>(
  ({
    children,
    skipToContent = true,
    announceChanges = true,
    highContrast = false,
    fontSize = 'medium',
    reducedMotion = false,
  }) => {
    const announcementRef = useRef<HTMLDivElement>(null);
    const skipLinkRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
      // Apply accessibility styles
      const root = document.documentElement;

      if (highContrast) {
        root.style.setProperty('--contrast-mode', 'high');
      }

      if (reducedMotion) {
        root.style.setProperty('--motion-reduce', 'reduce');
      }

      // Font size adjustment
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px',
      };
      root.style.setProperty('--base-font-size', fontSizeMap[fontSize]);

      // Focus management
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          document.body.classList.add('keyboard-navigation');
        }
      };

      const handleMouseDown = () => {
        document.body.classList.remove('keyboard-navigation');
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleMouseDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleMouseDown);
      };
    }, [highContrast, reducedMotion, fontSize]);

    const announceToScreenReader = (message: string) => {
      if (announceChanges && announcementRef.current) {
        announcementRef.current.textContent = message;
        // Clear after announcement
        setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = '';
          }
        }, 1000);
      }
    };

    const handleSkipToContent = () => {
      const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
      if (mainContent) {
        mainContent.focus();
        announceToScreenReader('Zum Hauptinhalt gesprungen');
      }
    };

    return (
      <>
        {/* Screen reader announcements */}
        <Box
          ref={announcementRef}
          component="div"
          aria-live="polite"
          aria-atomic="true"
          sx={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        />

        {/* Skip to content link */}
        {skipToContent && (
          <Box
            component="a"
            ref={skipLinkRef}
            href="#main-content"
            onClick={handleSkipToContent}
            sx={{
              position: 'absolute',
              top: '-40px',
              left: '6px',
              background: 'primary.main',
              color: 'primary.contrastText',
              padding: '8px 16px',
              textDecoration: 'none',
              borderRadius: '4px',
              zIndex: 9999,
              '&:focus': {
                top: '6px',
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
              },
            }}
          >
            Zum Hauptinhalt springen
          </Box>
        )}

        {/* Accessibility controls */}
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1000,
            display: 'flex',
            gap: 1,
            flexDirection: 'column',
          }}
        >
          <Tooltip title="Ansage aktivieren/deaktivieren">
            <IconButton
              size="small"
              onClick={() => announceToScreenReader('Ansage umgeschaltet')}
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <VolumeUp fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Main content */}
        <Box
          id="main-content"
          tabIndex={-1}
          sx={{
            '&:focus': {
              outline: 'none',
            },
          }}
        >
          {children}
        </Box>

        {/* Global accessibility styles (styled-jsx) */}
        {/* eslint-disable-next-line react/no-unknown-property */}
        <style jsx global>{`
          .keyboard-navigation *:focus {
            outline: 2px solid var(--mui-palette-primary-main);
            outline-offset: 2px;
          }

          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }

          @media (prefers-contrast: high) {
            :root {
              --contrast-mode: high;
            }
          }

          /* High contrast mode */
          [data-contrast='high'] {
            filter: contrast(150%) brightness(110%);
          }

          /* Focus indicators */
          .focus-visible {
            outline: 2px solid var(--mui-palette-primary-main);
            outline-offset: 2px;
          }
        `}</style>
      </>
    );
  }
);

AccessibilityProvider.displayName = 'AccessibilityProvider';

export default AccessibilityProvider;
