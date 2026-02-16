#!/usr/bin/env node
/**
 * Merges all project Markdown files into one file without losing content.
 * Only scans: docs/, .cursor/, .github/, scripts/ and root *.md
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'ALLE_DOKUMENTATION.md');

function getMdInDir(dir, prefix = '') {
  const list = [];
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return list;
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  for (const e of entries) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    const full = path.join(fullDir, e.name);
    if (e.isDirectory()) {
      list.push(...getMdInDir(path.join(dir, e.name), rel));
    } else if (e.name.endsWith('.md')) {
      list.push(rel);
    }
  }
  return list;
}

const rootMd = fs.existsSync(ROOT)
  ? fs.readdirSync(ROOT, { withFileTypes: true }).filter((e) => !e.isDirectory() && e.name.endsWith('.md')).map((e) => e.name)
  : [];

const files = [
  ...rootMd,
  ...getMdInDir('docs', 'docs'),
  ...getMdInDir('.cursor', '.cursor'),
  ...getMdInDir('.github', '.github'),
  ...getMdInDir('scripts', 'scripts')
].sort();

const parts = [
  '# JobFlow – Konsolidierte Dokumentation',
  '',
  'Diese Datei enthält den vollständigen Inhalt aller Projekt-Markdown-Dateien, zusammengeführt am ' + new Date().toISOString().slice(0, 10) + '.',
  '',
  '## Inhaltsverzeichnis (Quelldateien)',
  '',
  ...files.map((f) => `- ${f}`),
  '',
  '---',
  ''
];

for (const rel of files) {
  const full = path.join(ROOT, rel);
  let content = '';
  try {
    content = fs.readFileSync(full, 'utf8');
  } catch (err) {
    content = `*(Fehler beim Lesen: ${err.message})*`;
  }
  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push(`## Quelle: ${rel}`);
  parts.push('');
  parts.push(content);
  parts.push('');
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, parts.join('\n'), 'utf8');
console.log('Written:', OUT);
console.log('Files merged:', files.length);
