const path = require('path');

/** @type {import('next').NextConfig} */
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://firestore.googleapis.com https://firebase.googleapis.com https://firebasestorage.googleapis.com https://firebasedynamiclinks.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://fcm.googleapis.com https://www.google-analytics.com wss:;
  media-src 'self' https://firebasestorage.googleapis.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  worker-src 'self';
  object-src 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'no-referrer',
  },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), autoplay=(self), clipboard-read=(self), clipboard-write=(self)',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'unsafe-none',
  },
];

const nextConfig = {
  // output: 'standalone' deaktiviert: Verursacht bei Next.js 15 während "Collecting page data"
  // MODULE_NOT_FOUND für Server-Chunks (z. B. ./7992.js). Normaler Build + Deploy funktioniert.
  // Für Firebase Hosting: Standard-Build nutzen (kein Standalone nötig).

  // Absolute minimale Konfiguration für Next.js 15/16 Stabilität
  transpilePackages: ['recharts'],
  // Turbopack (Next 16): Projektroot setzen, damit "app" nicht fälschlich als Root erkannt wird
  turbopack: {
    root: __dirname,
  },
  // ESLint: in Next.js 16 nicht mehr in next.config.js – nutze next lint / eslint direkt
  // TypeScript-Fehler während Build prüfen
  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint: Build nutzt veraltete Optionen (useEslintrc/extensions). Lint läuft in CI via npm run lint:ci.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Image Optimization Konfiguration für Firebase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  // WebSocket HMR Konfiguration (entfernt - nicht mehr unterstützt in Next.js 15)
  // webSocketServer wurde entfernt, da es in Next.js 15 nicht mehr unterstützt wird
  webpack: (config, { dev, isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    // Erzwinge Alias '@' → Projektroot für CI/Hosting Builder
    config.resolve.alias['@'] = path.resolve(__dirname);
    
    // Performance-Optimierungen für Development
    if (dev) {
      // Optimiere Watch-Optionen, um unnötige Rebuilds zu vermeiden
      config.watchOptions = {
        ...config.watchOptions,
        // Ignoriere node_modules und .next Verzeichnisse
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/.git/**',
          '**/functions/**',
          '**/coverage/**',
          '**/dist/**',
          '**/build/**',
        ],
        // Aggregiere Änderungen für 300ms, bevor ein Rebuild ausgelöst wird
        aggregateTimeout: 300,
        // Polling nur als Fallback, wenn native Watch nicht funktioniert
        poll: false,
      };
      
      // Optimiere Cache für schnellere Rebuilds (ohne config als buildDependency,
      // um falsche "next.config.js changed" Neustarts beim ersten Kompilieren von / zu vermeiden)
      config.cache = {
        ...config.cache,
        type: 'filesystem',
      };
      
      // WebSocket-Fehler in Development unterdrücken (von Browser-Erweiterungen)
      if (!isServer) {
        config.ignoreWarnings = [
          ...(config.ignoreWarnings || []),
          {
            module: /use-websocket/,
            message: /WebSocket connection failed/,
          },
        ];
      }
    }
    
    // Fix für fehlende server-reference-manifest.json Dateien
    if (dev && isServer) {
      const fs = require('fs');
      const manifestContent = JSON.stringify({ node: {}, edge: {} }, null, 2);
      let manifestCheckScheduled = false;
      
      // Plugin zum Erstellen fehlender Manifest-Dateien (optimiert)
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('FixManifestPlugin', () => {
            // Verhindere mehrfache gleichzeitige Ausführungen
            if (manifestCheckScheduled) return;
            manifestCheckScheduled = true;
            
            // Verwende process.nextTick statt setTimeout für bessere Performance
            process.nextTick(() => {
              try {
                const serverAppDir = path.join(__dirname, '.next', 'server', 'app');
                if (fs.existsSync(serverAppDir)) {
                  function ensureManifest(dir) {
                    const manifestPath = path.join(dir, 'server-reference-manifest.json');
                    if (!fs.existsSync(manifestPath)) {
                      fs.writeFileSync(manifestPath, manifestContent);
                    }
                  }
                  
                  function walkDir(dir) {
                    try {
                      const files = fs.readdirSync(dir);
                      for (const file of files) {
                        const filePath = path.join(dir, file);
                        const stat = fs.statSync(filePath);
                        if (stat.isDirectory()) {
                          walkDir(filePath);
                        } else if (file.startsWith('page.')) {
                          ensureManifest(dir);
                          const pageDir = path.join(dir, 'page');
                          if (fs.existsSync(pageDir) && fs.statSync(pageDir).isDirectory()) {
                            ensureManifest(pageDir);
                          }
                        }
                      }
                    } catch (e) {
                      // Ignoriere Fehler
                    }
                  }
                  walkDir(serverAppDir);
                }
              } catch (e) {
                // Ignoriere Fehler
              } finally {
                manifestCheckScheduled = false;
              }
            });
          });
        }
      });
    }
    
    return config;
  },
  async redirects() {
    // Keine englischen URLs – nur deutsche Routen (z. B. /anmelden, /employee/dienstplan)
    return [];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
