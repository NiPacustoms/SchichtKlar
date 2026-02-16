#!/usr/bin/env node
/**
 * Teilt ALLE_DOKUMENTATION.md in Teile mit maximal 20000 Zeichen.
 * Nutzung: node scripts/split-docs.js
 */

const fs = require('fs');
const path = require('path');

const MAX_CHARS = 20000;
const SOURCE = path.join(__dirname, '..', 'docs', 'ALLE_DOKUMENTATION.md');
const OUT_DIR = path.join(__dirname, '..', 'docs', 'ALLE_DOKUMENTATION_PARTS');

const content = fs.readFileSync(SOURCE, 'utf8');
const totalChars = content.length;
const parts = [];
let start = 0;
let partIndex = 1;

// Header-Länge abziehen, damit Teil inkl. Header ≤ MAX_CHARS
const headerTemplate = (i, s, e, t) => `# JobFlow – Dokumentation Teil ${i}\n\n*Zeichen ${s}–${e} von ${t}*\n\n---\n\n`;
const headerLen = headerTemplate(1, 1, 1, 1).length;
const maxChunk = MAX_CHARS - headerLen - 50; // Puffer für Zeilenumbrüche

while (start < content.length) {
  let end = Math.min(start + maxChunk, content.length);
  if (end < content.length) {
    const lastNewline = content.lastIndexOf('\n', end);
    if (lastNewline > start + maxChunk * 0.7) end = lastNewline + 1;
  }
  const chunk = content.slice(start, end);
  const header = headerTemplate(partIndex, start + 1, end, totalChars);
  parts.push({ index: partIndex, content: header + chunk, chars: header.length + chunk.length });
  start = end;
  partIndex++;
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const indexLines = ['# JobFlow – Dokumentation (Index)\n', '\nAufteilung von ALLE_DOKUMENTATION.md in Teile mit max. 20.000 Zeichen.\n\n', '| Teil | Datei | Zeichen |\n', '|------|-------|--------|\n'];

parts.forEach((p) => {
  const filename = `ALLE_DOKUMENTATION_${String(p.index).padStart(3, '0')}.md`;
  const filepath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filepath, p.content, 'utf8');
  const startChar = parts.find((x) => x.index === p.index) ? content.indexOf(p.content.replace(/^[\s\S]*?---\n\n/, '')) + 1 : '-';
  const range = p.content.match(/Zeichen (\d+)–(\d+)/);
  const rangeStr = range ? `${range[1]}–${range[2]}` : '-';
  indexLines.push(`| ${p.index} | [${filename}](./ALLE_DOKUMENTATION_PARTS/${filename}) | ${rangeStr} |\n`);
});

indexLines.push('\n---\n\n*Erstellt: ' + new Date().toISOString().slice(0, 10) + '*\n');
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'ALLE_DOKUMENTATION_INDEX.md'), indexLines.join(''), 'utf8');

console.log(`Erstellt: ${parts.length} Teildateien in docs/ALLE_DOKUMENTATION_PARTS/`);
console.log(`Index: docs/ALLE_DOKUMENTATION_INDEX.md`);
parts.forEach((p) => {
  const filename = `ALLE_DOKUMENTATION_${String(p.index).padStart(3, '0')}.md`;
  console.log(`  ${filename}: ${p.content.length} Zeichen`);
});
