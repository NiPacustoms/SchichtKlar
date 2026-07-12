#!/usr/bin/env node
/**
 * Schichtklar Brand-Asset-Generator
 *
 * Erzeugt aus der Vektor-Definition der Marke (Bildmarke + Wortmarke) alle
 * benötigten Assets: logo.svg / logo-dark.svg / logo-mark.svg, logo-default(-dark).png,
 * PWA-Icons (icons/icon-*.png), Favicons (favicon-*.png, favicon.svg, favicon.ico).
 *
 * Voraussetzung für pixelgenaue Wortmarke: Inter (SemiBold) muss für fontconfig
 * sichtbar sein (z. B. ~/.fonts/Inter-SemiBold.ttf + fc-cache). Ohne Inter fällt
 * librsvg auf eine Systemschrift zurück.
 *
 * Aufruf: node scripts/generate-brand-assets.mjs
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUB = path.resolve(process.cwd(), 'public');

// ——— Markenfarben (aus dem Original-Logo) ———
const NAVY = '#263250'; // Wortmarke + Solid-Kachel
const BLUE = '#2e6bf0'; // Person
const SAGE = '#8fc0ab'; // Kalender
const PERI = '#7d82ec'; // Uhr
const LIGHT = '#fafaf9'; // Wortmarke im Dark Mode

/** Bildmarke (96×96): 2×2-Kachelraster – Person / Kalender / Uhr / Solid, mit Verbindungssteg */
function markSvg() {
  return `
  <g>
    <!-- Verbindungssteg TL→BR (liegt unter den Kacheln) -->
    <rect x="38" y="42" width="18" height="18" rx="5" fill="${NAVY}"/>
    <!-- TL: Person (Blau) -->
    <rect x="6" y="12" width="40" height="40" rx="12" fill="${BLUE}"/>
    <circle cx="26" cy="27" r="5.6" fill="#ffffff"/>
    <path d="M16.5 45.5 v-1.2 c0-5.2 4.6-8.3 9.5-8.3 s9.5 3.1 9.5 8.3 v1.2 z" fill="#ffffff"/>
    <!-- TR: Kalender (Salbei) -->
    <rect x="52" y="6" width="36" height="36" rx="11" fill="${SAGE}"/>
    <rect x="59" y="15.5" width="22" height="18.5" rx="3" fill="#ffffff"/>
    <rect x="63.5" y="11.5" width="2.6" height="7" rx="1.3" fill="${SAGE}"/>
    <rect x="73.9" y="11.5" width="2.6" height="7" rx="1.3" fill="${SAGE}"/>
    <g fill="${SAGE}">
      <circle cx="64.5" cy="24" r="1.5"/><circle cx="70" cy="24" r="1.5"/><circle cx="75.5" cy="24" r="1.5"/>
      <circle cx="64.5" cy="29" r="1.5"/><circle cx="70" cy="29" r="1.5"/><circle cx="75.5" cy="29" r="1.5"/>
    </g>
    <!-- BL: Uhr (Blauviolett) -->
    <rect x="6" y="56" width="36" height="36" rx="11" fill="${PERI}"/>
    <circle cx="24" cy="74" r="9.5" fill="#ffffff"/>
    <path d="M24 68.5 V74 l4 2.6" stroke="${PERI}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <!-- BR: Solid (Navy) -->
    <rect x="50" y="50" width="40" height="40" rx="12" fill="${NAVY}"/>
  </g>`;
}

/** Volles Logo (Bildmarke + Wortmarke). textColor je nach Hintergrund. */
function lockupSvg(textColor) {
  // ViewBox großzügig – PNG wird nach dem Rastern auf Inhalt beschnitten (trim)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 96" width="420" height="96">
  ${markSvg()}
  <text x="112" y="63" font-family="Inter, 'Inter SemiBold', system-ui, sans-serif" font-weight="600"
        font-size="46" letter-spacing="-1" fill="${textColor}">Schichtklar</text>
</svg>`;
}

/** Nur Bildmarke als eigenständiges SVG (Favicons, PWA) */
function markOnlySvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">${markSvg()}</svg>`;
}

/** PNG aus SVG rendern (scale-fach überabgetastet), transparent beschneiden, auf Zielhöhe skalieren */
async function renderLockupPng(textColor, outFile, targetHeight) {
  const scale = 6; // 6× Overrendering → knackige Kanten nach Downscale
  const png = await sharp(Buffer.from(lockupSvg(textColor)), { density: 72 * scale })
    .png()
    .toBuffer();
  await sharp(png)
    .trim({ threshold: 1 })
    .resize({ height: targetHeight, fit: 'inside' })
    .png()
    .toFile(outFile);
}

/** Quadratisches Icon: Bildmarke zentriert; optional Hintergrund + Padding (maskable-sicher) */
async function renderSquareIcon(size, outFile, { background = null, padRatio = 0 } = {}) {
  const inner = Math.round(size * (1 - padRatio * 2));
  const mark = await sharp(Buffer.from(markOnlySvg()), { density: (72 * inner) / 96 })
    .resize(inner, inner)
    .png()
    .toBuffer();
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
  const off = Math.round((size - inner) / 2);
  await canvas
    .composite([{ input: mark, left: off, top: off }])
    .png()
    .toFile(outFile);
}

/** Minimaler ICO-Container mit eingebettetem PNG (gültig ab Windows Vista / alle Browser) */
function pngToIco(pngBuffer, size) {
  const header = Buffer.alloc(6 + 16);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count
  header.writeUInt8(size >= 256 ? 0 : size, 6); // width (0 = 256)
  header.writeUInt8(size >= 256 ? 0 : size, 7); // height
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bpp
  header.writeUInt32LE(pngBuffer.length, 14); // bytes
  header.writeUInt32LE(22, 18); // offset
  return Buffer.concat([header, pngBuffer]);
}

async function main() {
  await mkdir(path.join(PUB, 'icons'), { recursive: true });

  // 1) SVGs
  await writeFile(path.join(PUB, 'logo.svg'), lockupSvg(NAVY));
  await writeFile(path.join(PUB, 'logo-dark.svg'), lockupSvg(LIGHT));
  await writeFile(path.join(PUB, 'logo-mark.svg'), markOnlySvg());
  await writeFile(path.join(PUB, 'favicon.svg'), markOnlySvg());

  // 2) Logo-PNGs (Header/Fallback; @2x für Retina)
  await renderLockupPng(NAVY, path.join(PUB, 'logo-default.png'), 192);
  await renderLockupPng(LIGHT, path.join(PUB, 'logo-default-dark.png'), 192);

  // 3) PWA-Icons (weißer Grund + 12 % Padding → maskable-sicher)
  for (const s of [72, 96, 128, 144, 152, 192, 384, 512]) {
    await renderSquareIcon(s, path.join(PUB, 'icons', `icon-${s}x${s}.png`), {
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      padRatio: 0.12,
    });
  }

  // 4) Favicons (transparent, Bildmarke bündig)
  for (const s of [32, 64, 96, 128, 256, 512]) {
    await renderSquareIcon(s, path.join(PUB, `favicon-${s}.png`), { padRatio: 0.02 });
  }
  // Legacy-Namen in /icons (16/32) für metadata
  await renderSquareIcon(16, path.join(PUB, 'icons', 'icon-16x16.png'), { padRatio: 0 });
  await renderSquareIcon(32, path.join(PUB, 'icons', 'icon-32x32.png'), { padRatio: 0 });

  // 5) favicon.ico (32 px, PNG-in-ICO)
  const png32 = await sharp(Buffer.from(markOnlySvg()), { density: 24 }).resize(32, 32).png().toBuffer();
  const ico = pngToIco(png32, 32);
  await writeFile(path.join(PUB, 'favicon.ico'), ico);
  await writeFile(path.join(PUB, 'icons', 'favicon.ico'), ico);

  console.log('✔ Brand-Assets erzeugt (logo*, icons/*, favicon*)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
