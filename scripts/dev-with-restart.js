#!/usr/bin/env node

/**
 * Dev-Server mit Auto-Restart bei Crash (Next.js 15 ENOENT-Workaround).
 * Startet "npm run dev" neu, wenn der Prozess beendet wird (z. B. durch _buildManifest.js.tmp ENOENT).
 */

const { spawn } = require('child_process');

const RESTART_DELAY_MS = 2500;

function runDev() {
  return new Promise((resolve) => {
    // "dev" nutzen (mit fix-manifest), ohne erneutes fix-manifest im Loop
    const child = spawn(
      'npx',
      ['next', 'dev', '-p', '3000'],
      {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd(),
        env: { ...process.env, TURBOPACK: '0', NEXT_WEBPACK_CACHE: '0' },
      }
    );

    child.on('close', (code, signal) => {
      resolve({ code, signal });
    });

    child.on('error', (err) => {
      console.error('Dev server error:', err.message);
      resolve({ code: 1 });
    });
  });
}

async function main() {
  let runCount = 0;
  for (;;) {
    runCount += 1;
    if (runCount > 1) {
      console.log('\n⏳ Neustart in', RESTART_DELAY_MS / 1000, 'Sekunden... (Strg+C zum Beenden)\n');
      await new Promise((r) => setTimeout(r, RESTART_DELAY_MS));
    }
    const { code, signal } = await runDev();
    if (signal === 'SIGINT' || signal === 'SIGTERM') {
      process.exit(0);
    }
    if (code !== 0) {
      console.error('\n⚠️  Dev-Server beendet (Exit-Code', code, '). Neustart...');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
