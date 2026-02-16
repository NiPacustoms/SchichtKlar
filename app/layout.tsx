import { MUIThemeProviderWrapper } from '@/components/ThemeProvider';
import { ThemeModeProvider } from '@/contexts/ThemeModeContext';
import { EmotionRegistry } from '@/components/EmotionRegistry';
import { ConditionalHeader } from '@/components/layout/ConditionalHeader';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { CookieBanner } from '@/components/legal/CookieBanner';
// import BottomNav from '@/components/layout/BottomNavigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { GlobalErrorBoundary } from '@/components/errors/GlobalErrorBoundary';
import { validateLegalConfig } from '@/lib/config/legal';
import { logger } from '@/lib/logging';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

// Production safety check: Validiere Legal-Config beim Import
// Nur in Production validieren, nicht in Development
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    validateLegalConfig();
  } catch (error) {
    // In Production sollte dies einen Fehler werfen, aber wir loggen es auch
    logger.error(
      'Legal config validation failed',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = {
  title: 'JobFlow - Zeitarbeits-App',
  description: 'DSGVO-konforme Zeitarbeits-App für medizinisches Personal',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
  other: {
    'font-display': 'swap',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Emotion Insertion Point zur stabilen Style-Reihenfolge (SSR/Client) */}
        <meta name="emotion-insertion-point" content="" />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#4CAF50" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JobFlow" />
        {/* Service Worker Registration - nur in Production */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Warte bis window verfügbar ist (verhindert Hydration-Fehler)
                if (typeof window === 'undefined') return;
                
                if ('serviceWorker' in navigator) {
                  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                  
                  if (isDevelopment) {
                    // In Development: Alle Service Worker SOFORT deaktivieren
                    // Wichtig: Synchron ausführen, bevor andere Scripts laden
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                      if (registrations.length > 0) {
                        logger.info('🔧 [SW] Deactivating Service Workers in development mode');
                        registrations.forEach((registration) => {
                          registration.unregister().then((success) => {
                            if (success) {
                              logger.info('✅ [SW] Service Worker unregistered successfully');
                            }
                          }).catch((error) => {
                            logger.warn('⚠️ [SW] Error unregistering service worker', error instanceof Error ? error.message : String(error));
                          });
                        });
                        // Zusätzlich: Alle Caches löschen
                        if ('caches' in window) {
                          caches.keys().then((cacheNames) => {
                            cacheNames.forEach((cacheName) => {
                              caches.delete(cacheName);
                            });
                          });
                        }
                      }
                    });
                  } else {
                    // In Production: Service Worker registrieren mit verbesserter Fehlerbehandlung
                    const initServiceWorkers = () => {
                      const firebaseConfig = {
                        apiKey: '${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}',
                        authDomain: '${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}',
                        projectId: '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}',
                        storageBucket: '${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}',
                        messagingSenderId: '${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}',
                        appId: '${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}',
                      };
                      
                      // Helper: Sende Firebase-Konfiguration an Service Worker
                      const sendFirebaseConfig = (registration) => {
                        const sendConfig = (target) => {
                          if (target) {
                            try {
                              target.postMessage({
                                type: 'FIREBASE_CONFIG',
                                config: firebaseConfig
                              });
                              logger.info('✅ [SW] Firebase config sent to service worker');
                            } catch (error) {
                              logger.warn('⚠️ [SW] Failed to send Firebase config', error instanceof Error ? error.message : String(error));
                            }
                          }
                        };
                        
                        if (registration.active) {
                          sendConfig(registration.active);
                        } else if (registration.installing) {
                          registration.installing.addEventListener('statechange', function() {
                            if (this.state === 'activated' && registration.active) {
                              sendConfig(registration.active);
                            }
                          });
                        } else if (registration.waiting) {
                          sendConfig(registration.waiting);
                        }
                      };
                      
                      // Registriere Haupt-Service Worker
                      navigator.serviceWorker.register('/sw.js')
                        .then((registration) => {
                          logger.info('✅ [SW] Registered', { scope: registration?.scope });
                          
                          // Prüfe auf Updates
                          registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            if (newWorker) {
                              newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                  logger.info('🔄 [SW] New service worker available');
                                }
                              });
                            }
                          });
                        })
                        .catch((error) => {
                          logger.error('❌ [SW] Registration failed', error instanceof Error ? error.message : String(error));
                        });
                      
                      // Registriere Firebase Messaging Service Worker mit Retry-Logik
                      const registerFirebaseSW = (retryCount = 0) => {
                        const maxRetries = 3;
                        const retryDelay = 1000 * (retryCount + 1);
                        
                        navigator.serviceWorker.register('/firebase-messaging-sw.js')
                          .then((registration) => {
                            logger.info('✅ [SW] Firebase messaging SW registered', { scope: registration?.scope });
                            
                            // Warte auf Aktivierung und sende dann Konfiguration
                            const waitForActivation = () => {
                              if (registration.active) {
                                sendFirebaseConfig(registration);
                              } else if (registration.installing) {
                                registration.installing.addEventListener('statechange', function() {
                                  if (this.state === 'activated') {
                                    sendFirebaseConfig(registration);
                                  }
                                });
                              } else if (registration.waiting) {
                                // Aktiviere waiting worker
                                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                                sendFirebaseConfig(registration);
                              } else {
                                // Warte kurz und versuche es erneut
                                setTimeout(() => {
                                  if (registration.active) {
                                    sendFirebaseConfig(registration);
                                  }
                                }, 500);
                              }
                            };
                            
                            waitForActivation();
                          })
                          .catch((registrationError) => {
                            if (retryCount < maxRetries) {
                              logger.warn('⚠️ [SW] Firebase messaging SW registration failed, retrying...', { attempt: retryCount + 1, maxRetries });
                              setTimeout(() => registerFirebaseSW(retryCount + 1), retryDelay);
                            } else {
                              logger.error('❌ [SW] Firebase messaging SW registration failed after retries', registrationError instanceof Error ? registrationError.message : String(registrationError));
                            }
                          });
                      };
                      
                      registerFirebaseSW();
                    };
                    
                    // Initialisiere Service Worker nach dem Laden der Seite
                    if (document.readyState === 'complete' || document.readyState === 'interactive') {
                      // Seite ist bereits geladen
                      setTimeout(initServiceWorkers, 0);
                    } else {
                      window.addEventListener('load', initServiceWorkers);
                    }
                  }
                } else {
                  logger.warn('⚠️ [SW] Service Workers werden von diesem Browser nicht unterstützt');
                }
              })();
            `,
          }}
        />
        {/* WebSocket Error Suppression für Browser-Erweiterungen und HMR */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Unterdrücke WebSocket-Fehler von Browser-Erweiterungen und HMR
                const originalError = console.error;
                const originalWarn = console.warn;
                
                // Verbesserte Fehler-Unterdrückung für HMR WebSocket
                console.error = function(...args) {
                  const message = args.join(' ');
                  const firstArg = args[0]?.toString() || '';
                  
                  // Unterdrücke WebSocket-Fehler für HMR (verschiedene Varianten)
                  const isHMRWebSocketError = 
                    (message.includes('use-websocket.ts') || firstArg.includes('use-websocket.ts')) &&
                    (message.includes('WebSocket connection') || firstArg.includes('WebSocket connection')) &&
                    (message.includes('webpack-hmr') || message.includes('_next/webpack-hmr') || 
                     firstArg.includes('webpack-hmr') || firstArg.includes('_next/webpack-hmr') ||
                     message.includes('ws://localhost') || firstArg.includes('ws://localhost'));
                  
                  if (isHMRWebSocketError) {
                    // Fehler stillschweigend ignorieren - HMR funktioniert trotzdem
                    return;
                  }
                  
                  originalError.apply(console, args);
                };
                
                // Auch Warnungen für WebSocket unterdrücken
                console.warn = function(...args) {
                  const message = args.join(' ');
                  const firstArg = args[0]?.toString() || '';
                  
                  const isHMRWebSocketWarning = 
                    (message.includes('use-websocket.ts') || firstArg.includes('use-websocket.ts')) &&
                    (message.includes('WebSocket') || firstArg.includes('WebSocket')) &&
                    (message.includes('webpack-hmr') || message.includes('_next/webpack-hmr') ||
                     firstArg.includes('webpack-hmr') || firstArg.includes('_next/webpack-hmr'));
                  
                  if (isHMRWebSocketWarning) {
                    return;
                  }
                  
                  originalWarn.apply(console, args);
                };
                
                // Globaler Error Handler für WebSocket-Fehler (früher abfangen)
                const originalErrorHandler = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  const errorMessage = String(message || '');
                  const errorSource = String(source || '');
                  const errorStack = error?.stack || '';
                  const allErrorText = errorMessage + ' ' + errorSource + ' ' + errorStack;
                  
                  // Unterdrücke WebSocket-Fehler für HMR
                  if ((allErrorText.includes('WebSocket') || allErrorText.includes('use-websocket')) &&
                      (allErrorText.includes('webpack-hmr') || allErrorText.includes('_next/webpack-hmr') ||
                       allErrorText.includes('ws://localhost:3000'))) {
                    // Verhindere, dass der Fehler weiter propagiert wird
                    return true;
                  }
                  
                  // Weiterleiten an ursprünglichen Handler, falls vorhanden
                  if (originalErrorHandler) {
                    return originalErrorHandler(message, source, lineno, colno, error);
                  }
                  
                  return false;
                };
                
                // Event Listener für Fehler (zusätzliche Absicherung)
                window.addEventListener('error', function(event) {
                  const errorMessage = event.message || '';
                  const errorSource = event.filename || '';
                  const errorStack = event.error?.stack || '';
                  const allErrorText = errorMessage + ' ' + errorSource + ' ' + errorStack;
                  
                  // Unterdrücke WebSocket-Fehler für HMR
                  if ((allErrorText.includes('WebSocket') || allErrorText.includes('use-websocket')) &&
                      (allErrorText.includes('webpack-hmr') || allErrorText.includes('_next/webpack-hmr') ||
                       allErrorText.includes('ws://localhost:3000'))) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    return false;
                  }
                }, true);
                
                // Unterdrücke unhandled promise rejections für WebSocket
                window.addEventListener('unhandledrejection', function(event) {
                  const reason = event.reason?.message || event.reason?.toString() || '';
                  const reasonStack = event.reason?.stack || '';
                  const allReasonText = reason + ' ' + reasonStack;
                  
                  if ((allReasonText.includes('WebSocket') || allReasonText.includes('use-websocket')) &&
                      (allReasonText.includes('webpack-hmr') || allReasonText.includes('_next/webpack-hmr') ||
                       allReasonText.includes('ws://localhost:3000'))) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable}`} suppressHydrationWarning>
        <EmotionRegistry>
          <GlobalErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
            <QueryProvider>
              <AuthProvider>
                <ThemeModeProvider>
                  <MUIThemeProviderWrapper>
                    <ConditionalHeader />
                    {children}
                    <InstallPrompt />
                    <CookieBanner />
                  </MUIThemeProviderWrapper>
                </ThemeModeProvider>
              </AuthProvider>
            </QueryProvider>
          </GlobalErrorBoundary>
        </EmotionRegistry>

        {/* E2E-Test-Flag als Runtime-Variable */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && '${process.env.NEXT_PUBLIC_E2E_TEST}' === 'true') {
                  window.__E2E_TEST_MODE__ = true;
                  // Rückwärtskompatibilität
                  window.__JOBFLOW_E2E_TEST = true;
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
