#!/usr/bin/env node

/**
 * Script to fix missing server-reference-manifest.json files
 * This is a workaround for a Next.js 15 bug where these files are not generated
 * for client components that don't use server actions.
 */

const fs = require('fs');
const path = require('path');

const manifestContent = JSON.stringify({ node: {}, edge: {} }, null, 2);

function ensureManifest(dir) {
  const manifestPath = path.join(dir, 'server-reference-manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, manifestContent);
    console.log(`Created: ${manifestPath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file === 'page.js' || file === 'page.jsx' || file === 'page.ts' || file === 'page.tsx' || file.startsWith('page.')) {
      // Found a page file, ensure manifest exists in same directory
      ensureManifest(dir);
      // Also check if there's a 'page' subdirectory
      const pageDir = path.join(dir, 'page');
      if (fs.existsSync(pageDir) && fs.statSync(pageDir).isDirectory()) {
        ensureManifest(pageDir);
      }
    }
  }
}

// Find all page directories in .next/server/app
const nextServerDir = path.join(process.cwd(), '.next', 'server', 'app');

if (fs.existsSync(nextServerDir)) {
  walkDir(nextServerDir);
  console.log('Manifest files checked/created');
} else {
  console.log('.next/server/app directory does not exist yet');
}

