#!/usr/bin/env ts-node

/**
 * Script zum Ersetzen von console.log/error/warn/info durch Logger
 * 
 * Verwendung:
 *   npm run replace-console-logs
 *   oder
 *   ts-node scripts/replace-console-logs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'build/**',
  'scripts/**',
  'functions/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
];

interface Replacement {
  pattern: RegExp;
  replacement: string;
  loggerMethod: string;
}

const replacements: Replacement[] = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    loggerMethod: 'info',
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    loggerMethod: 'error',
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    loggerMethod: 'warn',
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info(',
    loggerMethod: 'info',
  },
];

function needsLoggerImport(content: string): boolean {
  // Prüft, ob logger bereits importiert ist
  return /import.*logger.*from|from.*['"]@\/lib\/errors['"]|from.*['"]@\/lib\/logging['"]/.test(content);
}

function addLoggerImport(content: string): string {
  const importStatement = "import { logger } from '@/lib/logging';\n";

  // Finde die erste Import-Zeile oder 'use client'/'use server'
  const lines = content.split('\n');
  let insertIndex = 0;

  // Überspringe 'use client' oder 'use server'
  if (lines[0]?.includes("'use client'") || lines[0]?.includes('"use client"')) {
    insertIndex = 1;
  } else if (lines[0]?.includes("'use server'") || lines[0]?.includes('"use server"')) {
    insertIndex = 1;
  }

  // Finde die erste Import-Zeile
  for (let i = insertIndex; i < lines.length; i++) {
    if (lines[i]?.trim().startsWith('import ')) {
      insertIndex = i;
      break;
    }
  }

  // Füge Import hinzu
  lines.splice(insertIndex, 0, importStatement);
  return lines.join('\n');
}

function processFile(filePath: string): { replaced: number; needsImport: boolean } {
  let content = fs.readFileSync(filePath, 'utf-8');
  let replaced = 0;
  let needsImport = false;

  // Prüfe, ob Datei console.* verwendet
  const hasConsole = /console\.(log|error|warn|info)\(/.test(content);
  if (!hasConsole) {
    return { replaced: 0, needsImport: false };
  }

  // Ersetze alle console.* Aufrufe
  for (const { pattern, replacement } of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      replaced += matches.length;
      needsImport = true;
    }
  }

  // Füge Logger-Import hinzu, falls nötig
  if (needsImport && !needsLoggerImport(content)) {
    content = addLoggerImport(content);
  }

  // Schreibe Datei zurück
  fs.writeFileSync(filePath, content, 'utf-8');

  return { replaced, needsImport };
}

async function main() {
  console.log('🔍 Suche nach console.log/error/warn/info Statements...\n');

  // Finde alle TypeScript/TSX-Dateien
  const files = await glob('**/*.{ts,tsx}', {
    cwd: PROJECT_ROOT,
    ignore: EXCLUDE_PATTERNS,
    absolute: true,
  });

  console.log(`📁 ${files.length} Dateien gefunden\n`);

  let totalReplaced = 0;
  let filesModified = 0;
  const modifiedFiles: string[] = [];

  for (const file of files) {
    const relativePath = path.relative(PROJECT_ROOT, file);
    
    try {
      const result = processFile(file);
      if (result.replaced > 0) {
        totalReplaced += result.replaced;
        filesModified++;
        modifiedFiles.push(relativePath);
        console.log(`✅ ${relativePath}: ${result.replaced} Ersetzungen`);
      }
    } catch (error) {
      console.error(`❌ Fehler bei ${relativePath}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Zusammenfassung:`);
  console.log(`   - Dateien verarbeitet: ${files.length}`);
  console.log(`   - Dateien geändert: ${filesModified}`);
  console.log(`   - Gesamt Ersetzungen: ${totalReplaced}`);
  console.log('='.repeat(60));

  if (modifiedFiles.length > 0) {
    console.log('\n📝 Geänderte Dateien:');
    modifiedFiles.forEach(file => console.log(`   - ${file}`));
  }

  console.log('\n✨ Fertig! Bitte prüfen Sie die Änderungen mit git diff.');
}

main().catch(error => {
  console.error('❌ Fehler:', error);
  process.exit(1);
});

