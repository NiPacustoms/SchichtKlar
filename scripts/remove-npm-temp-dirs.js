#!/usr/bin/env node
/**
 * Entfernt temporäre npm-Ordner in node_modules (.* außer .bin),
 * die bei ENOTEMPTY-Fehlern stören. Danach: npm install ausführen.
 */
const fs = require('fs');
const path = require('path');

const nodeModules = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModules)) {
  console.log('node_modules fehlt – bitte npm install ausführen.');
  process.exit(0);
}

let removed = 0;
for (const name of fs.readdirSync(nodeModules)) {
  if (name.startsWith('.') && name !== '.bin') {
    const dir = path.join(nodeModules, name);
    if (fs.statSync(dir).isDirectory()) {
      try {
        fs.rmSync(dir, { recursive: true, maxRetries: 3 });
        console.log('Entfernt:', name);
        removed++;
      } catch (err) {
        console.warn('Konnte nicht entfernen:', name, err.message);
      }
    }
  }
}
console.log(removed ? `✓ ${removed} temporäre Ordner entfernt.` : 'Keine temporären Ordner gefunden.');
process.exit(0);
