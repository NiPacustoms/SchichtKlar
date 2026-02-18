#!/usr/bin/env node
/**
 * Stellt .next/export-marker.json her, falls Next.js 15 (App Router) sie nicht erzeugt.
 * Firebase Hosting (firebase-tools) erwartet diese Datei für die Next.js-Integration.
 * Siehe: firebase-tools src/frameworks/next/utils.ts usesNextImage()
 */
const fs = require('fs');
const path = require('path');

const distDir = process.env.NEXT_DIST_DIR || '.next';
const markerPath = path.join(process.cwd(), distDir, 'export-marker.json');

if (fs.existsSync(markerPath)) {
  process.exit(0);
}

const dir = path.dirname(markerPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const content = JSON.stringify(
  { isNextImageImported: false },
  null,
  2
);
fs.writeFileSync(markerPath, content, 'utf8');
console.log('[scripts/ensure-export-marker.js] Created', markerPath);
