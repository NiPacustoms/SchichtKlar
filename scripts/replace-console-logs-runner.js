#!/usr/bin/env node
/**
 * Sync runner für replace-console-logs – findet .ts/.tsx Dateien ohne glob-Paket.
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXCLUDE_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'scripts', 'functions', '.git']);
const EXCLUDE_FILES = /\.(test|spec)\.(ts|tsx)$/;

function collectTsFiles(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.has(e.name)) collectTsFiles(full, list);
    } else if (/\.(ts|tsx)$/.test(e.name) && !EXCLUDE_FILES.test(e.name)) {
      list.push(full);
    }
  }
  return list;
}

const replacements = [
  [/\bconsole\.log\(/g, 'logger.info('],
  [/\bconsole\.error\(/g, 'logger.error('],
  [/\bconsole\.warn\(/g, 'logger.warn('],
  [/\bconsole\.info\(/g, 'logger.info('],
];

function needsLoggerImport(content) {
  return /import.*logger.*from|from.*['"]@\/lib\/(errors|logging)['"]/.test(content);
}

function addLoggerImport(content) {
  const importLine = "import { logger } from '@/lib/logging';\n";
  const lines = content.split('\n');
  let insertIndex = 0;
  if (lines[0] && (lines[0].includes("'use client'") || lines[0].includes('"use client"') || lines[0].includes("'use server'") || lines[0].includes('"use server"'))) {
    insertIndex = 1;
  }
  for (let i = insertIndex; i < lines.length; i++) {
    if (lines[i] && lines[i].trim().startsWith('import ')) {
      insertIndex = i;
      break;
    }
  }
  lines.splice(insertIndex, 0, importLine);
  return lines.join('\n');
}

const SKIP_FILES = ['lib/utils/logger.ts', 'lib/errors/ErrorLogger.ts'];

function processFile(filePath) {
  const rel = path.relative(PROJECT_ROOT, filePath);
  if (SKIP_FILES.some(skip => rel === skip || rel.replace(/\\/g, '/') === skip)) return 0;
  let content = fs.readFileSync(filePath, 'utf-8');
  if (!/console\.(log|error|warn|info)\(/.test(content)) return 0;
  let replaced = 0;
  for (const [pattern, replacement] of replacements) {
    const before = content;
    content = content.replace(pattern, replacement);
    const count = (before.match(pattern) || []).length;
    replaced += count;
  }
  if (replaced > 0 && !needsLoggerImport(content)) {
    content = addLoggerImport(content);
  }
  if (replaced > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  return replaced;
}

const files = collectTsFiles(PROJECT_ROOT);
let totalReplaced = 0;
const modified = [];
for (const file of files) {
  try {
    const n = processFile(file);
    if (n > 0) {
      totalReplaced += n;
      modified.push(path.relative(PROJECT_ROOT, file));
    }
  } catch (err) {
    console.error('Fehler:', path.relative(PROJECT_ROOT, file), err.message);
  }
}
console.log('Ersetzungen:', totalReplaced, 'in', modified.length, 'Dateien');
if (modified.length) modified.forEach(f => console.log('  -', f));
